using Gamehub.Server.Models;
using Gamehub.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using MongoDB.Driver;

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

        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        [HttpGet]
        public async Task<List<Post>> GetPost() => await _postServices.GetAsync();

        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        [HttpGet("getPagePost/{page}")]
        public async Task<ActionResult<List<Post>>> GetPost(int page, string opt)
        {
            if(page == 0)
            {
                page = 1;
            }

            if(opt == "date")
            {
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
            else if(opt == "relevant")
            {
                var posts = await _postServices.GetAsyncRelevant(page);
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
            else
            {
                return BadRequest();
            }
        }

        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        [HttpGet("getPost/{id}")]
        public async Task<ActionResult<Post>> GetPost(string id)
        {
            var post = await _postServices.GetAsync(id);
            return post is null ? NotFound() : Ok(post);
        }

        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        [HttpGet("communityPosts/{id}")]
        public async Task<ActionResult<List<Post>>> GetCommunityPosts(string id, int page, string opt)
        {
            var communityId = id;
            if (page == 0)
            {
                page = 1;
            }

            if (opt == "date")
            {
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
            else if (opt == "relevant")
            {
                var posts = await _postServices.GetCommunityPostsRelevant(communityId, page);
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
            else
            {
                return BadRequest();
            }
        }

        [HttpGet("GetListCommunitiesPosts")]
        public async Task<ActionResult<List<Post>>> GetCommunitiesIsolatedPosts(int page, string opt)
        {
            var userId = Security.ClaimsPrincipalExtensions.GetUserId(User);
            if (userId is null)
                return Unauthorized();
            if (page == 0)
            {
                page = 1;
            }

            if(opt == "date")
            {
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
            else if (opt == "relevant")
            {
                User user = await _userServices.GetAsync(userId);
                List<SimplifiedCommunity> simplifiedCommunities = await _communityServices.GetSimplifiedCommunity("following", user);
                List<Post> allPosts = new List<Post>();

                foreach (SimplifiedCommunity currentCommunity in simplifiedCommunities)
                {
                    List<Post> communitiesPosts = await _postServices.GetAllCommunityPosts(currentCommunity.Id);
                    allPosts.AddRange(communitiesPosts);
                }

                // Ordena os posts por relevância em ordem decrescente
                allPosts = allPosts.OrderByDescending(x => (x.Like ?? new List<LikeDisLike>()).Count).ToList();

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
            else
            {
                return BadRequest();
            }
        }

        [HttpGet("GetListUsersPosts")]
        public async Task<ActionResult<List<Post>>> GetUsersIsolatedPosts(int page, string opt)
        {
            var userId = Security.ClaimsPrincipalExtensions.GetUserId(User);
            if (userId is null)
                return Unauthorized();
            if (page == 0)
            {
                page = 1;
            }

            if(opt == "date")
            {
                User user = await _userServices.GetAsync(userId);
                List<SimplifiedUser> simplifiedUsers = await _userServices.GetSimplifiedUsersAsync("following", user);
                List<Post> allPosts = new List<Post>();

                foreach (SimplifiedUser following in simplifiedUsers)
                {
                    List<Post> followingPosts = await _postServices.GetUserPosts(following.UserId);
                    allPosts = allPosts.Concat(followingPosts).ToList();
                }

                allPosts = allPosts.OrderByDescending(x => x.Date).ToList();

                int skip = (page - 1) * _pageSize;
                List<Post> posts = allPosts.Skip(skip).Take(_pageSize).ToList();

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
            else if (opt == "relevant")
            {
                User user = await _userServices.GetAsync(userId);
                List<SimplifiedUser> simplifiedUsers = await _userServices.GetSimplifiedUsersAsync("following", user);
                List<Post> allPosts = new List<Post>();

                foreach (SimplifiedUser following in simplifiedUsers)
                {
                    List<Post> followingPosts = await _postServices.GetUserPosts(following.UserId);
                    allPosts = allPosts.Concat(followingPosts).ToList();
                }

                // Ordena os posts por relevância em ordem decrescente
                allPosts = allPosts.OrderByDescending(x => (x.Like ?? new List<LikeDisLike>()).Count).ToList();

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
            else
            {
                return BadRequest();
            }
        }

        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        [HttpGet("userPosts/{userId}")]
        public async Task<ActionResult<List<Post>>> GetUserPosts(string userId, int page, string opt)
        {
            if (page == 0)
            {
                page = 1;
            }

            if(opt == "date")
            {
                var posts = await _postServices.GetUserPosts(userId, page);
                var totalPosts = await _postServices.CountUserPosts(userId);
                var totalPages = (int)Math.Ceiling((double)totalPosts / _pageSize);

                var result = new
                {
                    Posts = posts,
                    TotalPages = totalPages,
                    CurrentPage = page
                };

                return Ok(result);
            }
            else if (opt == "relevant")
            {
                var posts = await _postServices.GetUserPostsRelevant(userId, page);
                var totalPosts = await _postServices.CountUserPosts(userId);
                var totalPages = (int)Math.Ceiling((double)totalPosts / _pageSize);

                var result = new
                {
                    Posts = posts,
                    TotalPages = totalPages,
                    CurrentPage = page
                };

                return Ok(result);
            }
            else
            {
                return BadRequest();
            }
        }

        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        [HttpGet("getPostsByGame")]
        public async Task<ActionResult<List<Post>>> GetPostsByGame(string query, int page, string? opt)
        {
            if (page == 0)
            {
                page = 1;
            }
            if (opt == "date")
            {
                var posts = await _postServices.GetPostsByGame(query, page);
                var totalPosts = await _postServices.CountGamePosts(query);
                var totalPages = (int)Math.Ceiling((double)totalPosts / _pageSize);

                var result = new
                {
                    Posts = posts,
                    TotalPages = totalPages,
                    CurrentPage = page
                };

                return Ok(result);
            }
            else if (opt == "relevant")
            {
                var posts = await _postServices.GetGamePostsRelevant(query, page);
                var totalPosts = await _postServices.CountGamePosts(query);
                var totalPages = (int)Math.Ceiling((double)totalPosts / _pageSize);

                var result = new
                {
                    Posts = posts,
                    TotalPages = totalPages,
                    CurrentPage = page
                };

                return Ok(result);
            }


            else
            {
                throw new Exception("Jogo não encontrado");
            }
        }

        [HttpPost]
        public async Task<ActionResult<Post>> PostPost(Dtos.CreatePostRequest request)
        {
            var userId = Security.ClaimsPrincipalExtensions.GetUserId(User);
            if (userId is null)
                return Unauthorized();

            User user = await _userServices.GetAsync(userId);
            if (user is null)
                return Unauthorized();

            if (request.CommunityId is not null && await _communityServices.GetAsync(request.CommunityId) is null)
                return BadRequest("Comunidade não encontrada.");

            var post = new Post
            {
                Author = user.Nickname,
                IdAuthor = user.Id,
                AuthorImage = user.ImageSrc,
                Title = request.Title.Trim(),
                Content = request.Content.Trim(),
                ImageSrc = request.ImageSrc,
                Game = request.Game,
                CommunityId = request.CommunityId,
                Date = DateTimeOffset.UtcNow,
                Comments = [],
                Like = [],
                Dislike = []
            };

            await _postServices.CreateAsync(post);

            if (post.CommunityId != null)
            {
                await _communityServices.AddPost(post, post.CommunityId);
            }

            return CreatedAtAction(nameof(GetPost), new { id = post.Id }, post);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(string id)
        {
            var post = await _postServices.GetAsync(id);
            if (post is null)
                return NotFound();

            var userId = Security.ClaimsPrincipalExtensions.GetUserId(User);
            var isCommunityOwner = false;
            if (post.CommunityId is not null)
            {
                var community = await _communityServices.GetAsync(post.CommunityId);
                isCommunityOwner = community?.Creator == userId;
            }

            if (post.IdAuthor != userId && !isCommunityOwner)
                return Forbid();

            await _postServices.RemoveAsync(id);
            return NoContent();
        }

        [HttpPost("comment")]
        public async Task<IActionResult> PostComment([FromForm]string postId, [FromForm]string comment)
        {
            if (postId == null) 
            {
                throw new Exception("O ID do post não pode ser nulo");
            }

            var userId = Security.ClaimsPrincipalExtensions.GetUserId(User);
            if (userId is null)
                return Unauthorized();

            var userFound = await _userServices.GetAsync(userId);
            var postCommented = await _postServices.GetAsync(postId);
            if (userFound is null || postCommented is null)
                return NotFound();

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
            return NoContent();
        }

        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
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
            if (post is null)
                return NotFound();

            var comment = post.Comments?.Find(c => c.Id == commentId);

            if (comment != null)
            {
                var userId = Security.ClaimsPrincipalExtensions.GetUserId(User);
                var canModerate = post.IdAuthor == userId;
                if (!canModerate && post.CommunityId is not null)
                {
                    var community = await _communityServices.GetAsync(post.CommunityId);
                    canModerate = community?.Creator == userId;
                }

                if (comment.User.UserId != userId && !canModerate)
                    return Forbid();

                await _postServices.RemoveAsyncComment(post, commentId);
                return NoContent();
            }
            else
            {
                return NotFound("Comentário não encontrado");
            }
        }

        [HttpPost("like")]
        public async Task<IActionResult> HandleLike([FromForm]string postId, [FromForm]string? commentId)
        {
            var userId = Security.ClaimsPrincipalExtensions.GetUserId(User);
            if (userId is null)
                return Unauthorized();
            User user = await _userServices.GetAsync(userId);
            if (user is null || await _postServices.GetAsync(postId) is null)
                return NotFound();

            await _postServices.AddLike(postId, user, commentId);
            return NoContent();
        }

        [HttpPost("dislike")]
        public async Task<IActionResult> HandleDislike([FromForm] string postId, [FromForm] string? commentId)
        {
            var userId = Security.ClaimsPrincipalExtensions.GetUserId(User);
            if (userId is null)
                return Unauthorized();
            User user = await _userServices.GetAsync(userId);
            if (user is null || await _postServices.GetAsync(postId) is null)
                return NotFound();

            await _postServices.AddDislike(postId, user, commentId);
            return NoContent();
        }

        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        [HttpGet("like")]
        public async Task<List<LikeDisLike>> GetLike(string postId)
        {
            return await _postServices.GetLikeAsync(postId);
        }

        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        [HttpGet("dislike")]
        public async Task<List<LikeDisLike>> GetDislike(string postId)
        {
            return await _postServices.GetDislikeAsync(postId);
        }
    }
}
