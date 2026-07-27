using Gamehub.Server.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Net.NetworkInformation;
using System.Xml.Linq;


namespace Gamehub.Server.Services
{
    public class UserServices
    {

        private readonly IMongoCollection<User> _userCollection;

        public UserServices(IOptions<UserDatabaseSetting> userServices)
        {
            var mongoClient = new MongoClient(userServices.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(userServices.Value.DatabaseName);

            _userCollection = mongoDatabase.GetCollection<User>(userServices.Value.UserCollectionName);

        }

        public async Task<List<User>> GetAsync() => await _userCollection.Find(x => true).ToListAsync();
        public async Task<User> GetAsync(string id)
        {
            if (!ObjectId.TryParse(id, out _))
                return null!;

            return await _userCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
        }
        public async Task<User> GetByEmailAsync(string email) =>
            await _userCollection.Find(x => x.Email == email.Trim().ToLowerInvariant()).FirstOrDefaultAsync();

        public async Task<List<SimplifiedUser>> SearchUsersAsync(string query)
        {
            var users = await _userCollection.Find(u => u.Nickname.ToLower().StartsWith(query.ToLower()))
                                             .ToListAsync();
            var orderedUsers = users.OrderByDescending(u => (u.Followers ?? new List<string>()).Count).Take(5);
            var simplifiedUsers = orderedUsers.Select(u => new SimplifiedUser
            {
                UserId = u.Id,
                NickName = u.Nickname,
                UserImageSrc = u.ImageSrc,
                BackgroundImage = u.BackgroundImage
            }).ToList();

            return simplifiedUsers;
        }

        public async Task<List<SimplifiedUser>> SearchAllUsersAsync(string query)
        {
            var users = await _userCollection.Find(u => u.Nickname.ToLower().Contains(query.ToLower()))
                                             .ToListAsync();
            var simplifiedUsers = users.Select(u => new SimplifiedUser
            {
                UserId = u.Id,
                NickName = u.Nickname,
                UserImageSrc = u.ImageSrc,
                BackgroundImage = u.BackgroundImage
            }).ToList();

            return simplifiedUsers;
        }

        public async Task<User> CreateAsync(User user)
        {
            user.Id = null;
            await _userCollection.InsertOneAsync(user);
            user.Id = user.Id ?? _userCollection.Find(x => x.Id == user.Id).FirstOrDefault()?.Id;
            return user;
        }

        public async Task<bool> NicknameExistsAsync(string nickname, string? exceptUserId = null)
        {
            var user = await _userCollection
                .Find(x => x.Nickname == nickname && (exceptUserId == null || x.Id != exceptUserId))
                .FirstOrDefaultAsync();
            return user != null;
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            var user = await _userCollection.Find(x => x.Email == email).FirstOrDefaultAsync();
            return user != null;
        }

        public async Task UpdateAsync(string id, User user) => await _userCollection.ReplaceOneAsync(x => x.Id == id, user);

        public async Task RemoveAsync(string id) => await _userCollection.DeleteOneAsync(x => x.Id == id);

        public async Task AddCreatedCommunities(string communityId, User user)
        {
            if (communityId != null)
            {
                if(user.UserCreatedCommunities == null)
                {
                    user.UserCreatedCommunities = new List<string>();
                }
                user.UserCreatedCommunities.Add(communityId);
            }
            else
            {
                throw new Exception("É necessário um id de comunidade correto para adicionar na lista!");
            }
            await _userCollection.ReplaceOneAsync(x => x.Id == user.Id, user);
        }

        public async Task HandleFollowing(string followingId, User user)
        {
            if (followingId != null)
            {

                if(user.Following == null)
                {
                    user.Following = new List<string>();
                }

                User userFollowing = await GetAsync(followingId);
                if(userFollowing.Followers == null)
                {
                    userFollowing.Followers = new List<string>();
                }

                var followingFound = user.Following.FirstOrDefault(x => x == followingId);
                if (followingFound == null)
                {
                    userFollowing.Followers.Add(user.Id);
                    await _userCollection.ReplaceOneAsync(x => x.Id == userFollowing.Id, userFollowing);

                    user.Following.Add(userFollowing.Id);
                    await _userCollection.ReplaceOneAsync(x => x.Id == user.Id, user);
                }
                else
                {
                    var currentUserIndex = userFollowing.Followers.FindIndex(x => x == user.Id);
                    if (currentUserIndex >= 0)
                    {
                        userFollowing.Followers.RemoveAt(currentUserIndex);
                        await _userCollection.ReplaceOneAsync(x => x.Id == userFollowing.Id, userFollowing);
                    }

                    var anotherUserIndex = user.Following.FindIndex(x => x == userFollowing.Id);
                    if (anotherUserIndex >= 0)
                    {
                        user.Following.RemoveAt(anotherUserIndex);
                        await _userCollection.ReplaceOneAsync(x => x.Id == user.Id, user);
                    }
                }
            }
            else
            {
                throw new Exception("Usuário não encontrado!");
            }
        }

        public async Task<List<SimplifiedUser>> GetSimplifiedUsersAsync(string opt, User user)
        {
            if(opt == "following")
            {
                List<SimplifiedUser> users = new List<SimplifiedUser>();
                if(user.Following != null)
                {
                    foreach (string followingId in user.Following)
                    {
                        User currentUser = await GetAsync(followingId);
                        SimplifiedUser newSimplifiedUser = new SimplifiedUser
                        {
                            UserId = followingId,
                            NickName = currentUser.Nickname,
                            UserImageSrc = currentUser.ImageSrc,
                            BackgroundImage = currentUser.BackgroundImage
                        };
                        users.Add(newSimplifiedUser);
                    }
                    return users;
                }
                else
                {
                    throw new Exception("Usuário não segue ninguem");
                }
            }
            else if(opt == "followers")
            {
                List<SimplifiedUser> users = new List<SimplifiedUser>();
                if(user.Followers != null)
                {
                    foreach (string followersId in user.Followers)
                    {
                        User currentUser = await GetAsync(followersId);
                        SimplifiedUser newSimplifiedUser = new SimplifiedUser
                        {
                            UserId = followersId,
                            NickName = currentUser.Nickname,
                            UserImageSrc = currentUser.ImageSrc,
                            BackgroundImage = currentUser.BackgroundImage
                        };
                        users.Add(newSimplifiedUser);
                    }
                    return users;
                }
                else
                {
                    throw new Exception("Usuário não tem seguidores");
                }
            }
            else
            {
                throw new Exception("Erro ao verificar a opção passada!");
            }
        }

        public async Task DeleteCommunityId(string communityId)
        {
            List<User> users = await GetAsync();

            foreach(User user in users)
            {
                if(user.UserCommunities != null)
                {
                    var communityToRemove = user.UserCommunities.FirstOrDefault(x => x == communityId);
                    if (communityToRemove != null)
                    {
                        user.UserCommunities.Remove(communityToRemove);
                        await UpdateAsync(user.Id, user);
                    }
                }
            }
        }
        public async Task DeleteUserFromFollowersAndFollowing(string userId)
        {
            List<User> users = await GetAsync();

            foreach (User user in users)
            {
                if (user.Followers != null)
                {
                    var followerToRemove = user.Followers.FirstOrDefault(x => x == userId);
                    if (followerToRemove != null)
                    {
                        user.Followers.Remove(followerToRemove);
                        await UpdateAsync(user.Id, user);
                    }
                }

                if (user.Following != null)
                {
                    var followingToRemove = user.Following.FirstOrDefault(x => x == userId);
                    if (followingToRemove != null)
                    {
                        user.Following.Remove(followingToRemove);
                        await UpdateAsync(user.Id, user);
                    }
                }
            }
        }

        public async Task<int> ResetLegacyPasswordsAsync()
        {
            var users = await _userCollection.Find(x => true).ToListAsync();
            var migrated = 0;

            foreach (var user in users.Where(user => !Security.PasswordHasher.IsHash(user.Password)))
            {
                var invalidatedPassword = Convert.ToBase64String(
                    System.Security.Cryptography.RandomNumberGenerator.GetBytes(48));

                var update = Builders<User>.Update
                    .Set(x => x.Password, Security.PasswordHasher.Hash(invalidatedPassword))
                    .Set(x => x.PasswordResetRequired, true);

                await _userCollection.UpdateOneAsync(x => x.Id == user.Id, update);
                migrated++;
            }

            return migrated;
        }

        public async Task<bool> ResetPasswordByEmailAsync(string email, string newPassword)
        {
            var user = await GetByEmailAsync(email);
            if (user is null)
                return false;

            user.Password = Security.PasswordHasher.Hash(newPassword);
            user.PasswordResetRequired = false;
            user.TokenVersion++;
            await _userCollection.ReplaceOneAsync(x => x.Id == user.Id, user);
            return true;
        }

        public async Task HandleGameLibrary(string gameId, User user)
        {
            if(gameId != null)
            {
                if(user.GamesLibrary == null)
                {
                    user.GamesLibrary = new List<LibraryGame>();
                }

                var gameFoud = user.GamesLibrary.FirstOrDefault(x => x.id == gameId);
                if(gameFoud == null)
                {
                    LibraryGame game = new LibraryGame();
                    game.id = gameId;
                    user.GamesLibrary.Add(game);
                    await _userCollection.ReplaceOneAsync(x => x.Id == user.Id, user);
                }
                else
                {
                    var currentGameIndex = user.GamesLibrary.FindIndex(x => x.id == gameId);
                    if (currentGameIndex >= 0)
                    {
                        user.GamesLibrary.RemoveAt(currentGameIndex);
                        await _userCollection.ReplaceOneAsync(x => x.Id == user.Id, user);
                    }
                }
            }
            else
            {
                throw new Exception("Jogo não encontrado!");
            }
        }
        public async Task HandleStatusGame(string status, string gameId, User user)
        {
            LibraryGame gameFound = user.GamesLibrary.FirstOrDefault(x => x.id == gameId);
            if (gameFound != null)
            {
                gameFound.state = status;
                var gameIndex = user.GamesLibrary.FindIndex(x => x.id == gameId);
                if (gameIndex >= 0)
                {
                    user.GamesLibrary[gameIndex].state = status;
                    await _userCollection.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(u => u.GamesLibrary, user.GamesLibrary));
                }
            }
            else
            {
                throw new Exception("Jogo não encontrado!");
            }
        }

        public async Task HandlePinGame(bool pin, string gameId, User user)
        {   
            var gameIndex = user.GamesLibrary.FindIndex(x => x.id == gameId);
            if (gameIndex >= 0)
            {
                user.GamesLibrary[gameIndex].pin = pin;
                await _userCollection.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(u => u.GamesLibrary, user.GamesLibrary));
            }
        }

        public async Task HandleRatingGame(float rating, string gameId, User user)
        {
            var gameIndex = user.GamesLibrary.FindIndex(x => x.id == gameId);
            if (gameIndex >= 0)
            {
                user.GamesLibrary[gameIndex].rating = rating;
                await _userCollection.UpdateOneAsync(x => x.Id == user.Id, Builders<User>.Update.Set(u => u.GamesLibrary, user.GamesLibrary));
            }
            else
            {
                throw new Exception("Nota incorreta!");
            }
        }
    }
}
