using Gamehub.Server.Models;
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
        private readonly IConfiguration _configuration;

        public class LoginResponse
        {
            public UserFound User { get; set; }
            public string Token { get; set; }
        }

        public UsersController(UserServices userServices, IConfiguration configuration)
        {
            _userServices = userServices;
            _configuration = configuration;
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

        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
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
                Posts = userFound.Posts,
                ImageSrc = userFound.ImageSrc,
                Following = userFound.Following,
                Followers = userFound.Followers,
                UserCommunities = userFound.UserCommunities,
                UserCreatedCommunities = userFound.UserCreatedCommunities,
                Biography = userFound.Biography,
                City = userFound.City,
                State = userFound.State,
            };

            // Retorna o usuário encontrado
            return Ok(new LoginResponse { User = newUserFound, Token = token });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<List<User>>> UpdateUser(string id, User user)
        {
            if (id != user.Id)
            {
                return BadRequest();
            }

            await _userServices.UpdateAsync(id, user);

            return await _userServices.GetAsync();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<List<User>>> DeleteUser(string id)
        {
            await _userServices.RemoveAsync(id);
            return await _userServices.GetAsync();
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

        [HttpPost("posts/{id}")]
        public async Task<ActionResult<Post>> AddPostToUser(string id, Post post)
        {
            var user = await _userServices.GetAsync(id);

            if(user == null)
            {
                return NotFound();
            }

            await _userServices.AddPostAsync(id, user, post);
            return Ok(user.Posts);
        }

        [HttpGet("posts/{id}")]
        public async Task<ActionResult<List<Post>>> GetUserPosts(string id)
        {
            return await _userServices.GetAsyncPosts(id);
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
                ImgSrc = user.ImageSrc,
                Posts = user.Posts,
                Following = user.Following,
                Biography = user.Biography,
                City = user.City,
                State = user.State,
                UserCommunities = user.UserCommunities,
                UserCreatedCommunities = user.UserCreatedCommunities,
            };
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
