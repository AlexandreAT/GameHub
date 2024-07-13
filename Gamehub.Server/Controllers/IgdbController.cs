using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;
using IGDB;
using IGDB.Models;
using Gamehub.Server.Models;
using Gamehub.Server.Services;
using System.Net.NetworkInformation;

namespace Gamehub.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IgdbController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly UserServices _userServices;

        public IgdbController(IHttpClientFactory httpClientFactory, UserServices userServices)
        {
            _userServices = userServices;
            _httpClient = httpClientFactory.CreateClient();
        }

        [HttpPost("search")]
        public async Task<IActionResult> SearchGames([FromBody] string query)
        {
            var clientId = "d3ykuhzdgly8hq7c5iy1dxckg6tbvd";
            var clientSecret = "63lpytvy9kow17vypjt55i1y439x5q";

            var igdbClient = new IGDBClient(clientId, clientSecret);

            var searchQuery = $"fields id, name, rating, cover.image_id, genres.name, first_release_date, url, summary; " +
                              $"search \"{query}\"; " +
                              $"where version_parent = null & cover.image_id != null; " +
                              $"limit 12;";
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
                            totalRating = game.Rating ?? 0,
                            siteUrl = game.Url,
                            summary = game.Summary
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

                        if (game.Genres != null && game.Genres.Values != null)
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

        [HttpPost("getLibrary")]
        public async Task<IActionResult> GetLibrary([FromBody] string[] libraryIds, int page, string userId, string? order, string? filter, string? searchQuery)
        {
            User user = await _userServices.GetAsync(userId);

            if (page == 0)
            {
                page = 1;
            }

            var clientId = "d3ykuhzdgly8hq7c5iy1dxckg6tbvd";
            var clientSecret = "63lpytvy9kow17vypjt55i1y439x5q";

            var igdbClient = new IGDBClient(clientId, clientSecret);
            var idList = string.Join(",", libraryIds.Select(id => id.Trim()));
            var searchIds = $"fields id, name, rating, cover.image_id, genres.name, first_release_date, url, summary; " +
                            $"sort name asc; " +
                            $"where id = ({idList}); " +
                            $"limit 500; ";
            Console.WriteLine(searchIds);
            var games = await igdbClient.QueryAsync<Game>(IGDBClient.Endpoints.Games, query: searchIds);
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
                            totalRating = game.Rating ?? 0,
                            siteUrl = game.Url,
                            summary = game.Summary
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

                        if (game.Genres != null && game.Genres.Values != null)
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

                    // Verificar a lista de jogos da biblioteca do usuário
                    foreach (var gameModel in gamesList)
                    {
                        var gameFound = user.GamesLibrary.FirstOrDefault(currentGame => currentGame.id == gameModel.id.ToString());
                        if (gameFound != null)
                        {
                            gameModel.pin = gameFound.pin;
                            gameModel.userRating = gameFound.rating;
                            gameModel.state = gameFound.state;
                        }
                        else
                        {
                            gameModel.pin = false;
                            gameModel.userRating = null;
                            gameModel.state = null;
                        }
                    }

                    if (order != null)
                    {
                        if (order == "rating")
                        {
                            gamesList = gamesList.OrderByDescending(g => g.pin).ThenByDescending(g => g.userRating).ToList();
                        }
                        else if (order == "name")
                        {
                            gamesList = gamesList.OrderByDescending(g => g.pin).ThenBy(g => g.name).ToList();
                        }
                    }
                    else
                    {
                        // Ordenar a lista de jogos com base no status de pin e nome
                        gamesList = gamesList.OrderByDescending(g => g.pin).ThenBy(g => g.name).ToList();
                    }

                    if (filter != null)
                    {
                        gamesList = gamesList.Where(g => g.state == filter).ToList();
                    }

                    if (!string.IsNullOrEmpty(searchQuery))
                    {
                        gamesList = gamesList.Where(g => g.name.ToLower().Contains(searchQuery.ToLower())).ToList();
                    }

                    var totalPages = (int)Math.Ceiling((double)gamesList.Count / 20);
                    var paginatedGames = gamesList.Skip((page - 1) * 20).Take(20);

                    var result = new
                    {
                        Games = paginatedGames,
                        TotalPages = totalPages,
                        CurrentPage = page
                    };

                    return Ok(result);
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

        [HttpPost("getSimplifiedGame")]
        public async Task<IActionResult> GetSimplifiedGame([FromBody] string query)
        {
            var clientId = "d3ykuhzdgly8hq7c5iy1dxckg6tbvd";
            var clientSecret = "63lpytvy9kow17vypjt55i1y439x5q";

            var igdbClient = new IGDBClient(clientId, clientSecret);

            var searchQuery = $"fields id, name, cover.image_id, url; " +
                              $"search \"{query}\"; " +
                              $"where version_parent = null & cover.image_id != null; " +
                              $"limit 5;";
            var games = await igdbClient.QueryAsync<Game>(IGDBClient.Endpoints.Games, query: searchQuery);
            List<SimplifiedGame> gamesList = new List<SimplifiedGame>();

            if (games != null)
            {
                if (games.Any())
                {
                    foreach (var game in games)
                    {
                        var gameModel = new SimplifiedGame
                        {
                            gameId = game.Id,
                            name = game.Name,
                            siteUrl = game.Url
                        };

                        if (game.Cover != null && game.Cover.Value != null)
                        {
                            var coverImageId = game.Cover.Value.ImageId;
                            var thumb = IGDB.ImageHelper.GetImageUrl(imageId: coverImageId, size: ImageSize.CoverBig, retina: false);
                            gameModel.imageUrl = thumb;
                        }

                        gamesList.Add(gameModel);
                    }

                    gamesList = gamesList.OrderBy(g => g.name).ToList();

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