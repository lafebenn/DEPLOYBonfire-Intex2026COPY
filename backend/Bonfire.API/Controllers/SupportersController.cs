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
    private readonly MlService _ml;

    public SupportersController(AppDbContext db, SanitizerService s, MlService ml)
    {
        _db = db;
        _s = s;
        _ml = ml;
    }

    private int? LinkedSupporterId()
    {
        var v = User.Claims.FirstOrDefault(c => c.Type == "linkedSupporterId")?.Value;
        return int.TryParse(v, out var id) ? id : null;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
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

        var supporters = await q.OrderBy(s => s.DisplayName).ToListAsync();
        var supporterIds = supporters.Select(s => s.SupporterId).ToList();

        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);
        var twelveMonthsAgo = today.AddMonths(-12);
        // Rolling 12 months (inclusive of gifts from twelveMonthsAgo through today).
        var last12Total = await _db.Donations.AsNoTracking()
            .Where(d => d.DonationDate >= twelveMonthsAgo && d.DonationDate <= today)
            .SumAsync(d => d.Amount ?? d.EstimatedValue ?? 0m);
        var avgMonthlyLast12 = last12Total / 12m;

        var donationAgg = new Dictionary<int, DonationAgg>();
        if (supporterIds.Count > 0)
        {
            var rows = await _db.Donations.AsNoTracking()
                .Where(d => supporterIds.Contains(d.SupporterId))
                .Select(d => new
                {
                    d.SupporterId,
                    d.DonationDate,
                    d.Amount,
                    d.EstimatedValue
                })
                .ToListAsync();

            foreach (var d in rows)
            {
                var value = d.Amount ?? d.EstimatedValue;
                if (!donationAgg.TryGetValue(d.SupporterId, out var agg))
                {
                    donationAgg[d.SupporterId] = new DonationAgg
                    {
                        Count = 1,
                        Total = value ?? 0m,
                        NewestDate = d.DonationDate,
                        LatestAmount = value
                    };
                    continue;
                }

                agg.Count++;
                agg.Total += value ?? 0m;
                if (d.DonationDate > agg.NewestDate)
                {
                    agg.NewestDate = d.DonationDate;
                    agg.LatestAmount = value;
                }
            }
        }

        var listRows = supporters.Select(s =>
        {
            donationAgg.TryGetValue(s.SupporterId, out var agg);
            return new SupporterListRowDto
            {
                SupporterId = s.SupporterId,
                DisplayName = s.DisplayName,
                SupporterType = s.SupporterType,
                Status = s.Status,
                Country = s.Country,
                FirstDonationDate = s.FirstDonationDate,
                AcquisitionChannel = s.AcquisitionChannel,
                DonationCount = agg?.Count ?? 0,
                TotalLifetimeValue = agg?.Total ?? 0m,
                LastDonationDate = agg != null ? agg.NewestDate : null,
                LatestAmount = agg?.LatestAmount
            };
        }).ToList();

        return Ok(ApiResponse<object>.Ok(new
        {
            supporters = listRows,
            summary = new SupporterListSummaryDto
            {
                Last12MonthsDonationTotal = last12Total,
                AvgMonthlyLast12 = avgMonthlyLast12
            }
        }));
    }

    [HttpGet("priority-targets")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<object>>> PriorityTargets([FromQuery] int limit = 15)
    {
        limit = Math.Clamp(limit, 1, 50);

        var onlyTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "MonetaryDonor",
            "InKindDonor",
            "Volunteer",
            "SkillsContributor",
            "SocialMediaAdvocate"
        };

        var cutoff = DateTime.UtcNow.AddHours(-6);
        var cached = await _db.MlPredictions.AsNoTracking()
            .Where(p =>
                p.PredictionType == "DonorLapseRisk" &&
                p.EntityType == "Supporter" &&
                (!p.ExpiresAt.HasValue || p.ExpiresAt > cutoff))
            .GroupBy(p => p.EntityId)
            .Select(g => g.OrderByDescending(x => x.PredictedAt).First())
            .ToListAsync();

        var cachedBySupporterId = cached.ToDictionary(x => x.EntityId, x => x);

        var supporters = await _db.Supporters.AsNoTracking()
            .Where(s => s.Status == "Active" && onlyTypes.Contains(s.SupporterType))
            .OrderBy(s => s.DisplayName)
            .Select(s => new
            {
                s.SupporterId,
                s.DisplayName,
                s.Email,
                s.SupporterType,
                s.AcquisitionChannel
            })
            .Take(400)
            .ToListAsync();

        var supporterIds = supporters.Select(s => s.SupporterId).ToList();

        var donationStats = await _db.Donations.AsNoTracking()
            .Where(d => supporterIds.Contains(d.SupporterId))
            .GroupBy(d => d.SupporterId)
            .Select(g => new
            {
                SupporterId = g.Key,
                DonationCount = g.Count(),
                TotalLifetimeValue = g.Sum(x => x.Amount ?? x.EstimatedValue ?? 0m),
                LastDonationDate = g.Max(x => (DateOnly?)x.DonationDate)
            })
            .ToListAsync();

        var statsById = donationStats.ToDictionary(x => x.SupporterId, x => x);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var results = new List<PriorityTargetDto>(supporters.Count);
        foreach (var s in supporters)
        {
            var score = cachedBySupporterId.TryGetValue(s.SupporterId, out var p)
                ? p.Score
                : await _ml.GetDonorLapseRiskAsync(s.SupporterId);
            statsById.TryGetValue(s.SupporterId, out var st);
            var daysSinceLast = st?.LastDonationDate == null ? (int?)null : (today.DayNumber - st.LastDonationDate.Value.DayNumber);

            results.Add(new PriorityTargetDto
            {
                SupporterId = s.SupporterId,
                DisplayName = s.DisplayName,
                Email = s.Email,
                SupporterType = s.SupporterType,
                AcquisitionChannel = s.AcquisitionChannel,
                LapseRiskScore = score,
                RiskTier = ToRiskTier(score),
                DonationCount = st?.DonationCount ?? 0,
                TotalLifetimeValue = st?.TotalLifetimeValue ?? 0m,
                LastDonationDate = st?.LastDonationDate,
                DaysSinceLastDonation = daysSinceLast
            });
        }

        var ordered = results
            .OrderByDescending(x => x.LapseRiskScore)
            .ThenByDescending(x => x.TotalLifetimeValue)
            .Take(limit)
            .ToList();

        return Ok(ApiResponse<object>.Ok(ordered));
    }

    private sealed class DonationAgg
    {
        public int Count;
        public decimal Total;
        public DateOnly NewestDate;
        public decimal? LatestAmount;
    }

    public sealed class SupporterListSummaryDto
    {
        public decimal Last12MonthsDonationTotal { get; set; }
        public decimal AvgMonthlyLast12 { get; set; }
    }

    public sealed class SupporterListRowDto
    {
        public int SupporterId { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string SupporterType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public DateOnly? FirstDonationDate { get; set; }
        public string AcquisitionChannel { get; set; } = string.Empty;
        public int DonationCount { get; set; }
        public decimal TotalLifetimeValue { get; set; }
        public DateOnly? LastDonationDate { get; set; }
        public decimal? LatestAmount { get; set; }
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

    public sealed class PriorityTargetDto
    {
        public int SupporterId { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string SupporterType { get; set; } = string.Empty;
        public string AcquisitionChannel { get; set; } = string.Empty;
        public decimal LapseRiskScore { get; set; }
        public string RiskTier { get; set; } = string.Empty;
        public int DonationCount { get; set; }
        public decimal TotalLifetimeValue { get; set; }
        public DateOnly? LastDonationDate { get; set; }
        public int? DaysSinceLastDonation { get; set; }
    }

    private static string ToRiskTier(decimal score)
    {
        if (score >= 0.70m) return "High";
        if (score >= 0.40m) return "Medium";
        return "Low";
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
