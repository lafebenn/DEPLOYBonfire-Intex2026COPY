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

        await EnsureUserAsync(userManager, logger, "admin@sanctuary.org", adminPwd, "Admin User", "Admin", null);
        await EnsureUserAsync(userManager, logger, "staff@sanctuary.org", staffPwd, "Staff User", "Staff", null);
        await EnsureUserAsync(userManager, logger, "donor@sanctuary.org", donorPwd, "Donor User", "Donor", seedSupporter.SupporterId);
    }

    private static async Task EnsureUserAsync(
        UserManager<AppUser> userManager,
        ILogger logger,
        string email,
        string password,
        string displayName,
        string role,
        int? linkedSupporterId)
    {
        var existing = await userManager.FindByEmailAsync(email);
        if (existing != null)
            return;

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
