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
        public async Task<User> GetUserByEmailAndPassword(string email, string password) => await _userCollection.Find(x => x.Email == email && x.Password == password).FirstOrDefaultAsync();
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

        public async Task AddCreatedCommunities(SimplifiedCommunity community, User user)
        {
            if (community != null)
            {
                if(user.UserCreatedCommunities == null)
                {
                    user.UserCreatedCommunities = new List<SimplifiedCommunity>();
                }
                user.UserCreatedCommunities.Add(community);
            }
            else
            {
                throw new Exception("É necessário um objeto Community correto para adicionar na lista!");
            }
            await _userCollection.ReplaceOneAsync(x => x.Id == user.Id, user);
        }

        public async Task HandleFollowing(string followingId, User user)
        {
            if (followingId != null)
            {

                if(user.Following == null)
                {
                    user.Following = new List<SimplifiedUser>();
                }

                User userFollowing = await GetAsync(followingId);
                if(userFollowing.Followers == null)
                {
                    userFollowing.Followers = new List<SimplifiedUser>();
                }

                var followingFound = user.Following.FirstOrDefault(x => x.UserId == followingId);
                if (followingFound == null)
                {
                    SimplifiedUser simplifiedCurrentUser = new SimplifiedUser { UserId = user.Id, NickName = user.Nickname, UserImageSrc = user.ImageSrc };
                    userFollowing.Followers.Add(simplifiedCurrentUser);
                    await _userCollection.ReplaceOneAsync(x => x.Id == userFollowing.Id, userFollowing);

                    SimplifiedUser simplifiedAnotherUser = new SimplifiedUser { UserId = userFollowing.Id, NickName = userFollowing.Nickname, UserImageSrc = userFollowing.ImageSrc };
                    user.Following.Add(simplifiedAnotherUser);
                    await _userCollection.ReplaceOneAsync(x => x.Id == user.Id, user);
                }
                else
                {
                    var currentUserIndex = userFollowing.Followers.FindIndex(x => x.UserId == user.Id);
                    if (currentUserIndex >= 0)
                    {
                        userFollowing.Followers.RemoveAt(currentUserIndex);
                        await _userCollection.ReplaceOneAsync(x => x.Id == userFollowing.Id, userFollowing);
                    }

                    var anotherUserIndex = user.Following.FindIndex(x => x.UserId == userFollowing.Id);
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
    }
}
