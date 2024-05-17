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

        [HttpGet("{id}")]
        public async Task<Community> GetCommunity(string Id) => await _communityServices.GetAsync(Id);

        [HttpPost]
        public async Task<Community> PostCommunity(Community community)
        {
            User creatorUser = await _userServices.GetAsync(community.Creator);
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
                await _communityServices.UpdateAsync(id, community);
            }
        }

        [HttpDelete("{id}")]
        public async Task DeleteCommunity(string id) => await _communityServices.RemoveAsync(id);

        [HttpPost("upload-image")]
        public async Task<ActionResult<User>> UploadImage([FromForm] string image, [FromForm] string id, [FromForm] string opt)
        {
            if(image == null || image.Length == 0)
            {
                return BadRequest("Imagem não pode ser nula ou vazia.");
            }
            Community community = await _communityServices.GetAsync(id);
            
            if(opt == "icone")
            {
                community.iconeImageSrc = image;
            }
            else if(opt == "background")
            {
                community.backgroundImageSrc = image;
            }
            else
            {
                throw new Exception("Opção inválida");
            }
            await _communityServices.UpdateAsync(id, community);
            return Ok(community);
        }

        [HttpPost("followCommunity")]
        public async Task FollowCommunity([FromForm] string userId, [FromForm] string communityId)
        {
            User user = await _userServices.GetAsync(userId);
            Community community = await _communityServices.GetAsync(communityId);

            User newUser = await _communityServices.HandleFollowing(user, community);
            await _userServices.UpdateAsync(newUser.Id, newUser);
        }

        [HttpPost("getFollowers")]
        public async Task<List<SimplifiedUser>> GetFollowers([FromForm] string communityId)
        {
            Community community = await _communityServices.GetAsync(communityId);
            List<SimplifiedUser> simplifiedUsers = await _communityServices.GetSimplifiedUsersAsync(community);
            return simplifiedUsers;
        }

        [HttpGet("getSimplifiedCommunity")]
        public async Task<SimplifiedCommunity> GetSimplifiedCommunity(string communityId)
        {
            Community community = await _communityServices.GetAsync(communityId);
            return new SimplifiedCommunity
            {
                Id = communityId,
                Name = community.Name,
                CreatorId = community.Creator,
                IconeImageSrc = community.iconeImageSrc
            };
        }
    }
}
