using Gamehub.Server.Models;
using Microsoft.AspNetCore.Http.HttpResults;
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

        /*
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
        */

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

        /*public async Task<User> UploadImageAsync(string id, IFormFile image)
        {
            var user = await _userCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (user == null)
            {
                throw new Exception("Usuário não encontrado.");
            }
            using (var ms = new MemoryStream())
            {
                await image.CopyToAsync(ms);
                user.ImageSrc = ms.ToArray();
                await _userCollection.ReplaceOneAsync(x => x.Id == id, user);
            }
            return user;
        }*/

        /*public string GetImageUrl(byte[] image)
        {
            //Preciso implementar a lógica para buscar a imagem, pois se eu apenas buscar o array de byte no frontend, e tentar exibir a imagem com base naquilo, vai dar erro
        }*/
    }
}
