using Gamehub.Server.Models;
using Gamehub.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Gamehub.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommunityController : ControllerBase
    {
        private readonly CommunityServices _communityServices;

        public CommunityController(CommunityServices communityServices)
        {
            _communityServices = communityServices;
        }

        [HttpGet]
        public async Task<List<Community>> GetCommunities() => await _communityServices.GetAsync();

        [HttpPost]
        public async Task<Community> PostCommunity(Community community)
        {
            await _communityServices.CreateAsync(community);
            return community;
        }
    }
}
