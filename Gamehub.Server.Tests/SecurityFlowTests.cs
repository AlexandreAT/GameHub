using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Gamehub.Server.Tests;

public sealed class SecurityFlowTests : IClassFixture<GameHubApiFactory>
{
    private readonly GameHubApiFactory _factory;

    public SecurityFlowTests(GameHubApiFactory factory)
    {
        _factory = factory;
    }

    [IntegrationFact]
    public async Task Login_valido_retorna_token_sem_expor_senha_ou_cpf()
    {
        var email = $"login-{Guid.NewGuid():N}@gamehub.test";
        const string password = "Senha-Segura-456";

        using var registration = await _factory.Client.PostAsJsonAsync("/api/Users", new
        {
            name = "Login",
            surname = "Teste",
            nickname = $"login{Guid.NewGuid():N}"[..20],
            email,
            password
        });
        registration.EnsureSuccessStatusCode();

        using var response = await _factory.Client.PostAsJsonAsync("/api/Users/login", new
        {
            email,
            password
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(json);

        Assert.False(string.IsNullOrWhiteSpace(
            document.RootElement.GetProperty("token").GetString()));
        Assert.DoesNotContain("password", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("senha", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("cpf", json, StringComparison.OrdinalIgnoreCase);
    }

    [IntegrationFact]
    public async Task Login_invalido_retorna_nao_autorizado()
    {
        using var response = await _factory.Client.PostAsJsonAsync("/api/Users/login", new
        {
            email = "usuario-inexistente@gamehub.test",
            password = "Senha-Incorreta-123"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [IntegrationFact]
    public async Task Rota_protegida_sem_token_retorna_nao_autorizado()
    {
        using var response = await _factory.Client.GetAsync("/api/Users/current");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [IntegrationFact]
    public async Task Perfil_publico_nao_expoe_email_telefone_senha_ou_cpf()
    {
        using var response = await _factory.Client.GetAsync(
            $"/api/Users/{_factory.FirstUserId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();

        Assert.DoesNotContain("email", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("phone", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("password", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("senha", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("cpf", json, StringComparison.OrdinalIgnoreCase);
    }

    [IntegrationFact]
    public async Task Outro_usuario_nao_pode_excluir_post()
    {
        var postId = await _factory.CreatePostAsync(_factory.FirstUserToken);
        using var deleteRequest = GameHubApiFactory.AuthorizedRequest(
            HttpMethod.Delete,
            $"/api/Posts/{postId}",
            _factory.SecondUserToken);

        using var deleteResponse = await _factory.Client.SendAsync(deleteRequest);
        using var getResponse = await _factory.Client.GetAsync($"/api/Posts/getPost/{postId}");

        Assert.Equal(HttpStatusCode.Forbidden, deleteResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
    }

    [IntegrationFact]
    public async Task Autor_pode_excluir_o_proprio_post()
    {
        var postId = await _factory.CreatePostAsync(_factory.FirstUserToken);
        using var deleteRequest = GameHubApiFactory.AuthorizedRequest(
            HttpMethod.Delete,
            $"/api/Posts/{postId}",
            _factory.FirstUserToken);

        using var deleteResponse = await _factory.Client.SendAsync(deleteRequest);
        using var getResponse = await _factory.Client.GetAsync($"/api/Posts/getPost/{postId}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }
}
