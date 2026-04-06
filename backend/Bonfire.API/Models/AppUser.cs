using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace Bonfire.API.Models;

public class AppUser : IdentityUser
{
    [PersonalData]
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>Mirror of assigned Identity role for convenience (Admin, Staff, Donor).</summary>
    public string Role { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public int? LinkedSupporterId { get; set; }

    [ForeignKey(nameof(LinkedSupporterId))]
    public Supporter? LinkedSupporter { get; set; }
}
