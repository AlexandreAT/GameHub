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

        [HttpPost]
        public async Task<User> PostUser(User user)
        {
            await _userServices.CreateAsync(user);

            return user;
        }

    }
}
