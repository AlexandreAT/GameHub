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
        public async Task<Community> PostCommunity(string creatorId, string name, string? game)
        {
            User creatorUser = await _userServices.GetAsync(creatorId);
            AnotherUser creator = new AnotherUser
            {
                Id = creatorUser.Id,
                Name = creatorUser.Name,
                Surname = creatorUser.Surname,
                Nickname = creatorUser.Nickname,
                ImgSrc = creatorUser.ImageSrc,
                Posts = creatorUser.Posts,
                Following = creatorUser.Following,
                Biography = creatorUser.Biography,
                City = creatorUser.City,
                State = creatorUser.State,
                UserCommunities = creatorUser.UserCommunities,
                UserCreatedCommunities = creatorUser.UserCreatedCommunities,
            };
            Community community = new Community
            {
                Creator = creator,
                Name = name,
                Game = game
            };
            await _communityServices.CreateAsync(community);
            await _userServices.AddCreatedCommunities(community, creatorUser);
            return community;
        }

        [HttpPut("{id}")]
        public async Task UpdateCommunity(string id, Community community)
        {
            User creatorUser = await _userServices.GetAsync(community.Creator.Id);
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
