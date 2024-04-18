using Gamehub.Server.Models;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Gamehub.Server.Services
{
    public class PostServices
    {
        private readonly IMongoCollection<Post> _postCollection;

        public PostServices(IOptions<PostDatabaseSettings> postServices)
        {
            var mongoClient = new MongoClient(postServices.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(postServices.Value.DatabaseName);

            _postCollection = mongoDatabase.GetCollection<Post>(postServices.Value.PostCollectionName);
        }

        public async Task<List<Post>> GetAsync() => await _postCollection.Find(x => true).SortByDescending(x => x.Date).ToListAsync();

        public async Task<Post> GetAsync(string id) => await _postCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task<Post> CreateAsync(Post post)
        {
            post.Id = null;
            post.Date = DateTimeOffset.UtcNow;
            await _postCollection.InsertOneAsync(post);
            post.Id = post.Id ?? _postCollection.Find(x => x.Id == post.Id).FirstOrDefault()?.Id;
            return post;
        }

        public async Task RemoveAsync(string id) => await _postCollection.DeleteOneAsync(x => x.Id == id);

        public async Task<Post> AddComment(Comment comment, Post post)
        {
            if (post.Comments == null)
            {
                post.Comments = new List<Comment>();
            }

            comment.Id = ObjectId.GenerateNewId().ToString();
            post.Comments.Add(comment);

            await _postCollection.ReplaceOneAsync(x => x.Id == post.Id, post);

            return post;
        }

        public async Task<List<Comment>> GetAsyncComment(Post post)
        {
            if(post.Comments == null)
            {
                throw new Exception("Post sem comentários");
            }
            return post.Comments;
        }

        public async Task AddLike(string postId, User user)
        {
            var post = await _postCollection.Find(x => x.Id == postId).FirstOrDefaultAsync();

            if(post == null)
            {
                throw new Exception("Post não encontrado");
            }

            if(post.Likes == null)
            {
                post.Likes = new List<LikeDisLike>();
            }

            var like = post.Likes.FirstOrDefault(x => x.UserId == user.Id);

            if (like == null)
            {
                post.Likes.Add(new LikeDisLike { UserId = user.Id, UserName = user.Name, UserImageSrc = user.ImageSrc, IsLiked = true });
            }
            else
            {
                if (like.IsLiked)
                {
                    like.IsLiked = false;
                    post.Likes.Remove(like);
                }
                else
                {
                    like.IsLiked = true;
                }
            }
            await _postCollection.ReplaceOneAsync(x => x.Id == postId, post);
        }

        public async Task AddDislike(string postId, User user)
        {
            var post = await _postCollection.Find(x => x.Id == postId).FirstOrDefaultAsync();

            if (post == null)
            {
                throw new Exception("Post não encontrado");
            }

            if (post.Dislikes == null)
            {
                post.Dislikes = new List<LikeDisLike>();
            }

            var dislikes = post.Dislikes.FirstOrDefault(x => x.UserId == user.Id);

            if (dislikes == null)
            {
                post.Likes.Add(new LikeDisLike { UserId = user.Id, UserName = user.Name, UserImageSrc = user.ImageSrc, IsLiked = true });
            }
            else
            {
                if (dislikes.IsLiked)
                {
                    dislikes.IsLiked = false;
                    post.Likes.Remove(dislikes);
                }
                else
                {
                    dislikes.IsLiked = true;
                }
            }
            await _postCollection.ReplaceOneAsync(x => x.Id == postId, post);
        }

    }
}
