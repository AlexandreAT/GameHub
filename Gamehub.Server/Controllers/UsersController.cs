﻿using Gamehub.Server.Models;
using Gamehub.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.WebEncoders.Testing;

namespace Gamehub.Server.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {

        private readonly UserServices _userServices;
        private readonly PostServices _postServices;
        private readonly CommunityServices _communityServices;
        private readonly IConfiguration _configuration;

        public class LoginResponse
        {
            public UserFound User { get; set; }
            public string Token { get; set; }
        }

        public UsersController(UserServices userServices, IConfiguration configuration, PostServices postServices, CommunityServices communityServices)
        {
            _userServices = userServices;
            _configuration = configuration;
            _postServices = postServices;
            _communityServices = communityServices;
        }

        [HttpGet]
        public async Task<ActionResult<List<User>>> GetUsers()
        {
            return await _userServices.GetAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(string id)
        {

            if (!Request.Headers.ContainsKey("Authorization"))
                return BadRequest();

            var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

            if (string.IsNullOrEmpty(token))
                return BadRequest();

            var jwtHandler = new JwtSecurityTokenHandler();
            var jwtToken = jwtHandler.ReadJwtToken(token);

            if (jwtToken == null || jwtToken.Issuer != "your-issuer-url")
                return BadRequest();

            var user = await _userServices.GetAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            return user;
        }

        [HttpGet("getSimplifiedUser")]
        public async Task<SimplifiedUser> GetSimplifiedUser(string userId)
        {
            User user = await _userServices.GetAsync(userId);
            SimplifiedUser newSimplifiedUser = new SimplifiedUser
            {
                UserId = userId,
                NickName = user.Nickname,
                UserImageSrc = user.ImageSrc,
                BackgroundImage = user.BackgroundImage,
            };

            return newSimplifiedUser;
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<SimplifiedUser>>> SearchUsers(string query)
        {
            return await _userServices.SearchUsersAsync(query);
        }

        [HttpGet("searchAll")]
        public async Task<ActionResult<List<SimplifiedUser>>> SearchAllUsers(string query)
        {
            return await _userServices.SearchAllUsersAsync(query);
        }

        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            if (await _userServices.NicknameExistsAsync(user.Nickname))
            {
                return BadRequest("Nickname já existe.");
            }

            if (await _userServices.CpfExistsAsync(user.Cpf))
            {
                return BadRequest("CPF já existe.");
            }

            if (await _userServices.EmailExistsAsync(user.Email))
            {
                return BadRequest("Email já existe.");
            }

            User createdUser = await _userServices.CreateAsync(user);
            return CreatedAtAction(nameof(GetUser), new { id = createdUser.Id }, createdUser);
        }

        [HttpPost("login")]
        public async Task<ActionResult<User>> Login(LoginRequest request)
        {
            // Verifica se o email e a senha estão presentes
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest("Email e senha são obrigatórios.");
            }

            // Busca o usuário com base no email e senha
            var userFound = await _userServices.GetUserByEmailAndPassword(request.Email, request.Password).ConfigureAwait(false);

            // Verifica se o usuário foi encontrado
            if (userFound == null)
            {
                return NotFound("Usuário não encontrado.");
            }

            var token = GenerateJwtToken(userFound);

            CookieOptions options = new CookieOptions();
            options.Expires = DateTime.UtcNow.AddDays(7);
            options.HttpOnly = true;
            Response.Cookies.Append(".AspNetCore.Application.Authorization", token, options);

            var newUserFound = new UserFound
            {
                Id = userFound.Id,
                Name = userFound.Name,
                Surname = userFound.Surname,
                Nickname = userFound.Nickname,
                Cpf = userFound.Cpf,
                Phone = userFound.Phone,
                Email = userFound.Email,
                Password = userFound.Password,
                ImageSrc = userFound.ImageSrc,
                Following = userFound.Following,
                Followers = userFound.Followers,
                UserCommunities = userFound.UserCommunities,
                UserCreatedCommunities = userFound.UserCreatedCommunities,
                Biography = userFound.Biography,
                City = userFound.City,
                State = userFound.State,
                BackgroundImage = userFound.BackgroundImage,
                GamesLibrary = userFound.GamesLibrary
            };

            // Retorna o usuário encontrado
            return Ok(new LoginResponse { User = newUserFound, Token = token });
        }

        [HttpPut("{id}")]
        public async Task UpdateUser([FromForm] string id, [FromForm] string nickname, [FromForm] string? phone, [FromForm] string? city, [FromForm] string? state, [FromForm] string password, [FromForm] string? biography)
        {   
            User userFound = await _userServices.GetAsync(id);

            if (userFound != null)
            {
                userFound.Nickname = nickname;
                userFound.City = city;
                userFound.State = state;
                userFound.Phone = phone;
                userFound.Password = password;
                if (biography != userFound.Biography)
                {
                    userFound.Biography = biography;
                }
            }
            else
            {
                throw new Exception("Usuário não encontrado!");
            }

            await _userServices.UpdateAsync(userFound.Id, userFound);
            await _postServices.UpdateUserPosts(userFound);
            await _postServices.UpdateUserComments(userFound);
            //await _userServices.UpdateSimplifiedUser(userFound);
            //await _communityServices.UpdateUserInCommunitiesAsync(userFound);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<List<User>>> DeleteUser(string id)
        {
            await _userServices.RemoveAsync(id);
            await _userServices.DeleteUserFromFollowersAndFollowing(id);
            await _postServices.DeleteUserPosts(id);
            await _postServices.DeleteUserComments(id);
            await _communityServices.DeleteUserCreatedCommunities(id);
            await _communityServices.DeleteUserFromCommunityFollowers(id);
            return Ok();
        }

        [HttpGet("current")]
        public ActionResult<User> GetCurrentUserData()
        {

            // Verifica se o cabeçalho Authorization está presente
            if (!Request.Headers.ContainsKey("Authorization"))
            {
                return BadRequest();
            }

            // Obtém o token do cabeçalho Authorization
            var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

            // Verifica se o token está presente
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest();
            }

            // Valida o token
            var jwtHandler = new JwtSecurityTokenHandler();

            if (!jwtHandler.CanReadToken(token))
            {
                return BadRequest();
            }

            var jwtToken = jwtHandler.ReadJwtToken(token);

            // Obtém o ID do usuário do token JWT
            var userId = jwtToken.Claims.First(x => x.Type == "Id").Value;

            try
            {
                // Obtém o usuário com base no ID
                var user = _userServices.GetAsync(userId).Result;

                // Verifica se o usuário foi encontrado
                if (user == null)
                {
                    return NotFound();
                }

                // Retorna o usuário encontrado
                return Ok(user);
            }
            catch (Exception ex)
            {
                // Remove o cookie do token JWT
                Response.Cookies.Delete(".AspNetCore.Application.Authorization");

                // Retorna uma resposta de erro
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("anotherUser/{id}")]
        public async Task<AnotherUser> GetAnotherUserAsync(string userId)
        {
            User user = await _userServices.GetAsync(userId);
            return new AnotherUser
            {
                Id = user.Id,
                Name = user.Name,
                Surname = user.Surname,
                Nickname = user.Nickname,
                ImageSrc = user.ImageSrc,
                Following = user.Following,
                Followers = user.Followers,
                Biography = user.Biography,
                City = user.City,
                State = user.State,
                UserCommunities = user.UserCommunities,
                UserCreatedCommunities = user.UserCreatedCommunities,
                BackgroundImage = user.BackgroundImage,
                GamesLibrary = user.GamesLibrary
            };
        }

        [HttpPost("upload-image")]
        public async Task<ActionResult<User>> UploadImage([FromForm] string image, [FromForm] string id)
        {
            if (image == null || image.Length == 0)
            {
                return BadRequest("Imagem não pode ser nula ou vazia.");
            }
            User user = await _userServices.GetAsync(id);
            user.ImageSrc = image;
            await _userServices.UpdateAsync(id, user);
            await _postServices.UpdateUserPosts(user);
            await _postServices.UpdateUserComments(user);
            //await _userServices.UpdateSimplifiedUser(user);
            return Ok(user);
        }

        [HttpPost("upload-background")]
        public async Task<ActionResult<User>> UploadBackground([FromForm] string background, [FromForm] string id)
        {
            if (background == null || background.Length == 0)
            {
                return BadRequest("Imagem não pode ser nula ou vazia.");
            }
            User user = await _userServices.GetAsync(id);
            user.BackgroundImage = background;
            await _userServices.UpdateAsync(id, user);
            await _postServices.UpdateUserPosts(user);
            await _postServices.UpdateUserComments(user);
            return Ok(user);
        }

        [HttpPost("followUser")]
        public async Task FollowUser([FromForm] string followingId, [FromForm] string userId)
        {
            User user = await _userServices.GetAsync(userId);
            await _userServices.HandleFollowing(followingId, user);
        }

        [HttpPost("getFollowersOrFollowing")]
        public async Task<List<SimplifiedUser>> GetFollowersOrFollowing([FromForm] string opt, [FromForm] string userId)
        {
            User user = await _userServices.GetAsync(userId);
            List<SimplifiedUser> simplifiedUsers = await _userServices.GetSimplifiedUsersAsync(opt, user);
            return simplifiedUsers;
        }

        [HttpPost("getFollowingCommunityOrCreatedCommunity")]
        public async Task<List<SimplifiedCommunity>> getFollowingCommunityOrCreatedCommunity([FromForm] string opt, [FromForm] string userId)
        {
            User user = await _userServices.GetAsync(userId);
            List<SimplifiedCommunity> simplifiedCommunities = await _communityServices.GetSimplifiedCommunity(opt, user);
            return simplifiedCommunities;
        }

        [HttpGet("getPassword")]
        public async Task<string> GetPassword(string email, string nickname)
        {
            string password = await _userServices.GetPassword(email, nickname);
            if (password == null)
            {
                throw new Exception("Senha não encontrada");
            }
            return password;
        }

        [HttpPost("handleGameLibrary")]
        public async Task HandleGameLibrary([FromForm] string gameId, [FromForm] string userId)
        {
            User user = await _userServices.GetAsync(userId);
            await _userServices.HandleGameLibrary(gameId, user);
        }

        [HttpPost("handleStatus")]
        public async Task HandleStatus([FromForm] string status, [FromForm] string gameId, [FromForm] string userId)
        {
            User user = await _userServices.GetAsync(userId);
            await _userServices.HandleStatusGame(status, gameId, user);
        }

        [HttpPost("handlePin")]
        public async Task HandlePin([FromForm] bool pin, [FromForm] string gameId, [FromForm] string userId)
        {
            User user = await _userServices.GetAsync(userId);
            await _userServices.HandlePinGame(pin, gameId, user);
        }

        [HttpPost("handleRating")]
        public async Task HandleRating([FromForm] float rating, [FromForm] string gameId, [FromForm] string userId)
        {
            User user = await _userServices.GetAsync(userId);
            await _userServices.HandleRatingGame(rating, gameId, user);
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim("Id", user.Id),
                new Claim("Email", user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var privateKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["jwt:secretKey"]));

            var credentials = new SigningCredentials(privateKey, SecurityAlgorithms.HmacSha256);

            var expiration = DateTime.UtcNow.AddMinutes(10);

            JwtSecurityToken token = new JwtSecurityToken(
                    claims: claims,
                    expires: expiration,
                    signingCredentials: credentials
                );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
