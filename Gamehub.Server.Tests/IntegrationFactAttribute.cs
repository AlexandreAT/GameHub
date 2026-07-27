using Xunit;

namespace Gamehub.Server.Tests;

public sealed class IntegrationFactAttribute : FactAttribute
{
    public IntegrationFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("GAMEHUB_TEST_MONGODB_URI")))
        {
            Skip = "Execute scripts/test-integration.ps1 para iniciar o MongoDB isolado.";
        }
    }
}
