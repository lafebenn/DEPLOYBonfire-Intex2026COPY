using System.Text.Json;
using System.Text.Json.Serialization;

namespace Bonfire.API.Models;

/// <summary>JSON options for ML proxy bodies: inner properties use explicit <see cref="JsonPropertyName"/> snake_case.</summary>
public static class MlProxyJson
{
    public static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = null,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };
}

// --- Root wrappers (never a bare JSON array) ---

public sealed class ResidentRiskPredictPayload
{
    [JsonPropertyName("residents")]
    public List<ResidentRiskMlRow> Residents { get; set; } = [];
}

public sealed class DonorLapsePredictPayload
{
    [JsonPropertyName("supporters")]
    public List<DonorLapseMlRow> Supporters { get; set; } = [];
}

public sealed class DonorGivingPredictPayload
{
    [JsonPropertyName("supporters")]
    public List<DonorGivingMlRow> Supporters { get; set; } = [];
}

public sealed class SocialMediaPredictPayload
{
    [JsonPropertyName("posts")]
    public List<SocialMediaMlRow> Posts { get; set; } = [];
}

// --- Row DTOs: names must match Python feature columns (snake_case) ---

public sealed class ResidentRiskMlRow
{
    [JsonPropertyName("resident_id")]
    public int ResidentId { get; set; }

    [JsonPropertyName("current_risk_level")]
    public string CurrentRiskLevel { get; set; } = "";

    [JsonPropertyName("recent_incident_count")]
    public int RecentIncidentCount { get; set; }

    [JsonPropertyName("days_since_last_session")]
    public int DaysSinceLastSession { get; set; }

    [JsonPropertyName("avg_emotional_state_score")]
    public decimal AvgEmotionalStateScore { get; set; }

    [JsonPropertyName("education_progress")]
    public decimal EducationProgress { get; set; }

    [JsonPropertyName("health_score")]
    public decimal HealthScore { get; set; }

    [JsonPropertyName("open_intervention_count")]
    public int OpenInterventionCount { get; set; }
}

public sealed class DonorLapseMlRow
{
    [JsonPropertyName("supporter_id")]
    public int SupporterId { get; set; }

    [JsonPropertyName("days_since_last_donation")]
    public int DaysSinceLastDonation { get; set; }

    [JsonPropertyName("donation_count")]
    public int DonationCount { get; set; }

    [JsonPropertyName("total_lifetime_value")]
    public decimal TotalLifetimeValue { get; set; }

    [JsonPropertyName("is_recurring")]
    public bool IsRecurring { get; set; }

    [JsonPropertyName("acquisition_channel")]
    public string AcquisitionChannel { get; set; } = "";

    [JsonPropertyName("donation_type")]
    public string DonationType { get; set; } = "";
}

/// <summary>
/// Donor giving model features. Basic supporter fields only;
/// TODO: Align with Python API preprocessing for engineered / patsy-style categorical encodings.
/// </summary>
public sealed class DonorGivingMlRow
{
    [JsonPropertyName("supporter_id")]
    public int SupporterId { get; set; }

    [JsonPropertyName("supporter_type")]
    public string SupporterType { get; set; } = "";

    [JsonPropertyName("acquisition_channel")]
    public string AcquisitionChannel { get; set; } = "";

    [JsonPropertyName("region")]
    public string Region { get; set; } = "";

    [JsonPropertyName("country")]
    public string Country { get; set; } = "";
}

public sealed class SocialMediaMlRow
{
    [JsonPropertyName("platform")]
    public string Platform { get; set; } = "";

    [JsonPropertyName("day_of_week")]
    public string DayOfWeek { get; set; } = "";

    [JsonPropertyName("post_hour")]
    public int PostHour { get; set; }

    [JsonPropertyName("post_type")]
    public string PostType { get; set; } = "";

    [JsonPropertyName("media_type")]
    public string MediaType { get; set; } = "";

    [JsonPropertyName("num_hashtags")]
    public int NumHashtags { get; set; }

    [JsonPropertyName("mentions_count")]
    public int MentionsCount { get; set; }

    [JsonPropertyName("has_call_to_action")]
    public bool HasCallToAction { get; set; }

    [JsonPropertyName("call_to_action_type")]
    public string? CallToActionType { get; set; }

    [JsonPropertyName("content_topic")]
    public string ContentTopic { get; set; } = "";

    [JsonPropertyName("sentiment_tone")]
    public string SentimentTone { get; set; } = "";

    [JsonPropertyName("caption_length")]
    public int CaptionLength { get; set; }

    [JsonPropertyName("features_resident_story")]
    public bool FeaturesResidentStory { get; set; }

    [JsonPropertyName("campaign_name")]
    public string? CampaignName { get; set; }

    [JsonPropertyName("is_boosted")]
    public bool IsBoosted { get; set; }
}
