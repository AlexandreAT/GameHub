using Gamehub.Server.Models;
using Gamehub.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Runtime.ConstrainedExecution;

namespace Gamehub.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommunityController : ControllerBase
    {
        private readonly CommunityServices _communityServices;
        private readonly UserServices _userServices;

        public CommunityController(CommunityServices communityServices, UserServices userServices)
        {
            _communityServices = communityServices;
            _userServices = userServices;
        }

        [HttpGet]
        public async Task<List<Community>> GetCommunities() => await _communityServices.GetAsync();

        [HttpGet("community/{id}")]
        public async Task<Community> GetCommunity(string Id) => await _communityServices.GetAsync(Id);

        [HttpPost]
        public async Task<Community> PostCommunity(Community community)
        {
            User creatorUser = await _userServices.GetAsync(community.Creator);
            community.CreatorImageSrc = creatorUser.ImageSrc;
            Community newCommunity = await _communityServices.CreateAsync(community);
            
            await _userServices.AddCreatedCommunities(newCommunity.Id, creatorUser);
            return community;
        }

        [HttpPut("{id}")]
        public async Task UpdateCommunity(string id, Community community)
        {
            User creatorUser = await _userServices.GetAsync(community.Creator);
            if (id != community.Id)
            {
                throw new Exception("Erro ao encontrar o id da comunidade");
            }
            else
            {
                await _userServices.UpdateAsync(creatorUser.Id, creatorUser);
                await _communityServices.UpdateAsync(id, community);
            }
        }
    }
}
