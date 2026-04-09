using Bonfire.API.Data;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Models;

public static class MlProxyPayloadMappers
{
    public static async Task<ResidentRiskPredictPayload?> BuildResidentRiskPayloadAsync(
        AppDbContext db,
        int residentId,
        CancellationToken cancellationToken = default)
    {
        var r = await db.Residents.AsNoTracking()
            .FirstOrDefaultAsync(x => x.ResidentId == residentId, cancellationToken);
        if (r == null) return null;

        var allSessions = await db.ProcessRecordings.AsNoTracking()
            .Where(p => p.ResidentId == residentId)
            .OrderByDescending(p => p.SessionDate)
            .ToListAsync(cancellationToken);

        var negativeStates = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Distressed", "Angry", "Anxious", "Sad", "Withdrawn",
        };
        decimal avgEmotional = allSessions.Count == 0
            ? 0.5m
            : (decimal)allSessions.Count(s => !negativeStates.Contains(s.EmotionalStateObserved ?? ""))
              / allSessions.Count;

        var recentIncidents = await db.IncidentReports.CountAsync(
            i => i.ResidentId == residentId && i.IncidentDate >= DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-90)),
            cancellationToken);
        var lastSession = allSessions.FirstOrDefault();
        var daysSinceSession = lastSession == null
            ? 999
            : DateOnly.FromDateTime(DateTime.UtcNow).DayNumber - lastSession.SessionDate.DayNumber;
        var edu = await db.EducationRecords.AsNoTracking()
            .Where(e => e.ResidentId == residentId)
            .OrderByDescending(e => e.RecordDate)
            .Select(e => (decimal?)e.ProgressPercent)
            .FirstOrDefaultAsync(cancellationToken) ?? 0;
        var health = await db.HealthWellbeingRecords.AsNoTracking()
            .Where(h => h.ResidentId == residentId)
            .OrderByDescending(h => h.RecordDate)
            .Select(h => (decimal?)h.GeneralHealthScore)
            .FirstOrDefaultAsync(cancellationToken) ?? 0;
        var openIv = await db.InterventionPlans.CountAsync(
            p => p.ResidentId == residentId && p.Status != "Closed",
            cancellationToken);

        var residentRow = new ResidentRiskMlRow
        {
            ResidentId = residentId,
            CurrentRiskLevel = r.CurrentRiskLevel ?? "",
            RecentIncidentCount = recentIncidents,
            DaysSinceLastSession = daysSinceSession,
            AvgEmotionalStateScore = avgEmotional,
            EducationProgress = edu,
            HealthScore = health,
            OpenInterventionCount = openIv,
        };

        var allIncidents = await db.IncidentReports.AsNoTracking()
            .Where(i => i.ResidentId == residentId)
            .ToListAsync(cancellationToken);
        var incidentRows = allIncidents.Select(i => new ResidentIncidentMlRow
        {
            IncidentId = i.IncidentId,
            ResidentId = i.ResidentId,
            IncidentType = i.IncidentType,
            Severity = i.Severity,
            Resolved = i.Resolved,
            FollowUpRequired = i.FollowUpRequired,
        }).ToList();

        var processRows = allSessions.Select(p => new ResidentProcessMlRow
        {
            RecordingId = p.RecordingId,
            ResidentId = p.ResidentId,
            EmotionalStateObserved = p.EmotionalStateObserved,
            EmotionalStateEnd = p.EmotionalStateEnd,
            ProgressNoted = p.ProgressNoted,
            ConcernsFlagged = p.ConcernsFlagged,
            ReferralMade = p.ReferralMade,
            SessionDurationMinutes = p.SessionDurationMinutes,
        }).ToList();

        var allVisitations = await db.HomeVisitations.AsNoTracking()
            .Where(v => v.ResidentId == residentId)
            .ToListAsync(cancellationToken);
        var visitationRows = allVisitations.Select(v => new ResidentVisitationMlRow
        {
            VisitationId = v.VisitationId,
            ResidentId = v.ResidentId,
            VisitType = v.VisitType,
            VisitOutcome = v.VisitOutcome,
            FamilyCooperationLevel = v.FamilyCooperationLevel,
            SafetyConcernsNoted = v.SafetyConcernsNoted,
            FollowUpNeeded = v.FollowUpNeeded,
        }).ToList();

        return new ResidentRiskPredictPayload
        {
            Residents = [residentRow],
            Incidents = incidentRows.Count > 0 ? incidentRows : null,
            ProcessRecordings = processRows.Count > 0 ? processRows : null,
            Visitations = visitationRows.Count > 0 ? visitationRows : null,
        };
    }

    public static async Task<DonorLapseMlRow?> MapDonorLapseRowAsync(
        AppDbContext db,
        int supporterId,
        CancellationToken cancellationToken = default)
    {
        var s = await db.Supporters.AsNoTracking().FirstOrDefaultAsync(x => x.SupporterId == supporterId, cancellationToken);
        if (s == null) return null;

        var donations = await db.Donations.AsNoTracking()
            .Where(d => d.SupporterId == supporterId)
            .ToListAsync(cancellationToken);
        var last = donations.OrderByDescending(d => d.DonationDate).FirstOrDefault();
        var daysSince = last == null
            ? 999
            : DateOnly.FromDateTime(DateTime.UtcNow).DayNumber - last.DonationDate.DayNumber;

        return new DonorLapseMlRow
        {
            SupporterId = supporterId,
            DaysSinceLastDonation = daysSince,
            DonationCount = donations.Count,
            TotalLifetimeValue = donations.Sum(d => d.Amount ?? d.EstimatedValue ?? 0m),
            IsRecurring = donations.Any(d => d.IsRecurring),
            AcquisitionChannel = s.AcquisitionChannel,
            DonationType = donations.FirstOrDefault()?.DonationType ?? ""
        };
    }

    public static async Task<DonorGivingMapOutcome> MapDonorGivingRowAsync(
        AppDbContext db,
        int supporterId,
        CancellationToken cancellationToken = default)
    {
        var s = await db.Supporters.AsNoTracking().FirstOrDefaultAsync(x => x.SupporterId == supporterId, cancellationToken);
        if (s == null)
            return new DonorGivingMapOutcome { SupporterNotFound = true };

        var donations = await db.Donations.AsNoTracking()
            .Where(d => d.SupporterId == supporterId)
            .OrderBy(d => d.DonationDate)
            .ToListAsync(cancellationToken);

        if (donations.Count == 0)
            return new DonorGivingMapOutcome { InsufficientDonationHistory = true };

        var first = donations[0].DonationDate;
        var last = donations[^1].DonationDate;
        var tenureDays = Math.Max(0, last.DayNumber - first.DayNumber);

        var row = new DonorGivingMlRow
        {
            SupporterId = supporterId,
            SupporterType = s.SupporterType,
            AcquisitionChannel = s.AcquisitionChannel,
            RelationshipType = s.RelationshipType,
            Region = s.Region,
            Country = s.Country,
            NDonations = donations.Count,
            TenureDays = tenureDays,
            FirstDonation = first.ToString("yyyy-MM-dd"),
            LastDonation = last.ToString("yyyy-MM-dd"),
        };

        return new DonorGivingMapOutcome { Row = row };
    }

    public static SocialMediaMlRow? MapSocialMediaRow(SocialMediaPost? p)
    {
        if (p == null) return null;
        return new SocialMediaMlRow
        {
            Platform = p.Platform,
            DayOfWeek = p.DayOfWeek,
            PostHour = p.PostHour,
            PostType = p.PostType,
            MediaType = p.MediaType,
            NumHashtags = p.NumHashtags,
            MentionsCount = p.MentionsCount,
            HasCallToAction = p.HasCallToAction,
            CallToActionType = p.CallToActionType,
            ContentTopic = p.ContentTopic,
            SentimentTone = p.SentimentTone,
            CaptionLength = p.CaptionLength,
            FeaturesResidentStory = p.FeaturesResidentStory,
            CampaignName = p.CampaignName,
            IsBoosted = p.IsBoosted
        };
    }
}
