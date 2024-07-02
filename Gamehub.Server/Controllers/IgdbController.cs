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

            var searchQuery = $"fields id, name, rating, cover.image_id, genres.name, first_release_date; " +
                              $"search \"{query}\"; " +
                              $"where version_parent = null & parent_game = null & cover.image_id != null;";
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
                            totalRating = game.Rating ?? 0
                        };

                        if (game.FirstReleaseDate != null)
                        {
                            gameModel.releaseDate = game.FirstReleaseDate.Value.ToString("dd/MM/yyyy");
                        }

                        if (game.Cover != null && game.Cover.Value != null)
                        {
                            var coverImageId = game.Cover.Value.ImageId;
                            var thumb = IGDB.ImageHelper.GetImageUrl(imageId: coverImageId, size: ImageSize.CoverBig, retina: false);
                            gameModel.imageUrl = thumb;
                        }

                        if(game.Genres != null && game.Genres.Values != null)
                        {
                            foreach (var genre in game.Genres.Values)
                            {
                                gameModel.genres.Add(genre.Name);
                            }
                        }
                        else
                        {
                            gameModel.genres.Add("Gênero não identificado");
                        }

                        gamesList.Add(gameModel);
                    }

                    gamesList = gamesList.OrderByDescending(g => g.totalRating).ToList();
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
