using Bonfire.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services, ILogger logger)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<AppUser>>();
        var db = services.GetRequiredService<AppDbContext>();
        var configuration = services.GetRequiredService<IConfiguration>();

        foreach (var r in new[] { "Admin", "Staff", "Donor" })
        {
            if (!await roleManager.RoleExistsAsync(r))
            {
                await roleManager.CreateAsync(new IdentityRole(r));
                logger.LogInformation("Created role {Role}", r);
            }
        }

        var adminPwd = Environment.GetEnvironmentVariable("SEED_ADMIN_PASSWORD")
                       ?? configuration["SeedPasswords:Admin"];
        var staffPwd = Environment.GetEnvironmentVariable("SEED_STAFF_PASSWORD")
                       ?? configuration["SeedPasswords:Staff"];
        var donorPwd = Environment.GetEnvironmentVariable("SEED_DONOR_PASSWORD")
                       ?? configuration["SeedPasswords:Donor"];
        var forceResetSeedPasswords =
            string.Equals(Environment.GetEnvironmentVariable("SEED_FORCE_RESET_PASSWORDS"), "true", StringComparison.OrdinalIgnoreCase)
            || configuration.GetValue<bool>("SeedPasswords:ForceReset");

        if (string.IsNullOrWhiteSpace(adminPwd) || string.IsNullOrWhiteSpace(staffPwd) ||
            string.IsNullOrWhiteSpace(donorPwd))
        {
            logger.LogWarning("Seed passwords not fully configured; skipping user seed.");
            return;
        }

        Supporter? seedSupporter = await db.Supporters.FirstOrDefaultAsync(s => s.Email == "donor@sanctuary.org");
        if (seedSupporter == null)
        {
            seedSupporter = new Supporter
            {
                SupporterType = "MonetaryDonor",
                DisplayName = "Seed Donor",
                Email = "donor@sanctuary.org",
                Status = "Active",
                RelationshipType = "Individual",
                Region = "Luzon",
                Country = "Philippines",
                AcquisitionChannel = "Seed",
                CreatedAt = DateTime.UtcNow,
                FirstDonationDate = DateOnly.FromDateTime(DateTime.UtcNow)
            };
            db.Supporters.Add(seedSupporter);
            await db.SaveChangesAsync();
        }

        await EnsureUserAsync(userManager, logger, "admin@sanctuary.org", adminPwd, "Admin User", "Admin", null, forceResetSeedPasswords);
        await EnsureUserAsync(userManager, logger, "staff@sanctuary.org", staffPwd, "Staff User", "Staff", null, forceResetSeedPasswords);
        await EnsureUserAsync(userManager, logger, "donor@sanctuary.org", donorPwd, "Donor User", "Donor", seedSupporter.SupporterId, forceResetSeedPasswords);
    }

    private static async Task EnsureUserAsync(
        UserManager<AppUser> userManager,
        ILogger logger,
        string email,
        string password,
        string displayName,
        string role,
        int? linkedSupporterId,
        bool forceResetPassword)
    {
        var existing = await userManager.FindByEmailAsync(email);
        if (existing != null)
        {
            // Keep seed accounts consistent across runs in dev when requested.
            if (linkedSupporterId.HasValue && existing.LinkedSupporterId != linkedSupporterId)
                existing.LinkedSupporterId = linkedSupporterId;
            if (!string.Equals(existing.DisplayName, displayName, StringComparison.Ordinal))
                existing.DisplayName = displayName;
            if (!string.Equals(existing.Role, role, StringComparison.Ordinal))
                existing.Role = role;

            await userManager.UpdateAsync(existing);

            if (!await userManager.IsInRoleAsync(existing, role))
                await userManager.AddToRoleAsync(existing, role);

            if (forceResetPassword)
            {
                var token = await userManager.GeneratePasswordResetTokenAsync(existing);
                var reset = await userManager.ResetPasswordAsync(existing, token, password);
                if (!reset.Succeeded)
                    logger.LogError("Failed to reset seed password for {Email}: {Errors}", email,
                        string.Join("; ", reset.Errors.Select(e => e.Description)));
                else
                    logger.LogInformation("Reset seed password for {Email}", email);
            }

            return;
        }

        var user = new AppUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            DisplayName = displayName,
            Role = role,
            CreatedAt = DateTime.UtcNow,
            LinkedSupporterId = linkedSupporterId,
            TwoFactorEnabled = false
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            logger.LogError("Failed to seed {Email}: {Errors}", email, string.Join("; ", result.Errors.Select(e => e.Description)));
            return;
        }

        await userManager.AddToRoleAsync(user, role);
        logger.LogInformation("Seeded user {Email} with role {Role}", email, role);
    }
}
