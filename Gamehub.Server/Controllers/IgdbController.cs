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
using Microsoft.Extensions.Options;

namespace Gamehub.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("external-api")]
    public class IgdbController : ControllerBase
    {
        private readonly UserServices _userServices;
        private readonly IgdbSettings _settings;

        public IgdbController(
            UserServices userServices,
            IOptions<IgdbSettings> settings)
        {
            _userServices = userServices;
            _settings = settings.Value;
        }

        [HttpPost("search")]
        public async Task<IActionResult> SearchGames([FromBody] string query)
        {
            var safeQuery = NormalizeSearchQuery(query);
            if (safeQuery is null)
                return BadRequest("A busca deve ter entre 1 e 100 caracteres.");

            var igdbClient = CreateClient();

            var searchQuery = $"fields id, name, rating, cover.image_id, genres.name, first_release_date, url, summary; " +
                              $"search \"{safeQuery}\"; " +
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
        public async Task<IActionResult> GetLibrary([FromBody] string[] libraryIds, int page, string? profileId, string? order, string? filter, string? searchQuery)
        {
            var userId = Security.ClaimsPrincipalExtensions.GetUserId(User);
            if (userId is null)
                return Unauthorized();

            User user = await _userServices.GetAsync(profileId ?? userId);
            if (user is null)
                return Unauthorized();

            if (libraryIds.Length == 0)
                return Ok(new { Games = Array.Empty<GameModel>(), TotalPages = 0, CurrentPage = 1 });

            if (libraryIds.Any(id => !long.TryParse(id, out _)))
                return BadRequest("A biblioteca contém um identificador inválido.");

            if (page == 0)
            {
                page = 1;
            }

            var igdbClient = CreateClient();
            var idList = string.Join(",", libraryIds.Select(id => id.Trim()));
            var searchIds = $"fields id, name, rating, cover.image_id, genres.name, first_release_date, url, summary; " +
                            $"sort name asc; " +
                            $"where id = ({idList}); " +
                            $"limit 500; ";
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
                        var gameFound = user.GamesLibrary?.FirstOrDefault(currentGame => currentGame.id == gameModel.id.ToString());
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
            var safeQuery = NormalizeSearchQuery(query);
            if (safeQuery is null)
                return BadRequest("A busca deve ter entre 1 e 100 caracteres.");

            var igdbClient = CreateClient();

            var searchQuery = $"fields id, name, cover.image_id, url; " +
                              $"search \"{safeQuery}\"; " +
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

        private IGDBClient CreateClient()
        {
            return new IGDBClient(_settings.ClientId, _settings.ClientSecret);
        }

        private static string? NormalizeSearchQuery(string query)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length > 100)
                return null;

            return query.Trim().Replace("\\", "\\\\").Replace("\"", "\\\"");
        }
    }
}
