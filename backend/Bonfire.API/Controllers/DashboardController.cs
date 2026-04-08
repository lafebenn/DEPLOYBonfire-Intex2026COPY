using Bonfire.API.Data;
using Bonfire.API.Infrastructure;
using Bonfire.API.Models;
using Bonfire.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public DashboardController(AppDbContext db)
    {
        _db = db;
    }

    private static List<MlPrediction> LatestPerEntity(IEnumerable<MlPrediction> rows, string type, string entityType)
    {
        return rows
            .Where(p => p.PredictionType == type && p.EntityType == entityType)
            .GroupBy(p => p.EntityId)
            .Select(g => g.OrderByDescending(x => x.PredictedAt).First())
            .ToList();
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("admin")]
    public async Task<ActionResult<ApiResponse<object>>> Admin()
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateOnly(now.Year, now.Month, 1);
        var inactiveStatuses = new[] { "closed", "archived", "discharged", "inactive", "completed" };

        // Treat case status comparisons as case-insensitive (prod data can vary in capitalization).
        var activeResidentCount = await _db.Residents.CountAsync(r =>
            r.CaseStatus != null && !inactiveStatuses.Contains(r.CaseStatus.ToLower()));

        // Avoid loading the entire MlPredictions table (can hang or time out); only rows we need for this dashboard.
        var preds = await _db.MlPredictions.AsNoTracking()
            .Where(p =>
                (p.PredictionType == "ResidentRiskFlag" && p.EntityType == "Resident")
                || (p.PredictionType == "DonorLapseRisk" && p.EntityType == "Supporter"))
            .ToListAsync();
        var residentRiskLatest = LatestPerEntity(preds, "ResidentRiskFlag", "Resident");
        var atRisk = residentRiskLatest.Where(p => p.Score > 0.5m).ToList();
        var atRiskCount = atRisk.Count;

        var monthlyDonationTotal = await _db.Donations
            .Where(d => d.DonationDate >= monthStart)
            .SumAsync(d => d.Amount ?? d.EstimatedValue ?? 0m);

        var lapseLatest = LatestPerEntity(preds, "DonorLapseRisk", "Supporter")
            .Where(p => p.Score > 0.6m)
            .OrderByDescending(p => p.Score)
            .ToList();

        var supporterIds = lapseLatest.Select(p => p.EntityId).ToList();
        var supporters = await _db.Supporters.AsNoTracking()
            .Where(s => supporterIds.Contains(s.SupporterId))
            .ToDictionaryAsync(s => s.SupporterId);

        var donorsAtLapseRisk = lapseLatest.Select(p => new
        {
            supporterId = p.EntityId,
            displayName = supporters.GetValueOrDefault(p.EntityId)?.DisplayName,
            score = p.Score,
            label = p.Label,
            predictedAt = p.PredictedAt
        }).ToList();

        var residentIds = atRisk.Select(p => p.EntityId).ToList();
        var residents = await _db.Residents.AsNoTracking()
            .Where(r => residentIds.Contains(r.ResidentId))
            .ToDictionaryAsync(r => r.ResidentId);

        var residentsAtRisk = atRisk.OrderByDescending(p => p.Score).Select(p => new
        {
            residentId = p.EntityId,
            caseControlNo = residents.GetValueOrDefault(p.EntityId)?.CaseControlNo,
            score = p.Score,
            label = p.Label,
            predictedAt = p.PredictedAt
        }).ToList();

        var safehouseOccupancy = await _db.Safehouses.AsNoTracking()
            .Where(s => s.Status == "Active")
            .OrderBy(s => s.Name)
            .Select(s => new
            {
                s.SafehouseId,
                s.Name,
                s.CurrentOccupancy,
                s.CapacityGirls
            })
            .ToListAsync();

        var recentDonations = await _db.Donations.AsNoTracking()
            .OrderByDescending(d => d.DonationDate)
            .Take(5)
            .Join(_db.Supporters.AsNoTracking(), d => d.SupporterId, sup => sup.SupporterId, (d, sup) => new
            {
                d.DonationId,
                d.Amount,
                d.EstimatedValue,
                d.DonationDate,
                d.DonationType,
                supporterName = sup.DisplayName
            })
            .ToListAsync();

        var today = DateOnly.FromDateTime(now);
        var monthAgo = today.AddDays(-30);

        var activeResidentRows = await _db.Residents.AsNoTracking()
            .Where(r =>
                r.CaseStatus != null && !inactiveStatuses.Contains(r.CaseStatus.ToLower()))
            .Select(r => new ResidentAttentionScoreComputer.ActiveResidentRow
            {
                ResidentId = r.ResidentId,
                CaseControlNo = r.CaseControlNo,
                InternalCode = r.InternalCode,
                CurrentRiskLevel = r.CurrentRiskLevel ?? "",
                SafehouseName = r.Safehouse != null ? r.Safehouse.Name : ""
            })
            .ToListAsync();

        var activeIds = activeResidentRows.Select(r => r.ResidentId).ToList();
        var activeIdSet = activeIds.ToHashSet();

        var mlByResident = LatestPerEntity(preds, "ResidentRiskFlag", "Resident")
            .ToDictionary(p => p.EntityId, p => p.Score);

        List<ProcessRecording> procRows = new();
        List<EducationRecord> eduRows = new();
        List<HealthWellbeingRecord> healthRows = new();
        Dictionary<int, int> incident30 = new();

        if (activeIdSet.Count > 0)
        {
            procRows = await _db.ProcessRecordings.AsNoTracking()
                .Where(p => activeIdSet.Contains(p.ResidentId))
                .ToListAsync();
            eduRows = await _db.EducationRecords.AsNoTracking()
                .Where(e => activeIdSet.Contains(e.ResidentId))
                .ToListAsync();
            healthRows = await _db.HealthWellbeingRecords.AsNoTracking()
                .Where(h => activeIdSet.Contains(h.ResidentId))
                .ToListAsync();
            var incGroups = await _db.IncidentReports.AsNoTracking()
                .Where(i => activeIdSet.Contains(i.ResidentId) && i.IncidentDate >= monthAgo)
                .GroupBy(i => i.ResidentId)
                .Select(g => new { ResidentId = g.Key, Count = g.Count() })
                .ToListAsync();
            incident30 = incGroups.ToDictionary(x => x.ResidentId, x => x.Count);
        }

        var attentionRanked = ResidentAttentionScoreComputer.ComputeForActiveResidents(
            today,
            activeResidentRows,
            procRows,
            eduRows,
            healthRows,
            incident30,
            mlByResident
        );

        var highAttentionResidents = attentionRanked
            .Take(3)
            .Select(a => new
            {
                a.ResidentId,
                a.DisplayName,
                a.CaseControlNo,
                a.InternalCode,
                a.SafehouseName,
                a.CurrentRiskLevel,
                compositeScore = a.CompositeScore,
                flameLevel = a.FlameLevel,
                factors = a.Factors
            })
            .ToList();

        return Ok(ApiResponse<object>.Ok(new
        {
            activeResidentCount,
            atRiskCount,
            monthlyDonationTotal,
            donorsAtLapseRisk,
            residentsAtRisk,
            safehouseOccupancy,
            recentDonations,
            flaggedResidents = residentsAtRisk,
            highAttentionResidents
        }));
    }

    /// <summary>
    /// Aggregated metrics for the Reports &amp; analytics page (single round-trip).
    /// </summary>
    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("reports-metrics")]
    public async Task<ActionResult<ApiResponse<object>>> ReportsMetrics(
        [FromQuery] int monthsBack = 12,
        [FromQuery] int? safehouseId = null)
    {
        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);
        if (monthsBack < 1) monthsBack = 1;
        if (monthsBack > 36) monthsBack = 36;

        var thisMonth = new DateOnly(today.Year, today.Month, 1);
        var fromMonth = thisMonth.AddMonths(-(monthsBack - 1));
        var periodLabel =
            $"Last {monthsBack} month{(monthsBack == 1 ? "" : "s")} (live database as of {today:yyyy-MM-dd} UTC)";

        var residentsQ = _db.Residents.AsNoTracking();
        if (safehouseId != null)
            residentsQ = residentsQ.Where(r => r.SafehouseId == safehouseId.Value);

        var totalResidents = await residentsQ.CountAsync();

        var byStatusList = await residentsQ
            .GroupBy(r => r.CaseStatus)
            .Select(g => new { status = g.Key, count = g.Count() })
            .ToListAsync();
        var byStatus = byStatusList.ToDictionary(x => x.status, x => x.count);

        var byCategoryList = await residentsQ
            .GroupBy(r => string.IsNullOrWhiteSpace(r.CaseCategory) ? "Unspecified" : r.CaseCategory)
            .Select(g => new { program = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        var activeResidentIds = await residentsQ
            .Where(r => r.CaseStatus == "Active")
            .Select(r => r.ResidentId)
            .ToListAsync();

        double? avgProgressActive = null;
        if (activeResidentIds.Count > 0)
        {
            avgProgressActive = await _db.EducationRecords.AsNoTracking()
                .Where(e => activeResidentIds.Contains(e.ResidentId))
                .AverageAsync(e => (double?)e.ProgressPercent);
        }

        double? avgHealthActive = null;
        if (activeResidentIds.Count > 0)
        {
            avgHealthActive = await _db.HealthWellbeingRecords.AsNoTracking()
                .Where(h => activeResidentIds.Contains(h.ResidentId))
                .AverageAsync(h => (double?)h.GeneralHealthScore);
        }

        var transitioningOrCompleted = await residentsQ.CountAsync(r =>
            r.CaseStatus == "Transitioning" || r.CaseStatus == "Completed" || r.CaseStatus == "Closed");

        var visitsQ = _db.HomeVisitations.AsNoTracking()
            .Where(v => v.VisitDate >= fromMonth && v.VisitDate <= today);
        if (safehouseId != null)
            visitsQ = visitsQ.Where(v => v.Resident.SafehouseId == safehouseId.Value);

        var visitsTotal = await visitsQ.CountAsync();
        // INTEX home_visitations does not have a separate status field; completion is best proxied by "follow_up_needed = false".
        var visitsFollowUp = await visitsQ.CountAsync(v => v.FollowUpNeeded);
        var visitsCompleted = await visitsQ.CountAsync(v => !v.FollowUpNeeded);
        double? visitCompletionRate = visitsTotal > 0 ? (double)visitsCompleted / visitsTotal : null;

        var recordingsQ = _db.ProcessRecordings.AsNoTracking()
            .Where(p => p.SessionDate >= fromMonth && p.SessionDate <= today);
        if (safehouseId != null)
            recordingsQ = recordingsQ.Where(p => p.Resident.SafehouseId == safehouseId.Value);

        var totalRecordings = await recordingsQ.CountAsync();
        var uniqueResidentsWithRecording = await recordingsQ.Select(p => p.ResidentId).Distinct().CountAsync();
        var avgRecordingsPerIntake = totalResidents > 0 ? (double)totalRecordings / totalResidents : 0d;

        var donationsQ = _db.Donations.AsNoTracking()
            .Where(d => d.DonationDate >= fromMonth && d.DonationDate <= today);
        var donationCount = await donationsQ.CountAsync();
        var donationTotal = await donationsQ.SumAsync(d => d.Amount ?? d.EstimatedValue ?? 0m);

        var byMonthList = await donationsQ
            .GroupBy(d => new { d.DonationDate.Year, d.DonationDate.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                total = g.Sum(d => d.Amount ?? d.EstimatedValue ?? 0m),
                count = g.Count()
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync();

        var donationsByMonth = byMonthList.Select(x => new
        {
            month = $"{x.Year}-{x.Month:00}",
            total = (double)x.total,
            count = x.count
        }).ToList();

        var donationByType = await donationsQ
            .GroupBy(d => d.DonationType)
            .Select(g => new
            {
                donationType = g.Key,
                count = g.Count(),
                total = (double)g.Sum(d => d.Amount ?? d.EstimatedValue ?? 0m)
            })
            .OrderByDescending(x => x.total)
            .ToListAsync();

        var donationByChannel = await donationsQ
            .GroupBy(d => d.ChannelSource)
            .Select(g => new
            {
                channelSource = g.Key,
                count = g.Count(),
                total = (double)g.Sum(d => d.Amount ?? d.EstimatedValue ?? 0m)
            })
            .OrderByDescending(x => x.total)
            .ToListAsync();

        var donationByCampaign = await donationsQ
            .Where(d => d.CampaignName != null && d.CampaignName != "")
            .GroupBy(d => d.CampaignName!)
            .Select(g => new
            {
                campaignName = g.Key,
                count = g.Count(),
                total = (double)g.Sum(d => d.Amount ?? d.EstimatedValue ?? 0m)
            })
            .OrderByDescending(x => x.total)
            .Take(12)
            .ToListAsync();

        // Allocations grouped by safehouse. Use a left join, but keep the query SQL-translatable:
        // format fallback labels (Safehouse #id) after materialization.
        var allocBySafehouseRaw = await _db.DonationAllocations.AsNoTracking()
            .GroupJoin(
                _db.Safehouses.AsNoTracking(),
                a => a.SafehouseId,
                s => s.SafehouseId,
                (a, sg) => new
                {
                    a.SafehouseId,
                    a.AmountAllocated,
                    SafehouseName = sg.Select(x => x.Name).FirstOrDefault()
                })
            .GroupBy(x => new { x.SafehouseId, x.SafehouseName })
            .Select(g => new
            {
                g.Key.SafehouseId,
                g.Key.SafehouseName,
                count = g.Count(),
                totalAmount = g.Sum(x => x.AmountAllocated)
            })
            .OrderByDescending(x => x.totalAmount)
            .ToListAsync();

        var allocBySafehouse = allocBySafehouseRaw.Select(x => new
        {
            allocation = !string.IsNullOrWhiteSpace(x.SafehouseName) ? x.SafehouseName : $"Safehouse #{x.SafehouseId}",
            x.count,
            x.totalAmount
        }).ToList();

        var plansQ = _db.InterventionPlans.AsNoTracking()
            .Where(p => p.CaseConferenceDate != null && p.CaseConferenceDate >= fromMonth && p.CaseConferenceDate <= today);
        if (safehouseId != null)
            plansQ = plansQ.Where(p => p.Resident.SafehouseId == safehouseId.Value);

        var conferencesCompleted = await plansQ.CountAsync(p => p.CaseConferenceDate != null && p.CaseConferenceDate <= today);
        var conferencesUpcoming = await _db.InterventionPlans.AsNoTracking()
            .Where(p => p.CaseConferenceDate != null && p.CaseConferenceDate > today && p.CaseConferenceDate <= thisMonth)
            .Where(p => safehouseId == null || p.Resident.SafehouseId == safehouseId.Value)
            .CountAsync();

        var reintegrationByStatus = await residentsQ
            .GroupBy(r => string.IsNullOrWhiteSpace(r.ReintegrationStatus) ? "Unspecified" : r.ReintegrationStatus!)
            .Select(g => new { status = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        var reintegrationByType = await residentsQ
            .Where(r => r.ReintegrationType != null && r.ReintegrationType != "")
            .GroupBy(r => r.ReintegrationType!)
            .Select(g => new { type = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        var eduTrendRaw = await _db.EducationRecords.AsNoTracking()
            .Where(e => e.RecordDate >= fromMonth && e.RecordDate <= today)
            .GroupBy(e => new { e.RecordDate.Year, e.RecordDate.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                avgProgress = (double?)g.Average(x => x.ProgressPercent)
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync();

        var eduTrend = eduTrendRaw.Select(x => new
        {
            month = $"{x.Year}-{x.Month:00}",
            x.avgProgress
        }).ToList();

        var healthTrendRaw = await _db.HealthWellbeingRecords.AsNoTracking()
            .Where(h => h.RecordDate >= fromMonth && h.RecordDate <= today)
            .GroupBy(h => new { h.RecordDate.Year, h.RecordDate.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                avgHealth = (double?)g.Average(x => x.GeneralHealthScore)
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync();

        var healthTrend = healthTrendRaw.Select(x => new
        {
            month = $"{x.Year}-{x.Month:00}",
            x.avgHealth
        }).ToList();

        var safehouseMonthly = await _db.SafehouseMonthlyMetrics.AsNoTracking()
            .Where(m => m.MonthStart >= fromMonth && m.MonthStart <= thisMonth && (safehouseId == null || m.SafehouseId == safehouseId.Value))
            .OrderByDescending(m => m.MonthStart)
            .ThenBy(m => m.Safehouse.Name)
            .Select(m => new
            {
                safehouseId = m.SafehouseId,
                safehouseName = m.Safehouse.Name,
                month = $"{m.MonthStart.Year}-{m.MonthStart.Month:00}",
                activeResidents = m.ActiveResidents,
                avgEducationProgress = (double)m.AvgEducationProgress,
                avgHealthScore = (double)m.AvgHealthScore,
                processRecordingCount = m.ProcessRecordingCount,
                homeVisitationCount = m.HomeVisitationCount,
                incidentCount = m.IncidentCount
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(new
        {
            generatedAtUtc = now.ToUniversalTime(),
            periodLabel,
            dataSource = "database",
            monthsBack,
            safehouseId,
            totalResidents,
            byStatus,
            byProgram = byCategoryList,
            avgProgressActive,
            avgHealthActive,
            transitioningOrCompleted,
            visitsTotal,
            visitsCompleted,
            visitsScheduled = visitsFollowUp,
            visitCompletionRate,
            totalRecordings,
            uniqueResidentsWithRecording,
            avgRecordingsPerIntake,
            donationCount,
            donationTotal = (double)donationTotal,
            byAllocation = allocBySafehouse,
            donationsByMonth,
            donationByType,
            donationByChannel,
            donationByCampaign,
            conferencesCompleted,
            conferencesUpcoming,
            reintegrationByStatus,
            reintegrationByType,
            educationProgressByMonth = eduTrend,
            healthScoreByMonth = healthTrend,
            safehouseMonthly
        }));
    }

    [AllowAnonymous]
    [HttpGet("impact")]
    public async Task<ActionResult<ApiResponse<object>>> Impact()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var ytdStart = new DateOnly(today.Year, 1, 1);

        var latest = await _db.PublicImpactSnapshots.AsNoTracking()
            .Where(s => s.IsPublished)
            .OrderByDescending(s => s.SnapshotDate)
            .FirstOrDefaultAsync();

        var activeResidents = await _db.Residents.CountAsync(r => r.CaseStatus == "Active");
        var residentsServedTotal = await _db.Residents.CountAsync();
        var supportersTotal = await _db.Supporters.CountAsync();

        var counselingSessionsYtd = await _db.ProcessRecordings.CountAsync(p => p.SessionDate >= ytdStart);
        var homeVisitsYtd = await _db.HomeVisitations.CountAsync(v => v.VisitDate >= ytdStart);

        return Ok(ApiResponse<object>.Ok(new
        {
            latestPublishedSnapshot = latest,
            aggregateMetrics = new
            {
                activeResidents,
                residentsServedTotal,
                supportersTotal,
                counselingSessionsYtd,
                homeVisitsYtd
            }
        }));
    }
}
