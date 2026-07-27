using Gamehub.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gamehub.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public sealed class ImagesController : ControllerBase
{
    private readonly ImageHostingService _imageHostingService;

    public ImagesController(ImageHostingService imageHostingService)
    {
        _imageHostingService = imageHostingService;
    }

    [HttpPost("upload")]
    [Authorize]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile? image, CancellationToken cancellationToken)
    {
        if (image is null)
        {
            return BadRequest("Selecione uma imagem.");
        }

        try
        {
            var url = await _imageHostingService.UploadAsync(image, cancellationToken);
            return Ok(new { url });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(exception.Message);
        }
        catch (InvalidOperationException exception)
        {
            return StatusCode(StatusCodes.Status502BadGateway, exception.Message);
        }
    }
}
