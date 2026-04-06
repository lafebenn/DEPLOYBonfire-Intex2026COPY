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
[Route("api/safehouses")]
public class SafehousesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly SanitizerService _sanitizer;
    private readonly ILogger<SafehousesController> _logger;

    public SafehousesController(AppDbContext db, SanitizerService sanitizer, ILogger<SafehousesController> logger)
    {
        _db = db;
        _sanitizer = sanitizer;
        _logger = logger;
    }

    public class SafehouseWriteDto
    {
        public string SafehouseCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Region { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
        public string? Country { get; set; }
        public DateOnly OpenDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public int CapacityGirls { get; set; }
        public int CapacityStaff { get; set; }
        public int CurrentOccupancy { get; set; }
        public string? Notes { get; set; }
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<object>>> List()
    {
        var list = await _db.Safehouses.AsNoTracking().OrderBy(s => s.Name).ToListAsync();
        return Ok(ApiResponse<object>.Ok(list));
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<object>>> Get(int id)
    {
        var s = await _db.Safehouses.AsNoTracking().FirstOrDefaultAsync(x => x.SafehouseId == id);
        if (s == null)
            return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<object>.Ok(s));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] SafehouseWriteDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed"));

        var entity = new Safehouse
        {
            SafehouseCode = _sanitizer.Sanitize(dto.SafehouseCode) ?? "",
            Name = _sanitizer.Sanitize(dto.Name) ?? "",
            Region = _sanitizer.Sanitize(dto.Region) ?? "",
            City = _sanitizer.Sanitize(dto.City) ?? "",
            Province = _sanitizer.Sanitize(dto.Province) ?? "",
            Country = _sanitizer.Sanitize(dto.Country) ?? "Philippines",
            OpenDate = dto.OpenDate,
            Status = _sanitizer.Sanitize(dto.Status) ?? "",
            CapacityGirls = dto.CapacityGirls,
            CapacityStaff = dto.CapacityStaff,
            CurrentOccupancy = dto.CurrentOccupancy,
            Notes = _sanitizer.Sanitize(dto.Notes)
        };

        _db.Safehouses.Add(entity);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Safehouse {Id} created", entity.SafehouseId);
        return StatusCode(201, ApiResponse<object>.Ok(new { id = entity.SafehouseId }));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] SafehouseWriteDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed"));

        var entity = await _db.Safehouses.FindAsync(id);
        if (entity == null)
            return NotFound(ApiResponse<object>.Fail("Not found"));

        entity.SafehouseCode = _sanitizer.Sanitize(dto.SafehouseCode) ?? "";
        entity.Name = _sanitizer.Sanitize(dto.Name) ?? "";
        entity.Region = _sanitizer.Sanitize(dto.Region) ?? "";
        entity.City = _sanitizer.Sanitize(dto.City) ?? "";
        entity.Province = _sanitizer.Sanitize(dto.Province) ?? "";
        entity.Country = _sanitizer.Sanitize(dto.Country) ?? "Philippines";
        entity.OpenDate = dto.OpenDate;
        entity.Status = _sanitizer.Sanitize(dto.Status) ?? "";
        entity.CapacityGirls = dto.CapacityGirls;
        entity.CapacityStaff = dto.CapacityStaff;
        entity.CurrentOccupancy = dto.CurrentOccupancy;
        entity.Notes = _sanitizer.Sanitize(dto.Notes);

        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Updated"));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        if (!DeleteConfirmation.IsConfirmed(Request.Query))
            return BadRequest(ApiResponse<object>.Fail(DeleteConfirmation.Message));

        var entity = await _db.Safehouses.FindAsync(id);
        if (entity == null)
            return NotFound(ApiResponse<object>.Fail("Not found"));

        entity.Status = "Inactive";
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Soft deleted"));
    }
}
