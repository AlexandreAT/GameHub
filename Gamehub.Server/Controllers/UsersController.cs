using Gamehub.Server.Models;
using Gamehub.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

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
        public async Task<List<User>> GetUsers() => await _userServices.GetAsync();

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
        public async Task<User> PostUser(User user)
        {
            await _userServices.CreateAsync(user);

            return user;
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
