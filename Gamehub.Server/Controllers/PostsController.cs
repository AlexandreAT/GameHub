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
        private readonly CommunityServices _communityServices;
        private readonly int _pageSize = 15;

        public PostsController(PostServices postServices, UserServices userServices, CommunityServices communityServices)
        {
            _postServices = postServices;
            _userServices = userServices;
            _communityServices = communityServices;
        }

        [HttpGet]
        public async Task<List<Post>> GetPost() => await _postServices.GetAsync();

        [HttpGet("getPagePost/{page}")]
        public async Task<ActionResult<List<Post>>> GetPost(int page)
        {
            if(page == 0)
            {
                page = 1;
            }
            var posts = await _postServices.GetAsync(page);
            var totalPosts = await _postServices.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalPosts / _pageSize);

            var result = new
            {
                Posts = posts,
                TotalPages = totalPages,
                CurrentPage = page
            };

            return Ok(result);
        }

        [HttpGet("getPost/{id}")]
        public async Task<Post> GetPost(string id) => await _postServices.GetAsync(id);

        [HttpGet("communityPosts/{id}")]
        public async Task<ActionResult<List<Post>>> GetCommunityPosts(string communityId, int page)
        {
            if (page == 0)
            {
                page = 1;
            }
            var posts = await _postServices.GetCommunityPosts(communityId, page);
            var totalPosts = await _postServices.CountCommunityPost(communityId);
            var totalPages = (int)Math.Ceiling((double)totalPosts / _pageSize);

            var result = new
            {
                Posts = posts,
                TotalPages = totalPages,
                CurrentPage = page
            };

            return Ok(result);
        }

        [HttpGet("GetListCommunitiesPosts")]
        public async Task<ActionResult<List<Post>>> GetCommunitiesIsolatedPosts(string userId, int page)
        {
            if (page == 0)
            {
                page = 1;
            }

            User user = await _userServices.GetAsync(userId);
            List<SimplifiedCommunity> simplifiedCommunities = await _communityServices.GetSimplifiedCommunity("following", user);
            List<Post> allPosts = new List<Post>();

            foreach (SimplifiedCommunity currentCommunity in simplifiedCommunities)
            {
                List<Post> communitiesPosts = await _postServices.GetAllCommunityPosts(currentCommunity.Id);
                allPosts.AddRange(communitiesPosts);
            }

            // Ordena os posts por data em ordem decrescente
            allPosts = allPosts.OrderByDescending(x => x.Date).ToList();

            // Limita a quantidade de posts por página
            int skip = (page - 1) * _pageSize;
            List<Post> posts = allPosts.Skip(skip).Take(_pageSize).ToList();

            // Calcula o número total de páginas
            int totalPosts = allPosts.Count;
            int totalPages = (int)Math.Ceiling((double)totalPosts / _pageSize);

            var result = new
            {
                Posts = posts,
                TotalPages = totalPages,
                CurrentPage = page
            };

            return Ok(result);
        }

        [HttpPost]
        public async Task<Post> PostPost(Post post)
        {
            User user = await _userServices.GetAsync(post.IdAuthor);
            post.AuthorImage = user.ImageSrc;
            if (post.Title == null)
            {
                throw new Exception("O post deve conter um título!");
            }

            if (post.Content == null)
            {
                throw new Exception("O post deve conter um conteúdo!");
            }

            await _postServices.CreateAsync(post);

            if (post.CommunityId != null)
            {
                await _communityServices.AddPost(post, post.CommunityId);
            }

            return post;
        }

        [HttpGet("userPosts/{id}")]
        public async Task<List<Post>> GetUserPosts(string id) => await _postServices.GetUserPosts(id);

        [HttpDelete("{id}")]
        public async Task DeletePost(string postId) => await _postServices.RemoveAsync(postId);

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

            await _postServices.AddComment(commentary, postCommented);
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
                await _postServices.RemoveAsyncComment(post, commentId);
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
            
        }

        [HttpPost("dislike")]
        public async Task HandleDislike([FromForm] string postId, [FromForm] string userId, [FromForm] string? commentId)
        {

            User user = await _userServices.GetAsync(userId);
            Post post = await _postServices.AddDislike(postId, user, commentId);
            User userOfPost = await _userServices.GetAsync(post.IdAuthor);

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

        [HttpGet("GetListUsersPosts")]
        public async Task<List<Post>> GetUsersIsolatedPosts(string userId)
        {
            User user = await _userServices.GetAsync(userId);
            List<SimplifiedUser> simplifiedUsers = await _userServices.GetSimplifiedUsersAsync("following", user);
            List<Post> posts = new List<Post>();
            foreach (SimplifiedUser following in simplifiedUsers)
            {
                List<Post> followingPosts = await _postServices.GetUserPosts(following.UserId);
                posts = posts.Concat(followingPosts).ToList();
            }
            return posts.OrderByDescending(x => x.Date).ToList();
        }
    }
}
