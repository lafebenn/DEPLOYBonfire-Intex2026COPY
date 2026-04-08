using Bonfire.API.Data;
using Bonfire.API.Models;
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

    /// <summary>
    /// Returns existing supporter id for this email, or creates a new <see cref="Supporter"/> when none exist.
    /// Does not create a row when multiple supporters already share the email (ambiguous).
    /// </summary>
    public static async Task<int?> TryEnsureSupporterIdForDonorEmailAsync(
        AppDbContext db,
        string email,
        string displayName,
        string acquisitionChannel,
        ILogger logger,
        CancellationToken ct = default)
    {
        var resolved = await TryResolveSupporterIdAsync(db, email, logger, ct);
        if (resolved.HasValue)
            return resolved.Value;

        var normalized = email.Trim();
        if (string.IsNullOrEmpty(normalized))
            return null;

        var dupCount = await db.Supporters.AsNoTracking()
            .CountAsync(s => s.Email.ToLower() == normalized.ToLower(), ct);
        if (dupCount > 1)
        {
            logger.LogWarning("Cannot auto-create supporter for {Email}: multiple rows already exist", normalized);
            return null;
        }

        var name = string.IsNullOrWhiteSpace(displayName) ? normalized.Split('@')[0] : displayName.Trim();
        var supporter = new Supporter
        {
            SupporterType = "Individual",
            DisplayName = name,
            Email = normalized,
            Phone = "",
            Region = "",
            Country = "Philippines",
            Status = "Active",
            RelationshipType = "Donor",
            AcquisitionChannel = string.IsNullOrWhiteSpace(acquisitionChannel) ? "Online" : acquisitionChannel.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        db.Supporters.Add(supporter);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Created supporter {SupporterId} for donor email {Email}", supporter.SupporterId, normalized);
        return supporter.SupporterId;
    }
}
