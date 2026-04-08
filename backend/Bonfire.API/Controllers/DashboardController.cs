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

        var activeResidentCount = await _db.Residents.CountAsync(r =>
            r.CaseStatus == "Active"
            || r.CaseStatus == "Open"
            || r.CaseStatus == "In Progress"
            || r.CaseStatus == "Enrolled"
            || (r.CaseStatus != "Closed"
                && r.CaseStatus != "Archived"
                && r.CaseStatus != "Discharged"
                && r.CaseStatus != "Inactive"
                && r.CaseStatus != "Completed"));

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
                r.CaseStatus == "Active"
                || r.CaseStatus == "Open"
                || r.CaseStatus == "In Progress"
                || r.CaseStatus == "Enrolled"
                || (r.CaseStatus != "Closed"
                    && r.CaseStatus != "Archived"
                    && r.CaseStatus != "Discharged"
                    && r.CaseStatus != "Inactive"
                    && r.CaseStatus != "Completed"))
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

    [AllowAnonymous]
    [HttpGet("impact")]
    public async Task<ActionResult<ApiResponse<object>>> Impact()
    {
        var latest = await _db.PublicImpactSnapshots.AsNoTracking()
            .Where(s => s.IsPublished)
            .OrderByDescending(s => s.SnapshotDate)
            .FirstOrDefaultAsync();

        var activeResidents = await _db.Residents.CountAsync(r => r.CaseStatus == "Active");
        var totalDonationsYtd = await _db.Donations
            .Where(d => d.DonationDate >= new DateOnly(DateTime.UtcNow.Year, 1, 1))
            .SumAsync(d => d.Amount ?? d.EstimatedValue ?? 0m);

        return Ok(ApiResponse<object>.Ok(new
        {
            latestPublishedSnapshot = latest,
            aggregateMetrics = new
            {
                activeResidents,
                totalDonationsYtd
            }
        }));
    }
}
