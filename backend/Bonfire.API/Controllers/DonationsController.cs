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
[Route("api/donations")]
public class DonationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly SanitizerService _s;

    public DonationsController(AppDbContext db, SanitizerService s)
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
        [FromQuery] int? supporterId,
        [FromQuery] string? type,
        [FromQuery] string? campaignName,
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo)
    {
        var q = _db.Donations.AsNoTracking().AsQueryable();
        if (supporterId.HasValue) q = q.Where(d => d.SupporterId == supporterId.Value);
        if (!string.IsNullOrWhiteSpace(type)) q = q.Where(d => d.DonationType == type);
        if (!string.IsNullOrWhiteSpace(campaignName)) q = q.Where(d => d.CampaignName == campaignName);
        if (dateFrom.HasValue) q = q.Where(d => d.DonationDate >= dateFrom.Value);
        if (dateTo.HasValue) q = q.Where(d => d.DonationDate <= dateTo.Value);
        var list = await q.OrderByDescending(d => d.DonationDate).ToListAsync();
        return Ok(ApiResponse<object>.Ok(list));
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Donor")]
    public async Task<ActionResult<ApiResponse<object>>> Get(int id)
    {
        var d = await _db.Donations.AsNoTracking().FirstOrDefaultAsync(x => x.DonationId == id);
        if (d == null) return NotFound(ApiResponse<object>.Fail("Not found"));

        if (User.IsInRole("Donor"))
        {
            var mine = LinkedSupporterId();
            if (mine != d.SupporterId)
                return StatusCode(403, ApiResponse<object>.Fail("Forbidden"));
        }

        return Ok(ApiResponse<object>.Ok(d));
    }

    public class DonationWriteDto
    {
        public int SupporterId { get; set; }
        public string DonationType { get; set; } = string.Empty;
        public DateOnly DonationDate { get; set; }
        public string ChannelSource { get; set; } = string.Empty;
        public string? CurrencyCode { get; set; }
        public decimal? Amount { get; set; }
        public decimal? EstimatedValue { get; set; }
        public string? ImpactUnit { get; set; }
        public bool IsRecurring { get; set; }
        public string? CampaignName { get; set; }
        public string? Notes { get; set; }
        public int? CreatedByPartnerId { get; set; }
        public int? ReferralPostId { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] DonationWriteDto dto)
    {
        if (!await _db.Supporters.AnyAsync(s => s.SupporterId == dto.SupporterId))
            return BadRequest(ApiResponse<object>.Fail("Invalid supporter."));
        var e = new Donation
        {
            SupporterId = dto.SupporterId,
            DonationType = _s.Sanitize(dto.DonationType) ?? "",
            DonationDate = dto.DonationDate,
            ChannelSource = _s.Sanitize(dto.ChannelSource) ?? "",
            CurrencyCode = _s.Sanitize(dto.CurrencyCode),
            Amount = dto.Amount,
            EstimatedValue = dto.EstimatedValue,
            ImpactUnit = _s.Sanitize(dto.ImpactUnit),
            IsRecurring = dto.IsRecurring,
            CampaignName = _s.Sanitize(dto.CampaignName),
            Notes = _s.Sanitize(dto.Notes),
            CreatedByPartnerId = dto.CreatedByPartnerId,
            ReferralPostId = dto.ReferralPostId
        };
        _db.Donations.Add(e);
        await _db.SaveChangesAsync();
        return StatusCode(201, ApiResponse<object>.Ok(new { id = e.DonationId }));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] DonationWriteDto dto)
    {
        var e = await _db.Donations.FindAsync(id);
        if (e == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        if (!await _db.Supporters.AnyAsync(s => s.SupporterId == dto.SupporterId))
            return BadRequest(ApiResponse<object>.Fail("Invalid supporter."));
        e.SupporterId = dto.SupporterId;
        e.DonationType = _s.Sanitize(dto.DonationType) ?? "";
        e.DonationDate = dto.DonationDate;
        e.ChannelSource = _s.Sanitize(dto.ChannelSource) ?? "";
        e.CurrencyCode = _s.Sanitize(dto.CurrencyCode);
        e.Amount = dto.Amount;
        e.EstimatedValue = dto.EstimatedValue;
        e.ImpactUnit = _s.Sanitize(dto.ImpactUnit);
        e.IsRecurring = dto.IsRecurring;
        e.CampaignName = _s.Sanitize(dto.CampaignName);
        e.Notes = _s.Sanitize(dto.Notes);
        e.CreatedByPartnerId = dto.CreatedByPartnerId;
        e.ReferralPostId = dto.ReferralPostId;
        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Updated"));
    }
}
