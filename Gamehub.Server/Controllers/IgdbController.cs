using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;
using IGDB;
using IGDB.Models;
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
        public async Task<IActionResult> SearchGames([FromBody] string query)
        {
            var clientId = "d3ykuhzdgly8hq7c5iy1dxckg6tbvd";
            var clientSecret = "63lpytvy9kow17vypjt55i1y439x5q";

            var igdbClient = new IGDBClient(clientId, clientSecret);

            var searchQuery = $"fields *, artworks.image_id, genres.name; search \"{query}\";";
            var games = await igdbClient.QueryAsync<Game>(IGDBClient.Endpoints.Games, query: searchQuery);
            List<GameModel> gamesList = new List<GameModel>();

            if (games != null)
            {
                if (games.Any())
                {
                    foreach (var game in games)
                    {
                        var gameModel = new GameModel
                        {
                            id = game.Id,
                            name = game.Name,
                            genres = new List<string>(),
                        };

                        if (game.Artworks != null && game.Artworks.Values != null)
                        {
                            var artworkImageId = game.Artworks.Values.First().ImageId;
                            var thumb = IGDB.ImageHelper.GetImageUrl(imageId: artworkImageId, size: ImageSize.Thumb, retina: false);
                            gameModel.imageUrl = thumb;
                        }

                        foreach (var genre in game.Genres.Values)
                        {
                            gameModel.genres.Add(genre.Name);
                        }

                        gamesList.Add(gameModel);
                    }

                    return Ok(gamesList);
                }
                else
                {
                    return BadRequest("Nenhum jogo encontrado");
                }
            }
            else
            {
                return BadRequest("Erro ao buscar jogos");
            }
        }
    }
}
