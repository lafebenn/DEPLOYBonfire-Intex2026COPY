using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Bonfire.API.Data;
using Bonfire.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Infrastructure;

/// <summary>
/// Resolves the donor's linked supporter id from the JWT claim, or from the database when the token was issued before linking.
/// </summary>
public static class DonorSupporterResolver
{
    public static async Task<int?> ResolveLinkedSupporterIdAsync(ClaimsPrincipal user, AppDbContext db, CancellationToken ct = default)
    {
        var claimVal = user.Claims.FirstOrDefault(c => c.Type == "linkedSupporterId")?.Value;
        if (int.TryParse(claimVal, out var fromJwt))
            return fromJwt;

        if (!user.IsInRole("Donor"))
            return null;

        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrEmpty(userId))
            return null;

        return await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.LinkedSupporterId)
            .FirstOrDefaultAsync(ct);
    }

    /// <summary>
    /// Like <see cref="ResolveLinkedSupporterIdAsync"/> but creates/links a <see cref="Supporter"/> when the donor account has no link yet (legacy self-registrations).
    /// </summary>
    public static async Task<int?> ResolveOrEnsureLinkedSupporterIdAsync(
        ClaimsPrincipal user,
        AppDbContext db,
        UserManager<AppUser> userManager,
        ILogger logger,
        CancellationToken ct = default)
    {
        var id = await ResolveLinkedSupporterIdAsync(user, db, ct);
        if (id.HasValue)
            return id;

        if (!user.IsInRole("Donor"))
            return null;

        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrEmpty(userId))
            return null;

        var appUser = await userManager.FindByIdAsync(userId);
        if (appUser == null)
            return null;
        if (appUser.LinkedSupporterId.HasValue)
            return appUser.LinkedSupporterId;

        var email = appUser.Email ?? appUser.UserName;
        if (string.IsNullOrWhiteSpace(email))
            return null;

        var sid = await SupporterEmailLinking.TryEnsureSupporterIdForDonorEmailAsync(
            db, email, appUser.DisplayName ?? "", "DonorPortalLazyLink", logger, ct);
        if (!sid.HasValue)
            return null;

        appUser.LinkedSupporterId = sid;
        var upd = await userManager.UpdateAsync(appUser);
        if (!upd.Succeeded)
        {
            logger.LogWarning(
                "Could not persist LinkedSupporterId for donor {UserId}: {Errors}",
                userId,
                string.Join("; ", upd.Errors.Select(e => e.Description)));
        }

        return sid;
    }
}
