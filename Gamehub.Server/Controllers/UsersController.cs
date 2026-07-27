using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Gamehub.Server.Dtos;
using Gamehub.Server.Models;
using Gamehub.Server.Security;
using Gamehub.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Gamehub.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UsersController : ControllerBase
{
    private const string DefaultAvatar = "https://i.ibb.co/GV8KmKN/gamer-icon-png-10.jpg";
    private const string DefaultBackground = "https://i.ibb.co/QRWKbn/Banner-Login-jpg.png";
    private static readonly string DummyPasswordHash = PasswordHasher.Hash("GameHub-Dummy-Password");

    private readonly UserServices _userServices;
    private readonly PostServices _postServices;
    private readonly CommunityServices _communityServices;
    private readonly JwtSettings _jwtSettings;

    public UsersController(
        UserServices userServices,
        IOptions<JwtSettings> jwtSettings,
        PostServices postServices,
        CommunityServices communityServices)
    {
        _userServices = userServices;
        _jwtSettings = jwtSettings.Value;
        _postServices = postServices;
        _communityServices = communityServices;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<List<SimplifiedUser>>> GetUsers()
    {
        var users = await _userServices.GetAsync();
        return users.Select(ToSimplifiedUser).ToList();
    }

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<ActionResult<PublicUserDto>> GetUser(string id)
    {
        var user = await _userServices.GetAsync(id);
        return user is null ? NotFound() : Ok(user.ToPublicDto());
    }

    [AllowAnonymous]
    [HttpGet("getSimplifiedUser")]
    public async Task<ActionResult<SimplifiedUser>> GetSimplifiedUser(string userId)
    {
        var user = await _userServices.GetAsync(userId);
        return user is null ? NotFound() : Ok(ToSimplifiedUser(user));
    }

    [AllowAnonymous]
    [HttpGet("search")]
    public async Task<ActionResult<List<SimplifiedUser>>> SearchUsers(string query) =>
        await _userServices.SearchUsersAsync(query);

    [AllowAnonymous]
    [HttpGet("searchAll")]
    public async Task<ActionResult<List<SimplifiedUser>>> SearchAllUsers(string query) =>
        await _userServices.SearchAllUsersAsync(query);

    [AllowAnonymous]
    [EnableRateLimiting("authentication")]
    [HttpPost]
    public async Task<ActionResult<CurrentUserDto>> PostUser(RegisterUserRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var nickname = request.Nickname.Trim();

        if (await _userServices.NicknameExistsAsync(nickname))
            return BadRequest("Nickname já existe.");

        if (await _userServices.EmailExistsAsync(email))
            return BadRequest("Email já existe.");

        var user = new User
        {
            Name = request.Name.Trim(),
            Surname = request.Surname.Trim(),
            Nickname = nickname,
            Phone = request.Phone,
            Email = email,
            Password = PasswordHasher.Hash(request.Password),
            PasswordResetRequired = false,
            ImageSrc = DefaultAvatar,
            BackgroundImage = DefaultBackground,
            Following = [],
            Followers = [],
            UserCommunities = [],
            UserCreatedCommunities = [],
            GamesLibrary = []
        };

        var createdUser = await _userServices.CreateAsync(user);
        return CreatedAtAction(nameof(GetUser), new { id = createdUser.Id }, createdUser.ToCurrentDto());
    }

    [AllowAnonymous]
    [EnableRateLimiting("authentication")]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var user = await _userServices.GetByEmailAsync(request.Email);
        var passwordMatches = PasswordHasher.Verify(
            request.Password,
            user?.Password ?? DummyPasswordHash);

        if (user is null || user.PasswordResetRequired || !passwordMatches)
            return Unauthorized("Email ou senha inválidos.");

        var token = GenerateJwtToken(user);
        return Ok(new LoginResponse(user.ToCurrentDto(), token));
    }

    [HttpPut("current")]
    public async Task<ActionResult<CurrentUserDto>> UpdateCurrentUser([FromForm] UpdateCurrentUserRequest request)
    {
        var user = await GetAuthenticatedUserAsync();
        if (user is null)
            return Unauthorized();

        var nickname = request.Nickname.Trim();
        if (await _userServices.NicknameExistsAsync(nickname, user.Id))
            return BadRequest("Nickname já existe.");

        user.Nickname = nickname;
        user.City = request.City?.Trim();
        user.State = request.State?.Trim();
        user.Phone = request.Phone?.Trim();
        user.Biography = request.Biography?.Trim();

        await _userServices.UpdateAsync(user.Id!, user);
        await _postServices.UpdateUserPosts(user);
        await _postServices.UpdateUserComments(user);
        return Ok(user.ToCurrentDto());
    }

    [HttpPut("current/password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var user = await GetAuthenticatedUserAsync();
        if (user is null)
            return Unauthorized();

        if (!PasswordHasher.Verify(request.CurrentPassword, user.Password))
            return BadRequest("Senha atual inválida.");

        if (request.CurrentPassword == request.NewPassword)
            return BadRequest("A nova senha deve ser diferente da senha atual.");

        user.Password = PasswordHasher.Hash(request.NewPassword);
        user.PasswordResetRequired = false;
        user.TokenVersion++;
        await _userServices.UpdateAsync(user.Id!, user);
        return NoContent();
    }

    [HttpDelete("current")]
    public async Task<IActionResult> DeleteCurrentUser()
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized();

        await _userServices.RemoveAsync(userId);
        await _userServices.DeleteUserFromFollowersAndFollowing(userId);
        await _postServices.DeleteUserPosts(userId);
        await _postServices.DeleteUserComments(userId);
        await _communityServices.DeleteUserCreatedCommunities(userId);
        await _communityServices.DeleteUserFromCommunityFollowers(userId);
        return NoContent();
    }

    [HttpGet("current")]
    public async Task<ActionResult<CurrentUserDto>> GetCurrentUserData()
    {
        var user = await GetAuthenticatedUserAsync();
        return user is null ? Unauthorized() : Ok(user.ToCurrentDto());
    }

    [AllowAnonymous]
    [HttpGet("anotherUser/{id}")]
    public async Task<ActionResult<PublicUserDto>> GetAnotherUserAsync(string id)
    {
        var user = await _userServices.GetAsync(id);
        return user is null ? NotFound() : Ok(user.ToPublicDto());
    }

    [HttpPost("upload-image")]
    [EnableRateLimiting("upload")]
    public async Task<ActionResult<CurrentUserDto>> UploadImage([FromForm] string image)
    {
        if (string.IsNullOrWhiteSpace(image))
            return BadRequest("Imagem não pode ser nula ou vazia.");

        var user = await GetAuthenticatedUserAsync();
        if (user is null)
            return Unauthorized();

        user.ImageSrc = image;
        await _userServices.UpdateAsync(user.Id!, user);
        await _postServices.UpdateUserPosts(user);
        await _postServices.UpdateUserComments(user);
        return Ok(user.ToCurrentDto());
    }

    [HttpPost("upload-background")]
    [EnableRateLimiting("upload")]
    public async Task<ActionResult<CurrentUserDto>> UploadBackground([FromForm] string background)
    {
        if (string.IsNullOrWhiteSpace(background))
            return BadRequest("Imagem não pode ser nula ou vazia.");

        var user = await GetAuthenticatedUserAsync();
        if (user is null)
            return Unauthorized();

        user.BackgroundImage = background;
        await _userServices.UpdateAsync(user.Id!, user);
        return Ok(user.ToCurrentDto());
    }

    [HttpPost("followUser")]
    public async Task<IActionResult> FollowUser([FromForm] string followingId)
    {
        var user = await GetAuthenticatedUserAsync();
        if (user is null)
            return Unauthorized();
        if (followingId == user.Id)
            return BadRequest("Não é possível seguir a própria conta.");
        if (await _userServices.GetAsync(followingId) is null)
            return NotFound();

        await _userServices.HandleFollowing(followingId, user);
        return NoContent();
    }

    [HttpPost("getFollowersOrFollowing")]
    public async Task<ActionResult<List<SimplifiedUser>>> GetFollowersOrFollowing(
        [FromForm] string opt,
        [FromForm] string? profileId)
    {
        var targetId = profileId ?? User.GetUserId();
        if (targetId is null)
            return Unauthorized();

        var user = await _userServices.GetAsync(targetId);
        return user is null ? NotFound() : Ok(await _userServices.GetSimplifiedUsersAsync(opt, user));
    }

    [HttpPost("getFollowingCommunityOrCreatedCommunity")]
    public async Task<ActionResult<List<SimplifiedCommunity>>> GetFollowingCommunityOrCreatedCommunity(
        [FromForm] string opt,
        [FromForm] string? profileId)
    {
        var targetId = profileId ?? User.GetUserId();
        if (targetId is null)
            return Unauthorized();

        var user = await _userServices.GetAsync(targetId);
        return user is null ? NotFound() : Ok(await _communityServices.GetSimplifiedCommunity(opt, user));
    }

    [HttpPost("handleGameLibrary")]
    public async Task<IActionResult> HandleGameLibrary([FromForm] string gameId) =>
        await UpdateLibrary(user => _userServices.HandleGameLibrary(gameId, user));

    [HttpPost("handleStatus")]
    public async Task<IActionResult> HandleStatus([FromForm] string status, [FromForm] string gameId) =>
        await UpdateLibrary(user => _userServices.HandleStatusGame(status, gameId, user));

    [HttpPost("handlePin")]
    public async Task<IActionResult> HandlePin([FromForm] bool pin, [FromForm] string gameId) =>
        await UpdateLibrary(user => _userServices.HandlePinGame(pin, gameId, user));

    [HttpPost("handleRating")]
    public async Task<IActionResult> HandleRating([FromForm] float rating, [FromForm] string gameId)
    {
        if (rating is < 0 or > 10)
            return BadRequest("A nota deve estar entre 0 e 10.");

        return await UpdateLibrary(user => _userServices.HandleRatingGame(rating, gameId, user));
    }

    private async Task<IActionResult> UpdateLibrary(Func<User, Task> update)
    {
        var user = await GetAuthenticatedUserAsync();
        if (user is null)
            return Unauthorized();

        await update(user);
        return NoContent();
    }

    private async Task<User?> GetAuthenticatedUserAsync()
    {
        var userId = User.GetUserId();
        return userId is null ? null : await _userServices.GetAsync(userId);
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id!),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtClaimNames.TokenVersion, user.TokenVersion.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static SimplifiedUser ToSimplifiedUser(User user) => new()
    {
        UserId = user.Id!,
        NickName = user.Nickname,
        UserImageSrc = user.ImageSrc,
        BackgroundImage = user.BackgroundImage
    };
}
