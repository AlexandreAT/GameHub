using Gamehub.Server.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
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
        public async Task<User> GetAsync(string id) => await _userCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
        public async Task<User> GetUserByEmailAndPassword(string email, string password)
        {
            var userFound = await _userCollection.Find(x => x.Email == email && x.Password == password).FirstOrDefaultAsync();
            return userFound;
        }
        public async Task<User> CreateAsync(User user)
        {
            if (user.Cpf.ToString().Length != 11)
            {
                throw new Exception("O CPF deve ter 11 dígitos.");
            }

            user.Id = null;
            await _userCollection.InsertOneAsync(user);
            user.Id = user.Id ?? _userCollection.Find(x => x.Id == user.Id).FirstOrDefault()?.Id;
            return user;
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

        /*public async Task UpdateSimplifiedUser(User currentUser)
        {
            List<User> allUsers = await GetAsync();

            SimplifiedUser newSimplifiedUser = new SimplifiedUser
            {
                UserId = currentUser.Id,
                NickName = currentUser.Nickname,
                UserImageSrc = currentUser.ImageSrc
            };

            foreach(User user in allUsers)
            {
                if(user.Following != null)
                {
                    var userFoundIndex = user.Following.FindIndex(x => x.UserId == currentUser.Id);
                    if (userFoundIndex >= 0)
                    {
                        user.Following[userFoundIndex] = newSimplifiedUser;
                        await UpdateAsync(user.Id, user);
                    }
                }
                if(user.Followers != null)
                {
                    var userFoundIndex = user.Followers.FindIndex(x => x.UserId == currentUser.Id);
                    if(userFoundIndex >= 0)
                    {
                        user.Followers[userFoundIndex] = newSimplifiedUser;
                        await UpdateAsync(user.Id, user);
                    }
                }
            }
        }*/
    }
}
