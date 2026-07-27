using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;

namespace Gamehub.Server.Tests;

public sealed class GameHubApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _mongoUri =
        Environment.GetEnvironmentVariable("GAMEHUB_TEST_MONGODB_URI") ?? string.Empty;

    private readonly string _databaseName = $"GameHubTests_{Guid.NewGuid():N}";
    private HttpClient? _client;

    public HttpClient Client => _client ??
        throw new InvalidOperationException("A fixture ainda não foi inicializada.");

    public string FirstUserToken { get; private set; } = string.Empty;
    public string SecondUserToken { get; private set; } = string.Empty;
    public string FirstUserId { get; private set; } = string.Empty;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:SecretKey"] = "GameHub-Integration-Tests-Only-Secret-Key-2026-64-Bytes-Long!",
                ["Jwt:Issuer"] = "GameHub.Tests",
                ["Jwt:Audience"] = "GameHub.Tests.Client",
                ["Jwt:ExpirationMinutes"] = "5",
                ["Igdb:ClientId"] = "integration-tests",
                ["Igdb:ClientSecret"] = "integration-tests",
                ["ImgBb:ApiKey"] = "integration-tests",
                ["Cors:AllowedOrigins:0"] = "https://localhost:5173",
                ["Proxy:ForwardedHeadersEnabled"] = "false",
                ["DevNetStoreDatabase:ConnectionString"] = _mongoUri,
                ["DevNetStoreDatabase:DatabaseName"] = _databaseName,
                ["DevNetStoreDatabase:UserCollectionName"] = "Users",
                ["DevNetStoreDatabase:PostCollectionName"] = "Posts",
                ["DevNetStoreDatabase:CommunityCollectionName"] = "Communities"
            });
        });
    }

    public async Task InitializeAsync()
    {
        if (string.IsNullOrWhiteSpace(_mongoUri))
            return;

        _client = CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false
        });

        var firstEmail = $"first-{Guid.NewGuid():N}@gamehub.test";
        var secondEmail = $"second-{Guid.NewGuid():N}@gamehub.test";
        const string password = "Senha-Segura-123";

        FirstUserId = await RegisterAsync(firstEmail, "firstuser", password);
        await RegisterAsync(secondEmail, "seconduser", password);

        FirstUserToken = await LoginAsync(firstEmail, password);
        SecondUserToken = await LoginAsync(secondEmail, password);
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        _client?.Dispose();

        if (!string.IsNullOrWhiteSpace(_mongoUri))
        {
            var mongoClient = new MongoClient(_mongoUri);
            await mongoClient.DropDatabaseAsync(_databaseName);
        }

        await base.DisposeAsync();
    }

    public async Task<string> CreatePostAsync(string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/Posts")
        {
            Content = JsonContent.Create(new
            {
                title = $"Post {Guid.NewGuid():N}",
                content = "Conteúdo criado apenas para o teste automatizado."
            })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await Client.SendAsync(request);
        response.EnsureSuccessStatusCode();

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return document.RootElement.GetProperty("id").GetString()!;
    }

    public static HttpRequestMessage AuthorizedRequest(
        HttpMethod method,
        string requestUri,
        string token)
    {
        var request = new HttpRequestMessage(method, requestUri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    private async Task<string> RegisterAsync(string email, string nickname, string password)
    {
        using var response = await Client.PostAsJsonAsync("/api/Users", new
        {
            name = "Teste",
            surname = "GameHub",
            nickname,
            email,
            password
        });
        response.EnsureSuccessStatusCode();

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return document.RootElement.GetProperty("id").GetString()!;
    }

    private async Task<string> LoginAsync(string email, string password)
    {
        using var response = await Client.PostAsJsonAsync("/api/Users/login", new
        {
            email,
            password
        });
        response.EnsureSuccessStatusCode();

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return document.RootElement.GetProperty("token").GetString()!;
    }
}
