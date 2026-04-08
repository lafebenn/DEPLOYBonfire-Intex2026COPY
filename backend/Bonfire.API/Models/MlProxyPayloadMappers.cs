using Bonfire.API.Data;
using Microsoft.EntityFrameworkCore;

namespace Bonfire.API.Models;

public static class MlProxyPayloadMappers
{
    public static async Task<ResidentRiskMlRow?> MapResidentRiskRowAsync(
        AppDbContext db,
        int residentId,
        CancellationToken cancellationToken = default)
    {
        var r = await db.Residents.AsNoTracking().FirstOrDefaultAsync(x => x.ResidentId == residentId, cancellationToken);
        if (r == null) return null;

        var recentIncidents = await db.IncidentReports.CountAsync(
            i => i.ResidentId == residentId && i.IncidentDate >= DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-90)),
            cancellationToken);
        var lastSession = await db.ProcessRecordings.AsNoTracking()
            .Where(p => p.ResidentId == residentId)
            .OrderByDescending(p => p.SessionDate)
            .Select(p => (DateOnly?)p.SessionDate)
            .FirstOrDefaultAsync(cancellationToken);
        var daysSinceSession = lastSession == null
            ? 999
            : DateOnly.FromDateTime(DateTime.UtcNow).DayNumber - lastSession.Value.DayNumber;
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

        return new ResidentRiskMlRow
        {
            ResidentId = residentId,
            CurrentRiskLevel = r.CurrentRiskLevel,
            RecentIncidentCount = recentIncidents,
            DaysSinceLastSession = daysSinceSession,
            AvgEmotionalStateScore = 0.5m,
            EducationProgress = edu,
            HealthScore = health,
            OpenInterventionCount = openIv
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

    public static async Task<DonorGivingMlRow?> MapDonorGivingRowAsync(
        AppDbContext db,
        int supporterId,
        CancellationToken cancellationToken = default)
    {
        var s = await db.Supporters.AsNoTracking().FirstOrDefaultAsync(x => x.SupporterId == supporterId, cancellationToken);
        if (s == null) return null;

        // TODO: Align with Python API preprocessing for engineered features (e.g. patsy / one-hot expansions).
        return new DonorGivingMlRow
        {
            SupporterId = supporterId,
            SupporterType = s.SupporterType,
            AcquisitionChannel = s.AcquisitionChannel,
            Region = s.Region,
            Country = s.Country
        };
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
