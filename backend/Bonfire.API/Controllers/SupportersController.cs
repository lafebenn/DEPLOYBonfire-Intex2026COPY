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
[Route("api/supporters")]
public class SupportersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly SanitizerService _s;

    public SupportersController(AppDbContext db, SanitizerService s)
    {
        _db = db;
        _s = s;
    }

    private int? LinkedSupporterId()
    {
        var v = User.Claims.FirstOrDefault(c => c.Type == "linkedSupporterId")?.Value;
        return int.TryParse(v, out var id) ? id : null;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> List(
        [FromQuery] string? type,
        [FromQuery] string? status,
        [FromQuery] string? search)
    {
        var q = _db.Supporters.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(type)) q = q.Where(s => s.SupporterType == type);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(s => s.Status == status);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var t = search.Trim();
            q = q.Where(s => s.DisplayName.Contains(t) || s.Email.Contains(t));
        }

        return Ok(ApiResponse<object>.Ok(await q.OrderBy(s => s.DisplayName).ToListAsync()));
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Staff,Donor")]
    public async Task<ActionResult<ApiResponse<object>>> Get(int id)
    {
        if (User.IsInRole("Donor"))
        {
            var mine = LinkedSupporterId();
            if (mine != id)
                return StatusCode(403, ApiResponse<object>.Fail("Forbidden"));
        }

        var s = await _db.Supporters.AsNoTracking().FirstOrDefaultAsync(x => x.SupporterId == id);
        if (s == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<object>.Ok(s));
    }

    public class SupporterWriteDto
    {
        public string SupporterType { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? OrganizationName { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string RelationshipType { get; set; } = string.Empty;
        public string Region { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateOnly? FirstDonationDate { get; set; }
        public string AcquisitionChannel { get; set; } = string.Empty;
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] SupporterWriteDto dto)
    {
        var e = new Supporter
        {
            SupporterType = _s.Sanitize(dto.SupporterType) ?? "",
            DisplayName = _s.Sanitize(dto.DisplayName) ?? "",
            OrganizationName = _s.Sanitize(dto.OrganizationName),
            FirstName = _s.Sanitize(dto.FirstName),
            LastName = _s.Sanitize(dto.LastName),
            RelationshipType = _s.Sanitize(dto.RelationshipType) ?? "",
            Region = _s.Sanitize(dto.Region) ?? "",
            Country = _s.Sanitize(dto.Country) ?? "",
            Email = _s.Sanitize(dto.Email) ?? "",
            Phone = _s.Sanitize(dto.Phone) ?? "",
            Status = _s.Sanitize(dto.Status) ?? "",
            FirstDonationDate = dto.FirstDonationDate,
            AcquisitionChannel = _s.Sanitize(dto.AcquisitionChannel) ?? "",
            CreatedAt = DateTime.UtcNow
        };
        _db.Supporters.Add(e);
        await _db.SaveChangesAsync();
        return StatusCode(201, ApiResponse<object>.Ok(new { id = e.SupporterId }));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] SupporterWriteDto dto)
    {
        var e = await _db.Supporters.FindAsync(id);
        if (e == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        e.SupporterType = _s.Sanitize(dto.SupporterType) ?? "";
        e.DisplayName = _s.Sanitize(dto.DisplayName) ?? "";
        e.OrganizationName = _s.Sanitize(dto.OrganizationName);
        e.FirstName = _s.Sanitize(dto.FirstName);
        e.LastName = _s.Sanitize(dto.LastName);
        e.RelationshipType = _s.Sanitize(dto.RelationshipType) ?? "";
        e.Region = _s.Sanitize(dto.Region) ?? "";
        e.Country = _s.Sanitize(dto.Country) ?? "";
        e.Email = _s.Sanitize(dto.Email) ?? "";
        e.Phone = _s.Sanitize(dto.Phone) ?? "";
        e.Status = _s.Sanitize(dto.Status) ?? "";
        e.FirstDonationDate = dto.FirstDonationDate;
        e.AcquisitionChannel = _s.Sanitize(dto.AcquisitionChannel) ?? "";
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Updated"));
    }
}
