using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;
using IGDB;
using IGDB.Models;

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
        [EnableCors("CorsPolicy")]
        public async Task<IActionResult> SearchGames([FromBody] string query)
        {
            var clientId = "d3ykuhzdgly8hq7c5iy1dxckg6tbvd";
            var clientSecret = "63lpytvy9kow17vypjt55i1y439x5q";

            var igdbClient = new IGDBClient(clientId, clientSecret);

            var searchQuery = $"fields *; search \"{query}\";";
            var games = await igdbClient.QueryAsync<Game>(IGDBClient.Endpoints.Games, query: searchQuery);

            if (games != null)
            {
                return Ok(games);
            }
            else
            {
                return BadRequest("Erro ao buscar jogos");
            }
        }
    }
}
