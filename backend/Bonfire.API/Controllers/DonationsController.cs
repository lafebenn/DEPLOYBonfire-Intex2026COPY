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
        public List<DonationAllocationWriteDto> Allocations { get; set; } = new();
    }

    public class DonationAllocationWriteDto
    {
        public int SafehouseId { get; set; }
        public string ProgramArea { get; set; } = string.Empty;
        public decimal AmountAllocated { get; set; }
        public DateOnly? AllocationDate { get; set; }
        public string? AllocationNotes { get; set; }
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

        if (dto.Allocations.Count > 0)
        {
            var safehouseIds = dto.Allocations.Select(a => a.SafehouseId).Distinct().ToList();
            var existingSafehouses = await _db.Safehouses.AsNoTracking()
                .Where(s => safehouseIds.Contains(s.SafehouseId))
                .Select(s => s.SafehouseId)
                .ToListAsync();
            var existingSet = existingSafehouses.ToHashSet();
            if (safehouseIds.Any(id => !existingSet.Contains(id)))
                return BadRequest(ApiResponse<object>.Fail("One or more allocations reference an invalid safehouse."));

            var allocDate = dto.DonationDate;
            var allocs = dto.Allocations
                .Where(a => a.AmountAllocated > 0)
                .Select(a => new DonationAllocation
                {
                    DonationId = e.DonationId,
                    SafehouseId = a.SafehouseId,
                    ProgramArea = _s.Sanitize(a.ProgramArea) ?? "",
                    AmountAllocated = a.AmountAllocated,
                    AllocationDate = a.AllocationDate ?? allocDate,
                    AllocationNotes = _s.Sanitize(a.AllocationNotes)
                })
                .ToList();

            if (allocs.Count > 0)
            {
                _db.DonationAllocations.AddRange(allocs);
                await _db.SaveChangesAsync();
            }
        }

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

        // Replace allocations (simple, explicit behavior).
        var existing = await _db.DonationAllocations.Where(a => a.DonationId == e.DonationId).ToListAsync();
        if (existing.Count > 0) _db.DonationAllocations.RemoveRange(existing);

        if (dto.Allocations.Count > 0)
        {
            var safehouseIds = dto.Allocations.Select(a => a.SafehouseId).Distinct().ToList();
            var existingSafehouses = await _db.Safehouses.AsNoTracking()
                .Where(s => safehouseIds.Contains(s.SafehouseId))
                .Select(s => s.SafehouseId)
                .ToListAsync();
            var existingSet = existingSafehouses.ToHashSet();
            if (safehouseIds.Any(shId => !existingSet.Contains(shId)))
                return BadRequest(ApiResponse<object>.Fail("One or more allocations reference an invalid safehouse."));

            var allocDate = dto.DonationDate;
            var allocs = dto.Allocations
                .Where(a => a.AmountAllocated > 0)
                .Select(a => new DonationAllocation
                {
                    DonationId = e.DonationId,
                    SafehouseId = a.SafehouseId,
                    ProgramArea = _s.Sanitize(a.ProgramArea) ?? "",
                    AmountAllocated = a.AmountAllocated,
                    AllocationDate = a.AllocationDate ?? allocDate,
                    AllocationNotes = _s.Sanitize(a.AllocationNotes)
                })
                .ToList();

            if (allocs.Count > 0) _db.DonationAllocations.AddRange(allocs);
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null, "Updated"));
    }
}
