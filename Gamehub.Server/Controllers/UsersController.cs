using Gamehub.Server.Models;
using Gamehub.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;

namespace Gamehub.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {

        private readonly UserServices _userServices;

        public UsersController(UserServices userServices)
        {
            _userServices = userServices;
        }

        [HttpGet]
        public async Task<ActionResult<List<User>>> GetUsers()
        {
            return await _userServices.GetAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(string id)
        {
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
            var userFound = await _userServices.GetUserByEmailAndPassword(request.Email, request.Password);

            // Verifica se o usuário foi encontrado
            if (userFound == null)
            {
                return NotFound("Usuário não encontrado.");
            }

            // Retorna o usuário encontrado
            return Ok(userFound);
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

    }
}
