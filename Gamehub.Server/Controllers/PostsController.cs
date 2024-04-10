using Gamehub.Server.Models;
using Gamehub.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Gamehub.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PostsController : ControllerBase
    {

        private readonly PostServices _postServices;

        public PostsController(PostServices postServices)
        {
            _postServices = postServices;
        }

        [HttpGet]
        public async Task<List<Post>> GetPost() => await _postServices.GetAsync();

        [HttpPost]
        public async Task<Post> PostPost(Post post)
        {
            await _postServices.CreateAsync(post);

            return post;
        }

    }
}
