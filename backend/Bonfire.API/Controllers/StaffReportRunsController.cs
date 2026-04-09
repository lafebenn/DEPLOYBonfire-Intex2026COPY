using System.Security.Claims;
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
[Route("api/staff-report-runs")]
public class StaffReportRunsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly SanitizerService _s;

    public StaffReportRunsController(AppDbContext db, SanitizerService s)
    {
        _db = db;
        _s = s;
    }

    public class StaffReportRunWriteDto
    {
        public string TemplateTitle { get; set; } = string.Empty;
        public DateOnly ReportingPeriodStart { get; set; }
        public DateOnly ReportingPeriodEnd { get; set; }
        public int? SafehouseId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string Status { get; set; } = "Draft";
        public string? ParametersJson { get; set; }
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> List([FromQuery] int take = 50)
    {
        take = Math.Clamp(take, 1, 200);
        var rows = await _db.StaffReportRuns.AsNoTracking()
            .Include(r => r.Safehouse)
            .OrderByDescending(r => r.CreatedAt)
            .Take(take)
            .Select(r => new
            {
                r.StaffReportRunId,
                r.CreatedAt,
                r.CreatedByUserId,
                r.TemplateTitle,
                r.ReportingPeriodStart,
                r.ReportingPeriodEnd,
                r.SafehouseId,
                safehouseName = r.Safehouse != null ? r.Safehouse.Name : null,
                r.Title,
                r.Notes,
                r.Status,
                r.ParametersJson
            })
            .ToListAsync();
        return Ok(ApiResponse<object>.Ok(rows));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] StaffReportRunWriteDto dto)
    {
        if (dto.ReportingPeriodStart > dto.ReportingPeriodEnd)
            return BadRequest(ApiResponse<object>.Fail("Reporting period start must be on or before end."));

        if (dto.SafehouseId.HasValue)
        {
            var shExists = await _db.Safehouses.AsNoTracking().AnyAsync(s => s.SafehouseId == dto.SafehouseId.Value);
            if (!shExists)
                return BadRequest(ApiResponse<object>.Fail("Invalid safehouse."));
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var e = new StaffReportRun
        {
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = userId,
            TemplateTitle = _s.Sanitize(dto.TemplateTitle) ?? "",
            ReportingPeriodStart = dto.ReportingPeriodStart,
            ReportingPeriodEnd = dto.ReportingPeriodEnd,
            SafehouseId = dto.SafehouseId,
            Title = _s.Sanitize(dto.Title) ?? "",
            Notes = _s.Sanitize(dto.Notes),
            Status = _s.Sanitize(dto.Status) ?? "Draft",
            ParametersJson = string.IsNullOrWhiteSpace(dto.ParametersJson) ? null : _s.Sanitize(dto.ParametersJson)
        };
        _db.StaffReportRuns.Add(e);
        await _db.SaveChangesAsync();
        return StatusCode(201, ApiResponse<object>.Ok(new { id = e.StaffReportRunId }));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] StaffReportRunWriteDto dto)
    {
        if (dto.ReportingPeriodStart > dto.ReportingPeriodEnd)
            return BadRequest(ApiResponse<object>.Fail("Reporting period start must be on or before end."));

        if (dto.SafehouseId.HasValue)
        {
            var shExists = await _db.Safehouses.AsNoTracking().AnyAsync(s => s.SafehouseId == dto.SafehouseId.Value);
            if (!shExists)
                return BadRequest(ApiResponse<object>.Fail("Invalid safehouse."));
        }

        var e = await _db.StaffReportRuns.FindAsync(id);
        if (e == null) return NotFound(ApiResponse<object>.Fail("Not found"));

        e.TemplateTitle = _s.Sanitize(dto.TemplateTitle) ?? "";
        e.ReportingPeriodStart = dto.ReportingPeriodStart;
        e.ReportingPeriodEnd = dto.ReportingPeriodEnd;
        e.SafehouseId = dto.SafehouseId;
        e.Title = _s.Sanitize(dto.Title) ?? "";
        e.Notes = _s.Sanitize(dto.Notes);
        e.Status = _s.Sanitize(dto.Status) ?? "Draft";
        e.ParametersJson = string.IsNullOrWhiteSpace(dto.ParametersJson) ? null : _s.Sanitize(dto.ParametersJson);
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(new { updated = true }, "Updated"));
    }
}
