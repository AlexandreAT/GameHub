using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Gamehub.Server.Models;
using Gamehub.Server.Security;
using Gamehub.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var renderPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(renderPort))
{
    if (!int.TryParse(renderPort, out var port) || port is < 1 or > 65535)
        throw new InvalidOperationException("PORT deve ser um número entre 1 e 65535.");

    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

builder.Services.AddOptions<JwtSettings>()
    .BindConfiguration(JwtSettings.SectionName)
    .ValidateDataAnnotations()
    .Validate(settings => Encoding.UTF8.GetByteCount(settings.SecretKey) >= 32,
        "Jwt:SecretKey deve possuir pelo menos 32 bytes.")
    .ValidateOnStart();

builder.Services.AddOptions<IgdbSettings>()
    .BindConfiguration(IgdbSettings.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<ImgBbSettings>()
    .BindConfiguration(ImgBbSettings.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<CorsSettings>()
    .BindConfiguration(CorsSettings.SectionName)
    .ValidateDataAnnotations()
    .Validate(settings => settings.AllowedOrigins.All(origin =>
        Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
        (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)),
        "Cors:AllowedOrigins deve conter apenas URLs HTTP ou HTTPS absolutas.")
    .ValidateOnStart();

builder.Services.AddOptions<UserDatabaseSetting>()
    .BindConfiguration("DevNetStoreDatabase")
    .Validate(settings =>
        !string.IsNullOrWhiteSpace(settings.ConnectionString) &&
        !string.IsNullOrWhiteSpace(settings.DatabaseName) &&
        !string.IsNullOrWhiteSpace(settings.UserCollectionName),
        "A configuração da coleção de usuários do MongoDB está incompleta.")
    .ValidateOnStart();

builder.Services.AddOptions<PostDatabaseSettings>()
    .BindConfiguration("DevNetStoreDatabase")
    .Validate(settings => !string.IsNullOrWhiteSpace(settings.PostCollectionName),
        "A configuração da coleção de posts do MongoDB está incompleta.")
    .ValidateOnStart();

builder.Services.AddOptions<CommunityDatabaseSettings>()
    .BindConfiguration("DevNetStoreDatabase")
    .Validate(settings => !string.IsNullOrWhiteSpace(settings.CommunityCollectionName),
        "A configuração da coleção de comunidades do MongoDB está incompleta.")
    .ValidateOnStart();

builder.Services.AddSingleton<UserServices>();
builder.Services.AddSingleton<PostServices>();
builder.Services.AddSingleton<CommunityServices>();

builder.Services.AddHttpClient();
builder.Services.AddHttpClient<ImageHostingService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

var allowedOrigins = builder.Configuration
    .GetSection($"{CorsSettings.SectionName}:AllowedOrigins")
    .Get<string[]>()?
    .Select(origin => origin.Trim().TrimEnd('/'))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray() ?? [];

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var forwardedHeadersEnabled = builder.Configuration.GetValue<bool>("Proxy:ForwardedHeadersEnabled");
if (forwardedHeadersEnabled)
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders =
            ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.ForwardLimit = 1;

        // O container do Render recebe tráfego público somente pelo proxy da plataforma.
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });
}

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("authentication", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy("external-api", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.User.GetUserId() ??
            httpContext.Connection.RemoteIpAddress?.ToString() ??
            "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy("upload", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.User.GetUserId() ?? "anonymous",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    var jwtSettings = builder.Configuration
        .GetRequiredSection(JwtSettings.SectionName)
        .Get<JwtSettings>() ?? throw new InvalidOperationException("Configuração JWT não encontrada.");

    options.MapInboundClaims = false;
    options.SaveToken = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        RequireExpirationTime = true,
        RequireSignedTokens = true,
        ValidateLifetime = true,
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
        NameClaimType = "sub",
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var userId = context.Principal?.GetUserId();
            var versionClaim = context.Principal?.FindFirst(JwtClaimNames.TokenVersion)?.Value;

            if (userId is null || !int.TryParse(versionClaim, out var tokenVersion))
            {
                context.Fail("Token sem identificação válida.");
                return;
            }

            var userServices = context.HttpContext.RequestServices.GetRequiredService<UserServices>();
            var user = await userServices.GetAsync(userId);
            if (user is null || user.PasswordResetRequired || user.TokenVersion != tokenVersion)
                context.Fail("Token revogado.");
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

var app = builder.Build();

if (args.Contains("--reset-legacy-passwords", StringComparer.OrdinalIgnoreCase))
{
    var userServices = app.Services.GetRequiredService<UserServices>();
    var migrated = await userServices.ResetLegacyPasswordsAsync();
    app.Logger.LogInformation(
        "Migração concluída: {MigratedUsers} senha(s) antiga(s) foram invalidadas.",
        migrated);
    return;
}

var resetUserPasswordIndex = Array.FindIndex(
    args,
    argument => argument.Equals("--reset-user-password", StringComparison.OrdinalIgnoreCase));

if (resetUserPasswordIndex >= 0)
{
    if (resetUserPasswordIndex + 1 >= args.Length)
    {
        Console.Error.WriteLine("Informe o email: --reset-user-password usuario@email.com");
        return;
    }

    var password = ReadPassword("Nova senha: ");
    var confirmation = ReadPassword("Confirme a nova senha: ");

    if (password.Length is < 8 or > 72 || password != confirmation)
    {
        Console.Error.WriteLine("As senhas devem coincidir e possuir entre 8 e 72 caracteres.");
        return;
    }

    var userServices = app.Services.GetRequiredService<UserServices>();
    var reset = await userServices.ResetPasswordByEmailAsync(
        args[resetUserPasswordIndex + 1],
        password);

    Console.WriteLine(reset
        ? "Senha redefinida. Tokens anteriores foram revogados."
        : "Usuário não encontrado.");
    return;
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler();
}

if (forwardedHeadersEnabled)
    app.UseForwardedHeaders();

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

app.MapHealthChecks("/health").AllowAnonymous();
app.MapControllers();

app.Run();

static string ReadPassword(string prompt)
{
    Console.Write(prompt);
    var password = new StringBuilder();

    while (true)
    {
        var key = Console.ReadKey(intercept: true);
        if (key.Key == ConsoleKey.Enter)
        {
            Console.WriteLine();
            return password.ToString();
        }

        if (key.Key == ConsoleKey.Backspace)
        {
            if (password.Length > 0)
                password.Length--;
            continue;
        }

        if (!char.IsControl(key.KeyChar))
            password.Append(key.KeyChar);
    }
}
