using Gamehub.Server.Security;

namespace Gamehub.Server.Tests;

public sealed class PasswordHasherTests
{
    [Fact]
    public void Hash_nao_armazena_a_senha_original_e_pode_ser_validado()
    {
        const string password = "Senha-Segura-789";

        var hash = PasswordHasher.Hash(password);

        Assert.NotEqual(password, hash);
        Assert.True(PasswordHasher.Verify(password, hash));
        Assert.False(PasswordHasher.Verify("Senha-Incorreta-789", hash));
    }
}
