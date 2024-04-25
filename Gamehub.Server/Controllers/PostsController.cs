using Gamehub.Server.Models;
using Gamehub.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace Gamehub.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PostsController : ControllerBase
    {

        private readonly PostServices _postServices;
        private readonly UserServices _userServices;

        public PostsController(PostServices postServices, UserServices userServices)
        {
            _postServices = postServices;
            _userServices = userServices;
        }

        [HttpGet]
        public async Task<List<Post>> GetPost() => await _postServices.GetAsync();

        [HttpPost]
        public async Task<Post> PostPost(Post post)
        {

            if (post.Title == null)
            {
                throw new Exception("O post deve conter um título!");
            }

            if (post.Content == null)
            {
                throw new Exception("O post deve conter um conteúdo!");
            }

            await _postServices.CreateAsync(post);

            return post;
        }

        [HttpGet("userPosts")]
        public async Task<List<Post>> GetUserPosts(string id) => await _postServices.GetUserPosts(id);

        [HttpPost("comment")]
        public async Task PostComment([FromForm]string postId, [FromForm]string userId, [FromForm]string comment)
        {
            if (postId == null) 
            {
                throw new Exception("O ID do post não pode ser nulo");
            }

            if (userId == null)
            {
                throw new Exception("O ID do usuário não pode ser nulo");
            }

            var userFound = await _userServices.GetAsync(userId);
            var postCommented = await _postServices.GetAsync(postId);

            var userCommented = new SimplifiedUser
            {
                UserId = userFound.Id,
                NickName = userFound.Nickname,
                UserImageSrc = userFound.ImageSrc,
            };


            var commentary = new Comment
            {
                User = userCommented,
                Content = comment,
            };

            var newComment = await _postServices.AddComment(commentary, postCommented);

            if (postCommented.IdAuthor != null)
            {
                var postUser = await _userServices.GetAsync(postCommented.IdAuthor);

                // Atualiza a propriedade "posts" do usuário que fez o post original
                await _userServices.AddPostAsync(postUser.Id, postUser, newComment);
            }
            else
            {
                throw new Exception("O post não tem o ID do Autor");
            }
        }

        [HttpGet("comments")]
        public async Task<List<Comment>> GetPostComments(string id)
        {
            var post = await _postServices.GetAsync(id);
            return await _postServices.GetAsyncComment(post);
        }

        [HttpDelete("comment")]
        public async Task<IActionResult> RemoveComment(string postId, string commentId)
        {
            var post = await _postServices.GetAsync(postId);
            var comment = post.Comments.Find(c => c.Id == commentId);

            if (comment != null)
            {
                Post newPost = await _postServices.RemoveAsyncComment(post, commentId);
                await _userServices.RemovePostComment(newPost);
                return Ok("Comentário removido com sucesso!");
            }
            else
            {
                return NotFound("Comentário não encontrado");
            }
        }

        [HttpPost("like")]
        public async Task HandleLike([FromForm]string postId, [FromForm]string userId, [FromForm]string? commentId)
        {

            User user = await _userServices.GetAsync(userId);
            Post post = await _postServices.AddLike(postId, user, commentId);
            User userOfPost = await _userServices.GetAsync(post.IdAuthor);
            await _userServices.AddPostAsync(userOfPost.Id, userOfPost, post);
            
        }

        [HttpPost("dislike")]
        public async Task HandleDislike([FromForm] string postId, [FromForm] string userId, [FromForm] string? commentId)
        {

            User user = await _userServices.GetAsync(userId);
            Post post = await _postServices.AddDislike(postId, user, commentId);
            User userOfPost = await _userServices.GetAsync(post.IdAuthor);
            await _userServices.AddPostAsync(userOfPost.Id, userOfPost, post);

        }

        [HttpGet("like")]
        public async Task<List<LikeDisLike>> GetLike(string postId)
        {
            return await _postServices.GetLikeAsync(postId);
        }

        [HttpGet("dislike")]
        public async Task<List<LikeDisLike>> GetDislike(string postId)
        {
            return await _postServices.GetDislikeAsync(postId);
        }
    }
}
