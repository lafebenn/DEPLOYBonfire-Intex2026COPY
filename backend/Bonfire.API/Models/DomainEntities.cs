using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Bonfire.API.Models;

public class Safehouse
{
    public int SafehouseId { get; set; }

    [Required, MaxLength(20)]
    public string SafehouseCode { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Region { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string Country { get; set; } = "Philippines";
    public DateOnly OpenDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int CapacityGirls { get; set; }
    public int CapacityStaff { get; set; }
    public int CurrentOccupancy { get; set; }
    public string? Notes { get; set; }

    public ICollection<PartnerAssignment> PartnerAssignments { get; set; } = new List<PartnerAssignment>();
    public ICollection<DonationAllocation> DonationAllocations { get; set; } = new List<DonationAllocation>();
    public ICollection<Resident> Residents { get; set; } = new List<Resident>();
    public ICollection<IncidentReport> IncidentReports { get; set; } = new List<IncidentReport>();
    public ICollection<SafehouseMonthlyMetric> MonthlyMetrics { get; set; } = new List<SafehouseMonthlyMetric>();
}

public class Partner
{
    public int PartnerId { get; set; }

    [Required]
    public string PartnerName { get; set; } = string.Empty;

    public string PartnerType { get; set; } = string.Empty;
    public string RoleType { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Notes { get; set; }

    public ICollection<PartnerAssignment> Assignments { get; set; } = new List<PartnerAssignment>();
    public ICollection<Donation> DonationsCreated { get; set; } = new List<Donation>();
}

public class PartnerAssignment
{
    [Key]
    public int AssignmentId { get; set; }

    public int PartnerId { get; set; }

    [ForeignKey(nameof(PartnerId))]
    public Partner Partner { get; set; } = null!;

    public int? SafehouseId { get; set; }

    [ForeignKey(nameof(SafehouseId))]
    public Safehouse? Safehouse { get; set; }

    public string ProgramArea { get; set; } = string.Empty;
    public DateOnly AssignmentStart { get; set; }
    public DateOnly? AssignmentEnd { get; set; }
    public string? ResponsibilityNotes { get; set; }
    public bool IsPrimary { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class Supporter
{
    public int SupporterId { get; set; }

    public string SupporterType { get; set; } = string.Empty;

    [Required]
    public string DisplayName { get; set; } = string.Empty;

    public string? OrganizationName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string RelationshipType { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateOnly? FirstDonationDate { get; set; }
    public string AcquisitionChannel { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public ICollection<Donation> Donations { get; set; } = new List<Donation>();
    public ICollection<AppUser> LinkedUsers { get; set; } = new List<AppUser>();
}

public class Donation
{
    public int DonationId { get; set; }

    public int SupporterId { get; set; }

    [ForeignKey(nameof(SupporterId))]
    public Supporter Supporter { get; set; } = null!;

    public string DonationType { get; set; } = string.Empty;
    public DateOnly DonationDate { get; set; }
    public string ChannelSource { get; set; } = string.Empty;
    public string? CurrencyCode { get; set; }
    public decimal? Amount { get; set; }
    public decimal? EstimatedValue { get; set; }
    public string? ImpactUnit { get; set; }
    public bool IsRecurring { get; set; }
    public string? CampaignName { get; set; }
    public string? Notes { get; set; }

    public int? CreatedByPartnerId { get; set; }

    [ForeignKey(nameof(CreatedByPartnerId))]
    public Partner? CreatedByPartner { get; set; }

    public int? ReferralPostId { get; set; }

    [ForeignKey(nameof(ReferralPostId))]
    public SocialMediaPost? ReferralPost { get; set; }

    public ICollection<InKindDonationItem> InKindItems { get; set; } = new List<InKindDonationItem>();
    public ICollection<DonationAllocation> Allocations { get; set; } = new List<DonationAllocation>();
}

public class InKindDonationItem
{
    [Key]
    public int ItemId { get; set; }

    public int DonationId { get; set; }

    [ForeignKey(nameof(DonationId))]
    public Donation Donation { get; set; } = null!;

    public string ItemName { get; set; } = string.Empty;
    public string ItemCategory { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal EstimatedUnitValue { get; set; }
    public string IntendedUse { get; set; } = string.Empty;
    public string ReceivedCondition { get; set; } = string.Empty;
}

public class DonationAllocation
{
    [Key]
    public int AllocationId { get; set; }

    public int DonationId { get; set; }

    [ForeignKey(nameof(DonationId))]
    public Donation Donation { get; set; } = null!;

    public int SafehouseId { get; set; }

    [ForeignKey(nameof(SafehouseId))]
    public Safehouse Safehouse { get; set; } = null!;

    public string ProgramArea { get; set; } = string.Empty;
    public decimal AmountAllocated { get; set; }
    public DateOnly AllocationDate { get; set; }
    public string? AllocationNotes { get; set; }
}
