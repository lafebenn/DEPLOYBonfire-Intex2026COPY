using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Bonfire.API.Data;
using Bonfire.API.Infrastructure;
using Bonfire.API.Models;
using Bonfire.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Controllers;

/// <summary>
/// ML predictions storage, live proxy calls to the Python API, and legacy <c>/api/ml/predictions</c> routes.
/// </summary>
[ApiController]
[Authorize(Roles = "Admin,Staff")]
[Route("api/prediction")]
public class PredictionController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly MlService _ml;
    private readonly SanitizerService _s;
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PredictionController> _logger;

    public PredictionController(
        AppDbContext db,
        MlService ml,
        SanitizerService s,
        IHttpClientFactory httpFactory,
        IConfiguration configuration,
        ILogger<PredictionController> logger)
    {
        _db = db;
        _ml = ml;
        _s = s;
        _httpFactory = httpFactory;
        _configuration = configuration;
        _logger = logger;
    }

    // --- Legacy: stored predictions CRUD / list (unchanged paths for clients) ---

    [HttpGet("~/api/ml/predictions")]
    public async Task<ActionResult<ApiResponse<object>>> List(
        [FromQuery] string? predictionType,
        [FromQuery] string? entityType,
        [FromQuery] int? entityId)
    {
        var q = _db.MlPredictions.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(predictionType)) q = q.Where(p => p.PredictionType == predictionType);
        if (!string.IsNullOrWhiteSpace(entityType)) q = q.Where(p => p.EntityType == entityType);
        if (entityId.HasValue) q = q.Where(p => p.EntityId == entityId.Value);
        var list = await q.OrderByDescending(p => p.PredictedAt).Take(500).ToListAsync();
        return Ok(ApiResponse<object>.Ok(list));
    }

    public class MlPredictionWriteDto
    {
        public string PredictionType { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public int EntityId { get; set; }
        public decimal Score { get; set; }
        public string? Label { get; set; }
        public string? FeaturePayloadJson { get; set; }
        public string ModelVersion { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }
    }

    [HttpPost("~/api/ml/predictions")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Upsert([FromBody] MlPredictionWriteDto dto)
    {
        var row = new MlPrediction
        {
            PredictionType = _s.Sanitize(dto.PredictionType) ?? "",
            EntityType = _s.Sanitize(dto.EntityType) ?? "",
            EntityId = dto.EntityId,
            Score = dto.Score,
            Label = _s.Sanitize(dto.Label),
            FeaturePayloadJson = _s.Sanitize(dto.FeaturePayloadJson),
            ModelVersion = _s.Sanitize(dto.ModelVersion) ?? "",
            PredictedAt = DateTime.UtcNow,
            ExpiresAt = dto.ExpiresAt ?? DateTime.UtcNow.AddHours(24)
        };
        _db.MlPredictions.Add(row);
        await _db.SaveChangesAsync();
        return StatusCode(201, ApiResponse<object>.Ok(new { id = row.PredictionId }));
    }

    [HttpGet("~/api/ml/predictions/{entityType}/{entityId:int}")]
    public async Task<ActionResult<ApiResponse<object>>> LatestForEntity(string entityType, int entityId)
    {
        var et = entityType.Trim();
        var raw = await _db.MlPredictions.AsNoTracking()
            .Where(p => p.EntityType == et && p.EntityId == entityId)
            .OrderByDescending(p => p.PredictedAt)
            .ToListAsync();

        var list = raw
            .GroupBy(p => p.PredictionType)
            .Select(g => g.OrderByDescending(x => x.PredictedAt).First())
            .ToList();

        if (!list.Any())
        {
            try
            {
                await _ml.RefreshPredictionsForEntityAsync(et, entityId);
            }
            catch
            {
                // ignore
            }

            raw = await _db.MlPredictions.AsNoTracking()
                .Where(p => p.EntityType == et && p.EntityId == entityId)
                .OrderByDescending(p => p.PredictedAt)
                .ToListAsync();
            list = raw
                .GroupBy(p => p.PredictionType)
                .Select(g => g.OrderByDescending(x => x.PredictedAt).First())
                .ToList();
        }

        return Ok(ApiResponse<object>.Ok(list));
    }

    // --- Live proxy: Python ML API (raw JSON response) ---

    /// <summary>
    /// Proxies resident feature rows to the Python ML API and returns its JSON body unchanged.
    /// </summary>
    [HttpGet("resident-risk/{residentId:int}")]
    public async Task<IActionResult> GetResidentRisk(int residentId, CancellationToken cancellationToken)
    {
        if (!EnsureMlConfigured(out var reject)) return reject!;

        var row = await MlProxyPayloadMappers.MapResidentRiskRowAsync(_db, residentId, cancellationToken);
        if (row == null)
            return NotFound(new { error = "Resident not found" });

        var payload = new ResidentRiskPredictPayload { Residents = [row] };
        return await ProxyMlPredictAsync(
            "v1/resident-risk/predict",
            payload,
            cancellationToken,
            "resident-risk",
            residentId);
    }

    /// <summary>
    /// Proxies donor (supporter) lapse features to the Python ML API and returns its JSON body unchanged.
    /// </summary>
    [HttpGet("donor-lapse/{supporterId:int}")]
    public async Task<IActionResult> GetDonorLapse(int supporterId, CancellationToken cancellationToken)
    {
        if (!EnsureMlConfigured(out var reject)) return reject!;

        var row = await MlProxyPayloadMappers.MapDonorLapseRowAsync(_db, supporterId, cancellationToken);
        if (row == null)
            return NotFound(new { error = "Supporter not found" });

        var payload = new DonorLapsePredictPayload { Supporters = [row] };
        return await ProxyMlPredictAsync(
            "v1/donor-lapse/predict",
            payload,
            cancellationToken,
            "donor-lapse",
            supporterId);
    }

    /// <summary>
    /// Donor giving model (supporter profile features). See <see cref="DonorGivingMlRow"/> for TODO on Python alignment.
    /// </summary>
    [HttpGet("donor-giving/{donorId:int}")]
    public async Task<IActionResult> GetDonorGiving(int donorId, CancellationToken cancellationToken)
    {
        if (!EnsureMlConfigured(out var reject)) return reject!;

        var row = await MlProxyPayloadMappers.MapDonorGivingRowAsync(_db, donorId, cancellationToken);
        if (row == null)
            return NotFound(new { error = "Supporter not found" });

        var payload = new DonorGivingPredictPayload { Supporters = [row] };
        return await ProxyMlPredictAsync(
            "v1/donor-giving/predict",
            payload,
            cancellationToken,
            "donor-giving",
            donorId);
    }

    [HttpGet("social-media/{postId:int}")]
    public async Task<IActionResult> GetSocialMediaPrediction(int postId, CancellationToken cancellationToken)
    {
        if (!EnsureMlConfigured(out var reject)) return reject!;

        var p = await _db.SocialMediaPosts.AsNoTracking().FirstOrDefaultAsync(x => x.PostId == postId, cancellationToken);
        var row = MlProxyPayloadMappers.MapSocialMediaRow(p);
        if (row == null)
            return NotFound(new { error = "Post not found" });

        var payload = new SocialMediaPredictPayload { Posts = [row] };
        return await ProxyMlPredictAsync(
            "v1/social-media/predict",
            payload,
            cancellationToken,
            "social-media",
            postId);
    }

    private bool EnsureMlConfigured(out IActionResult? reject)
    {
        reject = null;
        var baseUrl = _configuration["ML_API_URL"]?.Trim().TrimEnd('/');
        if (!string.IsNullOrWhiteSpace(baseUrl))
            return true;

        _logger.LogWarning("ML_API_URL is not configured");
        reject = StatusCode(503, new { error = "ML API is not configured on the server." });
        return false;
    }

    private async Task<IActionResult> ProxyMlPredictAsync(
        string mlRelativePath,
        object payload,
        CancellationToken cancellationToken,
        string proxyContext,
        int entityId)
    {
        var json = JsonSerializer.Serialize(payload, MlProxyJson.SerializerOptions);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");
        content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        var client = _httpFactory.CreateClient("MlApi");
        using var request = new HttpRequestMessage(HttpMethod.Post, mlRelativePath) { Content = content };

        try
        {
            var response = await client.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            return new ContentResult
            {
                StatusCode = (int)response.StatusCode,
                Content = body,
                ContentType = "application/json; charset=utf-8"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ML proxy call failed ({ProxyContext}) for entity id {EntityId}", proxyContext, entityId);
            return StatusCode(502, new { error = "Failed to reach ML service", detail = ex.Message });
        }
    }
}
