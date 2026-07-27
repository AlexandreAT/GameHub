using System.ComponentModel.DataAnnotations;
using Gamehub.Server.Models;

namespace Gamehub.Server.Dtos;

public sealed class RegisterUserRequest
{
    [Required, StringLength(20, MinimumLength = 2)]
    public string Name { get; init; } = string.Empty;

    [Required, StringLength(50, MinimumLength = 2)]
    public string Surname { get; init; } = string.Empty;

    [Required, StringLength(20, MinimumLength = 2)]
    public string Nickname { get; init; } = string.Empty;

    [StringLength(20)]
    public string? Phone { get; init; }

    [Required, EmailAddress, StringLength(254)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(72, MinimumLength = 8)]
    public string Password { get; init; } = string.Empty;
}

public sealed class LoginRequest
{
    [Required, EmailAddress, StringLength(254)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(72, MinimumLength = 8)]
    public string Password { get; init; } = string.Empty;
}

public sealed class UpdateCurrentUserRequest
{
    [Required, StringLength(20, MinimumLength = 2)]
    public string Nickname { get; init; } = string.Empty;

    [StringLength(20)]
    public string? Phone { get; init; }

    [StringLength(80)]
    public string? City { get; init; }

    [StringLength(80)]
    public string? State { get; init; }

    [StringLength(500)]
    public string? Biography { get; init; }
}

public sealed class ChangePasswordRequest
{
    [Required, StringLength(72, MinimumLength = 8)]
    public string CurrentPassword { get; init; } = string.Empty;

    [Required, StringLength(72, MinimumLength = 8)]
    public string NewPassword { get; init; } = string.Empty;
}

public sealed record LoginResponse(CurrentUserDto User, string Token);

public sealed record CurrentUserDto(
    string Id,
    string Name,
    string Surname,
    string Nickname,
    string? Phone,
    string Email,
    string? ImageSrc,
    IReadOnlyList<string> Following,
    IReadOnlyList<string> Followers,
    IReadOnlyList<string> UserCommunities,
    IReadOnlyList<string> UserCreatedCommunities,
    string? Biography,
    string? City,
    string? State,
    string? BackgroundImage,
    IReadOnlyList<LibraryGame> GamesLibrary);

public sealed record PublicUserDto(
    string Id,
    string Name,
    string Surname,
    string Nickname,
    string? ImageSrc,
    IReadOnlyList<string> Following,
    IReadOnlyList<string> Followers,
    IReadOnlyList<string> UserCommunities,
    IReadOnlyList<string> UserCreatedCommunities,
    string? Biography,
    string? City,
    string? State,
    string? BackgroundImage,
    IReadOnlyList<LibraryGame> GamesLibrary);

public static class UserMappings
{
    public static CurrentUserDto ToCurrentDto(this User user) => new(
        user.Id!, user.Name, user.Surname, user.Nickname, user.Phone, user.Email,
        user.ImageSrc, user.Following ?? [], user.Followers ?? [],
        user.UserCommunities ?? [], user.UserCreatedCommunities ?? [],
        user.Biography, user.City, user.State, user.BackgroundImage,
        user.GamesLibrary ?? []);

    public static PublicUserDto ToPublicDto(this User user) => new(
        user.Id!, user.Name, user.Surname, user.Nickname, user.ImageSrc,
        user.Following ?? [], user.Followers ?? [], user.UserCommunities ?? [],
        user.UserCreatedCommunities ?? [], user.Biography, user.City, user.State,
        user.BackgroundImage, user.GamesLibrary ?? []);
}
