using Gamehub.Server.Models;
using Gamehub.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Cors;
using System.Text;
using Microsoft.AspNetCore.CookiePolicy;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddOptions<UserDatabaseSetting>()
    .BindConfiguration("DevNetStoreDatabase")
    .Validate(settings =>
        !string.IsNullOrWhiteSpace(settings.ConnectionString) &&
        !string.IsNullOrWhiteSpace(settings.DatabaseName) &&
        !string.IsNullOrWhiteSpace(settings.UserCollectionName),
        "A configuração da coleção de usuários do MongoDB está incompleta.")
    .ValidateOnStart();

builder.Services.AddSingleton<UserServices>();

builder.Services.AddOptions<PostDatabaseSettings>()
    .BindConfiguration("DevNetStoreDatabase")
    .Validate(settings => !string.IsNullOrWhiteSpace(settings.PostCollectionName),
        "A configuração da coleção de posts do MongoDB está incompleta.")
    .ValidateOnStart();

builder.Services.AddSingleton<PostServices>();

builder.Services.AddOptions<CommunityDatabaseSettings>()
    .BindConfiguration("DevNetStoreDatabase")
    .Validate(settings => !string.IsNullOrWhiteSpace(settings.CommunityCollectionName),
        "A configuração da coleção de comunidades do MongoDB está incompleta.")
    .ValidateOnStart();

builder.Services.AddSingleton<CommunityServices>();

builder.Services.AddHttpClient();
builder.Services.AddHttpClient<ImageHostingService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", builder =>
    {
        builder.WithOrigins("https://localhost:5173")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.JsonSerializerOptions.IgnoreNullValues = true;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configura a política de cookies
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    // Define as políticas de cookies
    options.MinimumSameSitePolicy = SameSiteMode.Strict;
    options.HttpOnly = HttpOnlyPolicy.None;
    options.Secure = CookieSecurePolicy.Always;
});

//aqui é onde estou configurando o jwt
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    var jwtSettings = builder.Configuration
        .GetRequiredSection(JwtSettings.SectionName)
        .Get<JwtSettings>() ?? throw new InvalidOperationException("Configuração JWT não encontrada.");

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateLifetime = true,
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

var app = builder.Build();

// Aplica a política de cookies
app.UseCookiePolicy();

app.UseCors("CorsPolicy");
app.UseDefaultFiles();
app.UseStaticFiles();


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
