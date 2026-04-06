using Bonfire.API.Data;
using Bonfire.API.Infrastructure;
using Bonfire.API.Models;
using Bonfire.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Staff")]
[Route("api/ml/predictions")]
public class MlPredictionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly MlService _ml;
    private readonly SanitizerService _s;

    public MlPredictionsController(AppDbContext db, MlService ml, SanitizerService s)
    {
        _db = db;
        _ml = ml;
        _s = s;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
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

    [HttpPost]
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

    [HttpGet("{entityType}/{entityId:int}")]
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
}
