namespace Gamehub.Server.Security;

public static class PasswordHasher
{
    private const int WorkFactor = 12;

    public static string Hash(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public static bool Verify(string password, string passwordHash)
    {
        if (!IsHash(passwordHash))
            return false;

        try
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return false;
        }
    }

    public static bool IsHash(string value) =>
        !string.IsNullOrWhiteSpace(value) &&
        (value.StartsWith("$2a$", StringComparison.Ordinal) ||
         value.StartsWith("$2b$", StringComparison.Ordinal) ||
         value.StartsWith("$2y$", StringComparison.Ordinal));
}
