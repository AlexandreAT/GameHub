using Gamehub.Server.Models;
using Gamehub.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Cors;
using System.Text;
using Microsoft.AspNetCore.CookiePolicy;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;


builder.Services.Configure<UserDatabaseSetting>
    (builder.Configuration.GetSection("DevNetStoreDatabase"));

builder.Services.AddSingleton<UserServices>();

builder.Services.Configure<PostDatabaseSettings>
    (builder.Configuration.GetSection("DevNetStoreDatabase"));

builder.Services.AddSingleton<PostServices>();

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
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["jwt:secretKey"])),
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
