using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Bonfire.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace Bonfire.API.Services;

public class JwtTokenService
{
    private readonly IConfiguration _configuration;
    private readonly IUserClaimsPrincipalFactory<AppUser> _claimsFactory;

    public JwtTokenService(IConfiguration configuration, IUserClaimsPrincipalFactory<AppUser> claimsFactory)
    {
        _configuration = configuration;
        _claimsFactory = claimsFactory;
    }

    public async Task<string> CreateTokenAsync(AppUser user, UserManager<AppUser> userManager)
    {
        var principal = await _claimsFactory.CreateAsync(user);
        var identity = (ClaimsIdentity)principal.Identity!;

        var jwtClaims = new List<Claim>(identity.Claims);
        var email = principal.FindFirstValue(ClaimTypes.Email) ?? user.Email ?? string.Empty;
        if (!jwtClaims.Any(c => c.Type == ClaimTypes.Email))
            jwtClaims.Add(new Claim("email", email));

        var roles = await userManager.GetRolesAsync(user);
        var primaryRole = roles.FirstOrDefault() ?? user.Role ?? "Donor";
        if (!jwtClaims.Any(c => c.Type == ClaimTypes.Role))
            jwtClaims.Add(new Claim(ClaimTypes.Role, primaryRole));

        jwtClaims.Add(new Claim(JwtRegisteredClaimNames.Sub, user.Id));
        jwtClaims.Add(new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()));

        var secret = _configuration["Jwt:Secret"]
                     ?? Environment.GetEnvironmentVariable("Jwt__Secret");
        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("JWT secret is not configured.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var issuer = _configuration["Jwt:Issuer"] ?? "sanctuary-api";
        var audience = _configuration["Jwt:Audience"] ?? "sanctuary-client";

        var token = new JwtSecurityToken(
            issuer,
            audience,
            jwtClaims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
