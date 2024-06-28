using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Gamehub.Server.Models;

namespace Gamehub.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IgdbController : ControllerBase
    {
        private readonly HttpClient _httpClient;

        public IgdbController(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient();
        }

        [HttpPost("search")]
        public async Task<IActionResult> SearchGames([FromBody] string body)
        {
            var accessToken = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
            Console.WriteLine($"Token de acesso: {accessToken}");

            var clientId = "d3ykuhzdgly8hq7c5iy1dxckg6tbvd";
            var url = "https://api.igdb.com/v4/games";

            var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Headers =
                {
                    { "Client-ID", clientId },
                    { "Authorization", $"Bearer {accessToken}" },
                    { "Accept", "application/json" }
                },
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            };

            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                var data = await response.Content.ReadFromJsonAsync<Game[]>();
                return Ok(data);
            }
            else
            {
                return BadRequest("Erro ao buscar jogos");
            }
        }
    }
}
