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
[Route("api/intervention-plans")]
public class InterventionPlansController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly SanitizerService _s;

    public InterventionPlansController(AppDbContext db, SanitizerService s)
    {
        _db = db;
        _s = s;
    }

    public class InterventionPlanUpdateDto
    {
        public string PlanCategory { get; set; } = string.Empty;
        public string PlanDescription { get; set; } = string.Empty;
        public string ServicesProvided { get; set; } = string.Empty;
        public decimal? TargetValue { get; set; }
        public DateOnly TargetDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateOnly? CaseConferenceDate { get; set; }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] InterventionPlanUpdateDto dto)
    {
        var e = await _db.InterventionPlans.FindAsync(id);
        if (e == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        e.PlanCategory = _s.Sanitize(dto.PlanCategory) ?? "";
        e.PlanDescription = _s.Sanitize(dto.PlanDescription) ?? "";
        e.ServicesProvided = _s.Sanitize(dto.ServicesProvided) ?? "";
        e.TargetValue = dto.TargetValue;
        e.TargetDate = dto.TargetDate;
        e.Status = _s.Sanitize(dto.Status) ?? "";
        e.CaseConferenceDate = dto.CaseConferenceDate;
        e.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Updated"));
    }
}
