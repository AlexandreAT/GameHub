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

        public async Task<Post> RemoveAsyncComment(Post post, string commentId)
        {
            var postIndex = post.Comments.FindIndex(p => p.Id == commentId);

            if (postIndex >= 0)
            {
                post.Comments.RemoveAt(postIndex);
                await _postCollection.ReplaceOneAsync(x => x.Id == post.Id, post);
                return post;
            }
            else
            {
                throw new Exception("Comentário não encontrado");
            }
        }

        public async Task<Post> AddLike(string postId, User user, string? commentId)
        {
            var post = await _postCollection.Find(x => x.Id == postId).FirstOrDefaultAsync();

            if (post == null)
            {
                throw new Exception("Post não encontrado");
            }

            if(commentId == null || commentId == "")
            {
                if (post.Like == null)
                {
                    post.Like = new List<LikeDisLike>();
                }

                var like = post.Like.FirstOrDefault(x => x.UserId == user.Id);

                if (like == null)
                {
                    post.Like.Add(new LikeDisLike { UserId = user.Id, UserName = user.Name, UserImageSrc = user.ImageSrc, IsSelected = true });

                    if (post.Dislike != null)
                    {
                        var disLikeIndex = post.Dislike.FindIndex(x => x.UserId == user.Id);
                        if (disLikeIndex >= 0)
                        {
                            post.Dislike.RemoveAt(disLikeIndex);
                        }
                    }
                }
                else
                {
                    if (like.IsSelected)
                    {
                        like.IsSelected = false;
                        post.Like.Remove(like);
                    }
                    else
                    {
                        like.IsSelected = true;
                    }
                }
                await _postCollection.ReplaceOneAsync(x => x.Id == postId, post);
            }

            else
            {
                var commentIndex = post.Comments.FindIndex(x => x.Id == commentId);
                var comment = post.Comments[commentIndex];

                if (comment.Like == null)
                {
                    comment.Like = new List<LikeDisLike>();
                }

                var like = comment.Like.FirstOrDefault(x => x.UserId == user.Id);

                if (like == null)
                {
                    comment.Like.Add(new LikeDisLike { UserId = user.Id, UserName = user.Name, UserImageSrc = user.ImageSrc, IsSelected = true });

                    if (comment.Dislike != null)
                    {
                        var disLikeIndex = comment.Dislike.FindIndex(x => x.UserId == user.Id);
                        if (disLikeIndex >= 0)
                        {
                            comment.Dislike.RemoveAt(disLikeIndex);
                        }
                    }

                    post.Comments[commentIndex] = comment;
                }
                else
                {
                    if (like.IsSelected)
                    {
                        like.IsSelected = false;
                        comment.Like.Remove(like);
                        post.Comments[commentIndex] = comment;
                    }
                    else
                    {
                        like.IsSelected = true;
                    }
                }
                await _postCollection.ReplaceOneAsync(x => x.Id == postId, post);
            }

            return post;
        }

        public async Task<Post> AddDislike(string postId, User user, string? commentId)
        {
            var post = await _postCollection.Find(x => x.Id == postId).FirstOrDefaultAsync();

            if (post == null)
            {
                throw new Exception("Post não encontrado");
            }

            if (commentId == null || commentId == "")
            {
                if (post.Dislike == null)
                {
                    post.Dislike = new List<LikeDisLike>();
                }

                var dislike = post.Dislike.FirstOrDefault(x => x.UserId == user.Id);

                if (dislike == null)
                {
                    post.Dislike.Add(new LikeDisLike { UserId = user.Id, UserName = user.Name, UserImageSrc = user.ImageSrc, IsSelected = true });

                    if (post.Like != null)
                    {
                        var likeIndex = post.Like.FindIndex(x => x.UserId == user.Id);
                        if (likeIndex >= 0)
                        {
                            post.Like.RemoveAt(likeIndex);
                        }
                    }
                }
                else
                {
                    if (dislike.IsSelected)
                    {
                        dislike.IsSelected = false;
                        post.Dislike.Remove(dislike);
                    }
                    else
                    {
                        dislike.IsSelected = true;
                    }
                }
                await _postCollection.ReplaceOneAsync(x => x.Id == postId, post);
            }

            else
            {
                var commentIndex = post.Comments.FindIndex(x => x.Id == commentId);
                var comment = post.Comments[commentIndex];

                if (comment.Dislike == null)
                {
                    comment.Dislike = new List<LikeDisLike>();
                }

                var dislike = comment.Dislike.FirstOrDefault(x => x.UserId == user.Id);

                if (dislike == null)
                {
                    comment.Dislike.Add(new LikeDisLike { UserId = user.Id, UserName = user.Name, UserImageSrc = user.ImageSrc, IsSelected = true });

                    if (comment.Like != null)
                    {
                        var likeIndex = comment.Like.FindIndex(x => x.UserId == user.Id);
                        if (likeIndex >= 0)
                        {
                            comment.Like.RemoveAt(likeIndex);
                        }
                    }

                    post.Comments[commentIndex] = comment;
                }
                else
                {
                    if (dislike.IsSelected)
                    {
                        dislike.IsSelected = false;
                        comment.Dislike.Remove(dislike);
                        post.Comments[commentIndex] = comment;
                    }
                    else
                    {
                        dislike.IsSelected = true;
                    }
                }
                await _postCollection.ReplaceOneAsync(x => x.Id == postId, post);
            }

            return post;
        }

        public async Task<List<LikeDisLike>> GetLikeAsync(string id)
        {
            Post post = await GetAsync(id);
            List<LikeDisLike> likes = new List<LikeDisLike>();
            return likes = post.Like;
        }

        public async Task<List<LikeDisLike>> GetDislikeAsync(string id)
        {
            Post post = await GetAsync(id);
            List<LikeDisLike> disLikes = new List<LikeDisLike>();
            return disLikes = post.Dislike;
        }

    }
}
