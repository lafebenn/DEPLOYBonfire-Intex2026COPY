using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Bonfire.API.Models;

public class SocialMediaPost
{
    [Key]
    public int PostId { get; set; }

    public string Platform { get; set; } = string.Empty;
    public string PlatformPostId { get; set; } = string.Empty;
    public string PostUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string DayOfWeek { get; set; } = string.Empty;
    public int PostHour { get; set; }
    public string PostType { get; set; } = string.Empty;
    public string MediaType { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public string Hashtags { get; set; } = string.Empty;
    public int NumHashtags { get; set; }
    public int MentionsCount { get; set; }
    public bool HasCallToAction { get; set; }
    public string? CallToActionType { get; set; }
    public string ContentTopic { get; set; } = string.Empty;
    public string SentimentTone { get; set; } = string.Empty;
    public int CaptionLength { get; set; }
    public bool FeaturesResidentStory { get; set; }
    public string? CampaignName { get; set; }
    public bool IsBoosted { get; set; }
    public decimal? BoostBudgetPhp { get; set; }
    public int Impressions { get; set; }
    public int Reach { get; set; }
    public int Likes { get; set; }
    public int Comments { get; set; }
    public int Shares { get; set; }
    public int Saves { get; set; }
    public int ClickThroughs { get; set; }
    public int? VideoViews { get; set; }
    public decimal EngagementRate { get; set; }
    public int ProfileVisits { get; set; }
    public int DonationReferrals { get; set; }
    public decimal EstimatedDonationValuePhp { get; set; }
    public int FollowerCountAtPost { get; set; }

    public ICollection<Donation> DonationsReferring { get; set; } = new List<Donation>();
}

public class SafehouseMonthlyMetric
{
    [Key]
    public int MetricId { get; set; }

    public int SafehouseId { get; set; }

    [ForeignKey(nameof(SafehouseId))]
    public Safehouse Safehouse { get; set; } = null!;

    public DateOnly MonthStart { get; set; }
    public DateOnly MonthEnd { get; set; }
    public int ActiveResidents { get; set; }
    public decimal AvgEducationProgress { get; set; }
    public decimal AvgHealthScore { get; set; }
    public int ProcessRecordingCount { get; set; }
    public int HomeVisitationCount { get; set; }
    public int IncidentCount { get; set; }
    public string? Notes { get; set; }
}

public class PublicImpactSnapshot
{
    [Key]
    public int SnapshotId { get; set; }

    public DateOnly SnapshotDate { get; set; }
    public string Headline { get; set; } = string.Empty;
    public string SummaryText { get; set; } = string.Empty;
    public string MetricPayloadJson { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public DateOnly? PublishedAt { get; set; }
}

public class MlPrediction
{
    [Key]
    public int PredictionId { get; set; }

    public string PredictionType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public decimal Score { get; set; }
    public string? Label { get; set; }
    public string? FeaturePayloadJson { get; set; }
    public string ModelVersion { get; set; } = string.Empty;
    public DateTime PredictedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
