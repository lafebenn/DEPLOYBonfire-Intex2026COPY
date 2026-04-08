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
            var row = await MlProxyPayloadMappers.MapDonorLapseRowAsync(_db, supporterId)
                      ?? throw new InvalidOperationException("Supporter not found");
            var payload = new DonorLapsePredictPayload { Supporters = [row] };
            var featureJson = JsonSerializer.Serialize(row, MlProxyJson.SerializerOptions);
            return await PostMlV1PredictAsync("/v1/donor-lapse/predict", payload, featureJson);
        });

    public Task<decimal> GetResidentRiskScoreAsync(int residentId) =>
        GetOrRefreshAsync("ResidentRiskFlag", "Resident", residentId, async () =>
        {
            var row = await MlProxyPayloadMappers.MapResidentRiskRowAsync(_db, residentId)
                      ?? throw new InvalidOperationException("Resident not found");
            var payload = new ResidentRiskPredictPayload { Residents = [row] };
            var featureJson = JsonSerializer.Serialize(row, MlProxyJson.SerializerOptions);
            return await PostMlV1PredictAsync("/v1/resident-risk/predict", payload, featureJson);
        });

    public Task<decimal> GetSocialMediaDonationScoreAsync(int postId) =>
        GetOrRefreshAsync("SocialMediaScore", "SocialMediaPost", postId, async () =>
        {
            var p = await _db.SocialMediaPosts.AsNoTracking().FirstOrDefaultAsync(x => x.PostId == postId)
                    ?? throw new InvalidOperationException("Post not found");
            var row = MlProxyPayloadMappers.MapSocialMediaRow(p)
                      ?? throw new InvalidOperationException("Post not found");
            var payload = new SocialMediaPredictPayload { Posts = [row] };
            var featureJson = JsonSerializer.Serialize(row, MlProxyJson.SerializerOptions);
            return await PostMlV1PredictAsync("/v1/social-media/predict", payload, featureJson);
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

    private async Task<(decimal Score, string? Label, string? FeatureJson, string ModelVersion)> PostMlV1PredictAsync(
        string relativePath,
        object payload,
        string featureJsonForCache)
    {
        var json = JsonSerializer.Serialize(payload, MlProxyJson.SerializerOptions);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");
        var resp = await _http.PostAsync(relativePath, content);
        resp.EnsureSuccessStatusCode();
        var text = await resp.Content.ReadAsStringAsync();
        var (score, label, version) = ParseFlexibleMlScore(text);
        return (score, label, featureJsonForCache, version);
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
            if (row.TryGetProperty("results", out var results) && results.ValueKind == JsonValueKind.Array &&
                results.GetArrayLength() > 0)
                return ParseFlexibleMlScore(results[0].GetRawText());
            if (row.TryGetProperty("predictions", out var preds) && preds.ValueKind == JsonValueKind.Array &&
                preds.GetArrayLength() > 0)
                return ParseFlexibleMlScore(preds[0].GetRawText());

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
