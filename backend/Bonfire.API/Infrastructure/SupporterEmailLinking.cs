using Bonfire.API.Data;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Infrastructure;

/// <summary>
/// Resolves a single supporter row by email for linking donor accounts (Google, self-register, admin).
/// </summary>
public static class SupporterEmailLinking
{
    /// <returns>SupporterId when exactly one match; null if none or ambiguous.</returns>
    public static async Task<int?> TryResolveSupporterIdAsync(
        AppDbContext db,
        string email,
        ILogger logger,
        CancellationToken ct = default)
    {
        var normalized = email.Trim();
        if (string.IsNullOrEmpty(normalized))
            return null;

        var matches = await db.Supporters.AsNoTracking()
            .Where(s => s.Email.ToLower() == normalized.ToLower())
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new { s.SupporterId })
            .ToListAsync(ct);

        if (matches.Count == 0)
            return null;
        if (matches.Count > 1)
        {
            logger.LogWarning("Multiple supporters share email {Email}; skipping auto-link", normalized);
            return null;
        }

        return matches[0].SupporterId;
    }
}
