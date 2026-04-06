using Bonfire.API.Data;
using Bonfire.API.Infrastructure;
using Bonfire.API.Models;
using Bonfire.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Controllers;

[ApiController]
[Authorize]
[Route("api/impact-snapshots")]
public class ImpactSnapshotsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly SanitizerService _s;

    public ImpactSnapshotsController(AppDbContext db, SanitizerService s)
    {
        _db = db;
        _s = s;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> ListPublished()
    {
        var list = await _db.PublicImpactSnapshots.AsNoTracking()
            .Where(x => x.IsPublished)
            .OrderByDescending(x => x.SnapshotDate)
            .ToListAsync();
        return Ok(ApiResponse<object>.Ok(list));
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> GetPublished(int id)
    {
        var s = await _db.PublicImpactSnapshots.AsNoTracking().FirstOrDefaultAsync(x => x.SnapshotId == id);
        if (s == null || !s.IsPublished)
            return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<object>.Ok(s));
    }

    public class SnapshotWriteDto
    {
        public DateOnly SnapshotDate { get; set; }
        public string Headline { get; set; } = string.Empty;
        public string SummaryText { get; set; } = string.Empty;
        public string MetricPayloadJson { get; set; } = string.Empty;
        public bool IsPublished { get; set; }
        public DateOnly? PublishedAt { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] SnapshotWriteDto dto)
    {
        var e = new PublicImpactSnapshot
        {
            SnapshotDate = dto.SnapshotDate,
            Headline = _s.Sanitize(dto.Headline) ?? "",
            SummaryText = _s.Sanitize(dto.SummaryText) ?? "",
            MetricPayloadJson = _s.Sanitize(dto.MetricPayloadJson) ?? "{}",
            IsPublished = dto.IsPublished,
            PublishedAt = dto.PublishedAt
        };
        _db.PublicImpactSnapshots.Add(e);
        await _db.SaveChangesAsync();
        return StatusCode(201, ApiResponse<object>.Ok(new { id = e.SnapshotId }));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] SnapshotWriteDto dto)
    {
        var e = await _db.PublicImpactSnapshots.FindAsync(id);
        if (e == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        e.SnapshotDate = dto.SnapshotDate;
        e.Headline = _s.Sanitize(dto.Headline) ?? "";
        e.SummaryText = _s.Sanitize(dto.SummaryText) ?? "";
        e.MetricPayloadJson = _s.Sanitize(dto.MetricPayloadJson) ?? "{}";
        e.IsPublished = dto.IsPublished;
        e.PublishedAt = dto.PublishedAt;
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Updated"));
    }
}
