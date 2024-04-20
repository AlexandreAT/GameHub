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

        public async Task AddPostAsync(string id, User user, Post post)
        {
            if(post != null)
            {
                if(user.Posts == null)
                {
                    user.Posts = new List<Post>();
                }

                // Encontra o post original na lista de posts do usuário
                var postIndex = user.Posts.FindIndex(p => p.Id == post.Id);

                if (postIndex >= 0)
                {
                    // Atualiza o post original com o novo comentário
                    user.Posts[postIndex] = post;
                }
                else
                {
                    // Se o post não foi encontrado na lista de posts do usuário, adiciona-o
                    user.Posts.Add(post);
                }
            }
            else
            {
                throw new Exception("É necessário um objeto Post correto para adiciona na lista!");
            }

            await _userCollection.ReplaceOneAsync(x => x.Id == id, user);
            
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

        public async Task AddCreatedCommunities(Community community, User user)
        {
            if (community != null)
            {
                if(user.UserCreatedCommunities == null)
                {
                    user.UserCreatedCommunities = new List<Community>();
                }
                user.UserCreatedCommunities.Add(community);
            }
            else
            {
                throw new Exception("É necessário um objeto Community correto para adicionar na lista!");
            }
            await _userCollection.ReplaceOneAsync(x => x.Id == user.Id, user);
        }

        public async Task RemovePostComment(Post post)
        {
            var user = await GetAsync(post.IdAuthor);
            if (post.Comments != null)
            {
                var userPostIndex = user.Posts.FindIndex(p => p.Id == post.Id);
                if (userPostIndex >= 0)
                {
                    // Atualiza o post sem o comentário
                    user.Posts[userPostIndex] = post;

                    // Atualiza o usuário no banco de dados
                    await UpdateAsync(user.Id, user);
                }
                else
                {
                    throw new Exception("Comentário não encontrado");
                }
            }
            else
            {
                throw new Exception("Post sem comentários");
            }
        }
    }
}
