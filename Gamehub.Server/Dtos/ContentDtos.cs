using System.ComponentModel.DataAnnotations;
using Gamehub.Server.Models;

namespace Gamehub.Server.Dtos;

public sealed class CreatePostRequest
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string Title { get; init; } = string.Empty;

    [Required, StringLength(5000, MinimumLength = 10)]
    public string Content { get; init; } = string.Empty;

    public SimplifiedGame? Game { get; init; }

    [Url, StringLength(2048)]
    public string? ImageSrc { get; init; }

    public string? CommunityId { get; init; }
}

public sealed class CreateCommunityRequest
{
    [Required, StringLength(80, MinimumLength = 2)]
    public string Name { get; init; } = string.Empty;

    public SimplifiedGame? Game { get; init; }

    [StringLength(500)]
    public string? Description { get; init; }
}
