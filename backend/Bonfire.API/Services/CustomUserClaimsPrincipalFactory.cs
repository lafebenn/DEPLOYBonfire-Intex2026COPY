using System.Security.Claims;
using Bonfire.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace Bonfire.API.Services;

public class CustomUserClaimsPrincipalFactory : UserClaimsPrincipalFactory<AppUser, IdentityRole>
{
    public CustomUserClaimsPrincipalFactory(
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IOptions<IdentityOptions> options)
        : base(userManager, roleManager, options)
    {
    }

    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(AppUser user)
    {
        var identity = await base.GenerateClaimsAsync(user);
        var roles = await UserManager.GetRolesAsync(user);
        foreach (var role in roles)
            identity.AddClaim(new Claim(ClaimTypes.Role, role));

        identity.AddClaim(new Claim("displayName", user.DisplayName ?? string.Empty));
        identity.AddClaim(new Claim("userId", user.Id));
        if (user.LinkedSupporterId.HasValue)
            identity.AddClaim(new Claim("linkedSupporterId", user.LinkedSupporterId.Value.ToString()));

        return identity;
    }
}
