using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Gamehub.Server.Security;

public static class ClaimsPrincipalExtensions
{
    public static string? GetUserId(this ClaimsPrincipal principal) =>
        principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
}
