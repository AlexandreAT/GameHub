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

        [HttpPost]
        public async Task<Community> PostCommunity(string creatorId, Community community)
        {
            User creatorUser = await _userServices.GetAsync(creatorId);
            SimplifiedUser creator = new SimplifiedUser
            {
                UserId = creatorUser.Id,
                NickName = creatorUser.Nickname,
                UserImageSrc = creatorUser.ImageSrc,
            };
            community.Creator = creator;
            Community newCommunity = await _communityServices.CreateAsync(community);
            SimplifiedCommunity simplifiedCommunity = new SimplifiedCommunity
            {
                Id = newCommunity.Id,
                Name = newCommunity.Name,
                CreatorId = newCommunity.Creator.NickName
            };
            await _userServices.AddCreatedCommunities(simplifiedCommunity, creatorUser);
            return community;
        }

        [HttpPut("{id}")]
        public async Task UpdateCommunity(string id, Community community)
        {
            User creatorUser = await _userServices.GetAsync(community.Creator.UserId);
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
