using System.Text;
using System.Threading.RateLimiting;
using Bonfire.API.Data;
using Bonfire.API.Infrastructure;
using Bonfire.API.Models;
using Bonfire.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                       ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Database connection string is not configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure(5)));

builder.Services
    .AddIdentity<AppUser, IdentityRole>(options =>
    {
        options.Password.RequiredLength = 14;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireDigit = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredUniqueChars = 1;
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<IUserClaimsPrincipalFactory<AppUser>, CustomUserClaimsPrincipalFactory>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddSingleton<SanitizerService>();

var jwtSecret = builder.Configuration["Jwt:Secret"]
                ?? Environment.GetEnvironmentVariable("Jwt__Secret");
if (string.IsNullOrWhiteSpace(jwtSecret))
    throw new InvalidOperationException("JWT secret is not configured.");

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "sanctuary-api",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "sanctuary-client",
            IssuerSigningKey = signingKey,
            NameClaimType = System.Security.Claims.ClaimTypes.NameIdentifier,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    })
    .ConfigureApiBehaviorOptions(o =>
    {
        o.InvalidModelStateResponseFactory = ctx =>
        {
            var errors = ctx.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .ToDictionary(
                    e => e.Key,
                    e => e.Value!.Errors.Select(er => string.IsNullOrEmpty(er.ErrorMessage) ? "Invalid value" : er.ErrorMessage).ToArray());
            return new BadRequestObjectResult(new ApiResponse<Dictionary<string, string[]>>
            {
                Success = false,
                Data = errors,
                Message = "Validation failed"
            });
        };
    });

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(
            ApiResponse<object>.Fail("Too many requests, please wait."),
            token);
    };
    options.AddPolicy("login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));
});

builder.Services.AddHttpClient();

builder.Services.AddHttpClient("MlApi", (sp, client) =>
{
    var cfg = sp.GetRequiredService<IConfiguration>();
    var baseUrl = cfg["ML_API_URL"]?.Trim().TrimEnd('/');
    if (!string.IsNullOrWhiteSpace(baseUrl))
        client.BaseAddress = new Uri(baseUrl + "/");
    var key = cfg["ML_API_KEY"] ?? Environment.GetEnvironmentVariable("ML_API_KEY");
    if (!string.IsNullOrWhiteSpace(key))
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-API-Key", key);
});

builder.Services.AddHttpClient<MlService>((sp, client) =>
{
    var cfg = sp.GetRequiredService<IConfiguration>();
    var baseUrl = cfg["ML_API_URL"]?.Trim().TrimEnd('/');
    if (!string.IsNullOrWhiteSpace(baseUrl))
        client.BaseAddress = new Uri(baseUrl + "/");
    var key = cfg["ML_API_KEY"] ?? Environment.GetEnvironmentVariable("ML_API_KEY");
    if (!string.IsNullOrWhiteSpace(key))
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-API-Key", key);
});

builder.Services.AddHostedService<MlRefreshBackgroundService>();

builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365);
});

var frontendOrigin = builder.Configuration["AllowedOrigins:Frontend"]?.Trim();
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:8080")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
        else
        {
            if (string.IsNullOrWhiteSpace(frontendOrigin))
                throw new InvalidOperationException("AllowedOrigins:Frontend must be set in production.");
            policy.WithOrigins(frontendOrigin)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    });
});

var app = builder.Build();

var forwarded = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
};
forwarded.KnownIPNetworks.Clear();
forwarded.KnownProxies.Clear();
app.UseForwardedHeaders(forwarded);

var isDev = app.Environment.IsDevelopment();
if (!isDev)
    app.UseHsts();

app.UseHttpsRedirection();

var publicApiBase = builder.Configuration["PublicApi:BaseUrl"]?.Trim().TrimEnd('/')
                  ?? Environment.GetEnvironmentVariable("PUBLIC_API_BASE_URL")?.Trim().TrimEnd('/');
var connectExtra = string.IsNullOrEmpty(publicApiBase) ? "" : $" {publicApiBase}";
var csp = "default-src 'self'; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; " +
          "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; " +
          "img-src 'self' data: https:; " +
          $"connect-src 'self'{connectExtra} https://accounts.google.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "frame-src https://accounts.google.com; " +
          "object-src 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self';";

app.Use(async (context, next) =>
{
    context.Response.Headers.ContentSecurityPolicy = csp;
    await next();
});

app.UseCors("frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", () => Results.Json(new { status = "healthy" }))
    .AllowAnonymous()
    .WithName("Health");

using (var scope = app.Services.CreateScope())
{
    var startupLogger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();

        if (isDev)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Seed");
            await DbSeeder.SeedAsync(scope.ServiceProvider, logger);
        }
    }
    catch (Exception ex)
    {
        startupLogger.LogError(ex, "Database migration or seed failed; starting without completing seed.");
    }
}

app.Run();
