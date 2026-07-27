using System.Text.Json;
using Gamehub.Server.Models;
using Microsoft.Extensions.Options;

namespace Gamehub.Server.Services;

public sealed class ImageHostingService
{
    private const long MaximumFileSize = 10 * 1024 * 1024;
    private static readonly HashSet<string> AllowedContentTypes =
    [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    private readonly HttpClient _httpClient;
    private readonly ImgBbSettings _settings;

    public ImageHostingService(HttpClient httpClient, IOptions<ImgBbSettings> settings)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
    }

    public async Task<string> UploadAsync(IFormFile image, CancellationToken cancellationToken)
    {
        if (image.Length == 0 || image.Length > MaximumFileSize)
        {
            throw new ArgumentException("A imagem deve possuir no máximo 10 MB.");
        }

        if (!AllowedContentTypes.Contains(image.ContentType))
        {
            throw new ArgumentException("Formato de imagem não permitido.");
        }

        using var formData = new MultipartFormDataContent();
        await using var stream = image.OpenReadStream();
        using var imageContent = new StreamContent(stream);
        imageContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(image.ContentType);
        formData.Add(imageContent, "image", Path.GetFileName(image.FileName));

        var endpoint = $"https://api.imgbb.com/1/upload?key={Uri.EscapeDataString(_settings.ApiKey)}";
        using var response = await _httpClient.PostAsync(endpoint, formData, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException("O serviço de imagens recusou o upload.");
        }

        using var document = JsonDocument.Parse(responseBody);
        if (!document.RootElement.TryGetProperty("data", out var data) ||
            !data.TryGetProperty("url", out var urlElement) ||
            string.IsNullOrWhiteSpace(urlElement.GetString()))
        {
            throw new InvalidOperationException("O serviço de imagens retornou uma resposta inválida.");
        }

        return urlElement.GetString()!;
    }
}
