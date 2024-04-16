using Gamehub.Server.Models;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;

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

        public async Task AddPostAsync(string id, User user, Post post)
        {
            if(post != null)
            {
                if(user.Posts == null)
                {
                    user.Posts = new List<Post>();
                }
                user.Posts.Add(post);
            }
            else
            {
                throw new Exception("É necessário um objeto post correto para adiciona na lista!");
            }

            await _userCollection.ReplaceOneAsync(x => x.Id == id, user);
            
        }

        public async Task UpdatePostAsync(User user, Post post)
        {
            //ah fazer
        }

        public async Task<List<Post>> GetAsyncPosts(string id)
        {
            var user = await GetAsync(id);
            if (user.Posts != null)
            {
                return user.Posts;
            }
            else
            {
                throw new Exception("Usuário sem posts!");
            }
        }
    }
}
