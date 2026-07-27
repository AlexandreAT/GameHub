using System.ComponentModel.DataAnnotations;

namespace Gamehub.Server.Models;

public sealed class JwtSettings
{
    public const string SectionName = "Jwt";

    [Required]
    public string SecretKey { get; init; } = string.Empty;

    [Required]
    public string Issuer { get; init; } = string.Empty;

    [Required]
    public string Audience { get; init; } = string.Empty;
}

public sealed class IgdbSettings
{
    public const string SectionName = "Igdb";

    [Required]
    public string ClientId { get; init; } = string.Empty;

    [Required]
    public string ClientSecret { get; init; } = string.Empty;
}

public sealed class ImgBbSettings
{
    public const string SectionName = "ImgBb";

    [Required]
    public string ApiKey { get; init; } = string.Empty;
}
