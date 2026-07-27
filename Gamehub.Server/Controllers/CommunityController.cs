using Gamehub.Server.Dtos;
using Gamehub.Server.Models;
using Gamehub.Server.Security;
using Gamehub.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gamehub.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CommunityController : ControllerBase
{
    private const string DefaultIcon = "https://cdn-icons-png.flaticon.com/512/326/326003.png";

    private readonly CommunityServices _communityServices;
    private readonly UserServices _userServices;
    private readonly PostServices _postServices;

    public CommunityController(
        CommunityServices communityServices,
        UserServices userServices,
        PostServices postServices)
    {
        _communityServices = communityServices;
        _userServices = userServices;
        _postServices = postServices;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<List<Community>> GetCommunities() => await _communityServices.GetAsync();

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<ActionResult<Community>> GetCommunity(string id)
    {
        var community = await _communityServices.GetAsync(id);
        return community is null ? NotFound() : Ok(community);
    }

    [AllowAnonymous]
    [HttpGet("search")]
    public async Task<ActionResult<List<SimplifiedCommunity>>> SearchCommunities(string query) =>
        await _communityServices.SearchCommunitiesAsync(query);

    [AllowAnonymous]
    [HttpGet("searchAll")]
    public async Task<ActionResult<List<SimplifiedCommunity>>> SearchAllCommunities(string query) =>
        await _communityServices.SearchAllCommunitiesAsync(query);

    [HttpPost]
    public async Task<ActionResult<Community>> PostCommunity(CreateCommunityRequest request)
    {
        var creator = await GetAuthenticatedUserAsync();
        if (creator is null)
            return Unauthorized();

        var community = new Community
        {
            Creator = creator.Id,
            Name = request.Name.Trim(),
            Game = request.Game,
            Description = request.Description?.Trim(),
            iconeImageSrc = DefaultIcon,
            Followers = [],
            Post = []
        };

        var created = await _communityServices.CreateAsync(community);
        await _userServices.AddCreatedCommunities(created.Id!, creator);
        return CreatedAtAction(nameof(GetCommunity), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCommunity(
        string id,
        [FromForm] string name,
        [FromForm] string? description,
        [FromForm] SimplifiedGame? game)
    {
        var community = await _communityServices.GetAsync(id);
        if (community is null)
            return NotFound();
        if (!IsOwner(community))
            return Forbid();

        community.Game = game;
        community.Name = name.Trim();
        community.Description = description?.Trim();
        await _communityServices.UpdateAsync(id, community);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCommunity(string id)
    {
        var community = await _communityServices.GetAsync(id);
        if (community is null)
            return NotFound();
        if (!IsOwner(community))
            return Forbid();

        await _communityServices.RemoveAsync(id);
        var user = await GetAuthenticatedUserAsync();
        if (user?.UserCreatedCommunities?.Remove(id) == true)
            await _userServices.UpdateAsync(user.Id!, user);

        await _userServices.DeleteCommunityId(id);
        await _postServices.RemovePostsCommunity(id);
        return NoContent();
    }

    [HttpPost("upload-image")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("upload")]
    public async Task<ActionResult<Community>> UploadImage(
        [FromForm] string image,
        [FromForm] string id,
        [FromForm] string opt)
    {
        if (string.IsNullOrWhiteSpace(image))
            return BadRequest("Imagem não pode ser nula ou vazia.");

        var community = await _communityServices.GetAsync(id);
        if (community is null)
            return NotFound();
        if (!IsOwner(community))
            return Forbid();

        if (opt == "icone")
            community.iconeImageSrc = image;
        else if (opt == "background")
            community.backgroundImageSrc = image;
        else
            return BadRequest("Opção inválida.");

        await _communityServices.UpdateAsync(id, community);
        return Ok(community);
    }

    [HttpPost("followCommunity")]
    public async Task<IActionResult> FollowCommunity([FromForm] string communityId)
    {
        var user = await GetAuthenticatedUserAsync();
        if (user is null)
            return Unauthorized();

        var community = await _communityServices.GetAsync(communityId);
        if (community is null)
            return NotFound();

        var updatedUser = await _communityServices.HandleFollowing(user, community);
        await _userServices.UpdateAsync(updatedUser.Id!, updatedUser);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("getFollowers")]
    public async Task<ActionResult<List<SimplifiedUser>>> GetFollowers([FromForm] string communityId)
    {
        var community = await _communityServices.GetAsync(communityId);
        return community is null
            ? NotFound()
            : Ok(await _communityServices.GetSimplifiedUsersAsync(community));
    }

    [AllowAnonymous]
    [HttpGet("getSimplifiedCommunity")]
    public async Task<ActionResult<SimplifiedCommunity>> GetSimplifiedCommunity(string communityId)
    {
        var community = await _communityServices.GetAsync(communityId);
        if (community is null)
            return NotFound();

        return Ok(new SimplifiedCommunity
        {
            Id = community.Id!,
            Name = community.Name,
            CreatorId = community.Creator,
            IconeImageSrc = community.iconeImageSrc,
            BackgroundImageSrc = community.backgroundImageSrc
        });
    }

    private bool IsOwner(Community community) => community.Creator == User.GetUserId();

    private async Task<User?> GetAuthenticatedUserAsync()
    {
        var userId = User.GetUserId();
        return userId is null ? null : await _userServices.GetAsync(userId);
    }
}
