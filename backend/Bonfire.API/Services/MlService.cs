using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Bonfire.API.Data;
using Bonfire.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Services;

public class MlService
{
    private readonly HttpClient _http;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<MlService> _logger;

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public MlService(HttpClient http, AppDbContext db, IConfiguration config, ILogger<MlService> logger)
    {
        _http = http;
        _db = db;
        _config = config;
        _logger = logger;
    }

    public Task<decimal> GetDonorLapseRiskAsync(int supporterId) =>
        GetOrRefreshAsync("DonorLapseRisk", "Supporter", supporterId, async () =>
        {
            var body = await BuildDonorLapseBodyAsync(supporterId);
            return await PostPredictAsync("/predict/donor-lapse", body);
        });

    public Task<decimal> GetResidentRiskScoreAsync(int residentId) =>
        GetOrRefreshAsync("ResidentRiskFlag", "Resident", residentId, async () =>
        {
            var body = await BuildResidentRiskBodyAsync(residentId);
            return await PostResidentRiskV1Async(body);
        });

    public Task<decimal> GetSocialMediaDonationScoreAsync(int postId) =>
        GetOrRefreshAsync("SocialMediaScore", "SocialMediaPost", postId, async () =>
        {
            var body = await BuildSocialBodyAsync(postId);
            return await PostPredictAsync("/predict/social-media-score", body);
        });

    public Task<decimal> GetDonorUpgradeScoreAsync(int supporterId) =>
        GetOrRefreshAsync("DonorUpgradeScore", "Supporter", supporterId, async () =>
        {
            var body = await BuildDonorUpgradeBodyAsync(supporterId);
            return await PostPredictAsync("/predict/donor-upgrade", body);
        });

    public async Task RefreshPredictionsForEntityAsync(string entityType, int entityId)
    {
        try
        {
            switch (entityType)
            {
                case "Supporter":
                    await GetDonorLapseRiskAsync(entityId);
                    await GetDonorUpgradeScoreAsync(entityId);
                    break;
                case "Resident":
                    await GetResidentRiskScoreAsync(entityId);
                    break;
                case "SocialMediaPost":
                    await GetSocialMediaDonationScoreAsync(entityId);
                    break;
                default:
                    _logger.LogWarning("Unknown ML entity type {Type}", entityType);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ML refresh failed for {Type} {Id}", entityType, entityId);
        }
    }

    private async Task<decimal> GetOrRefreshAsync(
        string predictionType,
        string entityType,
        int entityId,
        Func<Task<(decimal Score, string? Label, string? FeatureJson, string ModelVersion)>> fetchRemote)
    {
        var now = DateTime.UtcNow;
        var cached = await _db.MlPredictions
            .Where(p => p.PredictionType == predictionType && p.EntityType == entityType && p.EntityId == entityId)
            .OrderByDescending(p => p.PredictedAt)
            .FirstOrDefaultAsync();

        if (cached != null && (!cached.ExpiresAt.HasValue || cached.ExpiresAt > now))
            return cached.Score;

        var baseUrl = _config["ML_API_URL"];
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            _logger.LogWarning("ML_API_URL not configured; returning cached or zero for {Type} {Id}", predictionType, entityId);
            return cached?.Score ?? 0m;
        }

        try
        {
            var (score, label, featureJson, version) = await fetchRemote();
            var row = new MlPrediction
            {
                PredictionType = predictionType,
                EntityType = entityType,
                EntityId = entityId,
                Score = score,
                Label = label,
                FeaturePayloadJson = featureJson,
                ModelVersion = version,
                PredictedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            };
            _db.MlPredictions.Add(row);
            await _db.SaveChangesAsync();
            return score;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Remote ML call failed for {Type} entity {Id}", predictionType, entityId);
            return cached?.Score ?? 0m;
        }
    }

    private async Task<(decimal Score, string? Label, string? FeatureJson, string ModelVersion)> PostPredictAsync(string path, object body)
    {
        var json = JsonSerializer.Serialize(body, JsonOpts);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");
        var resp = await _http.PostAsync(path, content);
        resp.EnsureSuccessStatusCode();
        var dto = await resp.Content.ReadFromJsonAsync<MlScoreResponse>(JsonOpts)
                  ?? throw new InvalidOperationException("Empty ML response");
        return (dto.Score, dto.Label, json, dto.ModelVersion ?? "unknown");
    }

    /// <summary>POST /v1/resident-risk/predict with a one-row feature array (FastAPI contract).</summary>
    private async Task<(decimal Score, string? Label, string? FeatureJson, string ModelVersion)> PostResidentRiskV1Async(object featureRow)
    {
        var featureJson = JsonSerializer.Serialize(featureRow, JsonOpts);
        var payload = JsonSerializer.Serialize(new[] { featureRow }, JsonOpts);
        using var content = new StringContent(payload, Encoding.UTF8, "application/json");
        var resp = await _http.PostAsync("/v1/resident-risk/predict", content);
        resp.EnsureSuccessStatusCode();
        var text = await resp.Content.ReadAsStringAsync();
        var (score, label, version) = ParseFlexibleMlScore(text);
        return (score, label, featureJson, version);
    }

    private static (decimal Score, string? Label, string ModelVersion) ParseFlexibleMlScore(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        var row = root;
        if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
            row = root[0];

        decimal score = 0;
        string? label = null;
        var version = "unknown";

        if (row.ValueKind == JsonValueKind.Object)
        {
            if (row.TryGetProperty("score", out var s))
                score = s.GetDecimal();
            else if (row.TryGetProperty("Score", out var s2))
                score = s2.GetDecimal();

            if (row.TryGetProperty("label", out var l))
                label = l.GetString();
            else if (row.TryGetProperty("Label", out var l2))
                label = l2.GetString();

            if (row.TryGetProperty("modelVersion", out var m))
                version = m.GetString() ?? "unknown";
            else if (row.TryGetProperty("ModelVersion", out var m2))
                version = m2.GetString() ?? "unknown";
        }

        return (score, label, version);
    }

    private async Task<object> BuildDonorLapseBodyAsync(int supporterId)
    {
        var s = await _db.Supporters.AsNoTracking().FirstOrDefaultAsync(x => x.SupporterId == supporterId)
                ?? throw new InvalidOperationException("Supporter not found");
        var donations = await _db.Donations.AsNoTracking().Where(d => d.SupporterId == supporterId).ToListAsync();
        var last = donations.OrderByDescending(d => d.DonationDate).FirstOrDefault();
        var daysSince = last == null ? 999 : (DateOnly.FromDateTime(DateTime.UtcNow).DayNumber - last.DonationDate.DayNumber);
        return new
        {
            supporterId,
            daysSinceLastDonation = daysSince,
            donationCount = donations.Count,
            totalLifetimeValue = donations.Sum(d => d.Amount ?? d.EstimatedValue ?? 0),
            isRecurring = donations.Any(d => d.IsRecurring),
            acquisitionChannel = s.AcquisitionChannel,
            donationType = donations.FirstOrDefault()?.DonationType ?? ""
        };
    }

    private async Task<object> BuildResidentRiskBodyAsync(int residentId)
    {
        var r = await _db.Residents.AsNoTracking().FirstOrDefaultAsync(x => x.ResidentId == residentId)
                ?? throw new InvalidOperationException("Resident not found");
        var recentIncidents = await _db.IncidentReports.CountAsync(i => i.ResidentId == residentId && i.IncidentDate >= DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-90)));
        var lastSession = await _db.ProcessRecordings.AsNoTracking()
            .Where(p => p.ResidentId == residentId)
            .OrderByDescending(p => p.SessionDate)
            .Select(p => (DateOnly?)p.SessionDate)
            .FirstOrDefaultAsync();
        var daysSinceSession = lastSession == null ? 999 : (DateOnly.FromDateTime(DateTime.UtcNow).DayNumber - lastSession.Value.DayNumber);
        var avgEmotional = 0.5m;
        var edu = await _db.EducationRecords.AsNoTracking()
            .Where(e => e.ResidentId == residentId)
            .OrderByDescending(e => e.RecordDate)
            .Select(e => (decimal?)e.ProgressPercent)
            .FirstOrDefaultAsync() ?? 0;
        var health = await _db.HealthWellbeingRecords.AsNoTracking()
            .Where(h => h.ResidentId == residentId)
            .OrderByDescending(h => h.RecordDate)
            .Select(h => (decimal?)h.GeneralHealthScore)
            .FirstOrDefaultAsync() ?? 0;
        var openIv = await _db.InterventionPlans.CountAsync(p => p.ResidentId == residentId && p.Status != "Closed");
        return new
        {
            residentId,
            currentRiskLevel = r.CurrentRiskLevel,
            recentIncidentCount = recentIncidents,
            daysSinceLastSession = daysSinceSession,
            avgEmotionalStateScore = avgEmotional,
            educationProgress = edu,
            healthScore = health,
            openInterventionCount = openIv
        };
    }

    private async Task<object> BuildSocialBodyAsync(int postId)
    {
        var p = await _db.SocialMediaPosts.AsNoTracking().FirstOrDefaultAsync(x => x.PostId == postId)
                ?? throw new InvalidOperationException("Post not found");
        return new
        {
            postId,
            platform = p.Platform,
            postType = p.PostType,
            mediaType = p.MediaType,
            contentTopic = p.ContentTopic,
            sentimentTone = p.SentimentTone,
            hasCallToAction = p.HasCallToAction,
            isBoosted = p.IsBoosted,
            postHour = p.PostHour,
            dayOfWeek = p.DayOfWeek,
            numHashtags = p.NumHashtags,
            featuresResidentStory = p.FeaturesResidentStory
        };
    }

    private async Task<object> BuildDonorUpgradeBodyAsync(int supporterId)
    {
        var s = await _db.Supporters.AsNoTracking().FirstOrDefaultAsync(x => x.SupporterId == supporterId)
                ?? throw new InvalidOperationException("Supporter not found");
        var donations = await _db.Donations.AsNoTracking().Where(d => d.SupporterId == supporterId).ToListAsync();
        var avg = donations.Count == 0 ? 0 : donations.Average(d => d.Amount ?? d.EstimatedValue ?? 0);
        var monthsSince = s.FirstDonationDate == null
            ? 0
            : Math.Max(0, (DateOnly.FromDateTime(DateTime.UtcNow).Year - s.FirstDonationDate.Value.Year) * 12
                + DateOnly.FromDateTime(DateTime.UtcNow).Month - s.FirstDonationDate.Value.Month);
        return new
        {
            supporterId,
            avgDonationAmount = avg,
            donationFrequency = donations.Count,
            monthsSinceFirstDonation = monthsSince,
            acquisitionChannel = s.AcquisitionChannel,
            donationType = donations.LastOrDefault()?.DonationType ?? ""
        };
    }

    private sealed class MlScoreResponse
    {
        public decimal Score { get; set; }
        public string? Label { get; set; }
        public string? ModelVersion { get; set; }
    }
}
