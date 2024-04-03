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
                Cpf = userFound.Cpf,
                Phone = userFound.Phone,
                Email = userFound.Email,
                Password = userFound.Password
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

            // Obtém o email do usuário do claim
            var userEmail = User.FindFirst(ClaimTypes.Name)?.Value;

            // Obtém o usuário com base no email
            // ERRO AQUI------------------------------------------------------------------------------------------------------------------------------
            var user = string.IsNullOrEmpty(userEmail) ? null : await _userServices.GetUserByEmailAndPassword(userEmail, null).ConfigureAwait(false);

            // Verifica se o usuário foi encontrado
            if (user == null)
            {
                return NotFound();
            }

            // Retorna o usuário encontrado
            return Ok(user);
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim("Id", user.Id.ToString()),
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
