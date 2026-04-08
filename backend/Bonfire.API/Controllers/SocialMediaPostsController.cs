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
[Route("api/social-media-posts")]
public class SocialMediaPostsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly SanitizerService _s;

    public SocialMediaPostsController(AppDbContext db, SanitizerService s)
    {
        _db = db;
        _s = s;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> List(
        [FromQuery] string? platform,
        [FromQuery] string? postType,
        [FromQuery] string? campaignName,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo)
    {
        var q = _db.SocialMediaPosts.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(platform)) q = q.Where(p => p.Platform == platform);
        if (!string.IsNullOrWhiteSpace(postType)) q = q.Where(p => p.PostType == postType);
        if (!string.IsNullOrWhiteSpace(campaignName)) q = q.Where(p => p.CampaignName == campaignName);
        if (dateFrom.HasValue) q = q.Where(p => p.CreatedAt >= dateFrom.Value);
        if (dateTo.HasValue) q = q.Where(p => p.CreatedAt <= dateTo.Value);
        return Ok(ApiResponse<object>.Ok(await q.OrderByDescending(p => p.CreatedAt).ToListAsync()));
    }

    [HttpGet("analytics")]
    public async Task<ActionResult<ApiResponse<object>>> Analytics([FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
    {
        var now = DateTime.UtcNow;
        var to = dateTo ?? now;
        var from = dateFrom ?? to.AddDays(-30);
        if (from > to)
        {
            var tmp = from;
            from = to;
            to = tmp;
        }

        // Previous period of equal length (used for simple deltas / insights).
        var spanDays = Math.Max(1, (to - from).TotalDays);
        var prevTo = from;
        var prevFrom = from.AddDays(-spanDays);

        var q = _db.SocialMediaPosts.AsNoTracking()
            .Where(p => p.CreatedAt >= from && p.CreatedAt <= to);

        var qPrev = _db.SocialMediaPosts.AsNoTracking()
            .Where(p => p.CreatedAt >= prevFrom && p.CreatedAt <= prevTo);

        // Use sums over reach for more stable engagement than averaging percent fields.
        var totals = await q.GroupBy(_ => 1).Select(g => new
        {
            posts = g.Count(),
            reach = g.Sum(x => (long)x.Reach),
            impressions = g.Sum(x => (long)x.Impressions),
            likes = g.Sum(x => (long)x.Likes),
            comments = g.Sum(x => (long)x.Comments),
            shares = g.Sum(x => (long)x.Shares),
            saves = g.Sum(x => (long)x.Saves),
            clickThroughs = g.Sum(x => (long)x.ClickThroughs),
            donationReferrals = g.Sum(x => (long)x.DonationReferrals),
            estimatedDonationPhp = g.Sum(x => x.EstimatedDonationValuePhp)
        }).FirstOrDefaultAsync();

        var prevTotals = await qPrev.GroupBy(_ => 1).Select(g => new
        {
            posts = g.Count(),
            reach = g.Sum(x => (long)x.Reach),
            likes = g.Sum(x => (long)x.Likes),
            comments = g.Sum(x => (long)x.Comments),
            shares = g.Sum(x => (long)x.Shares),
            saves = g.Sum(x => (long)x.Saves),
            donationReferrals = g.Sum(x => (long)x.DonationReferrals),
            estimatedDonationPhp = g.Sum(x => x.EstimatedDonationValuePhp)
        }).FirstOrDefaultAsync();

        long reach = totals?.reach ?? 0;
        long interactions = (totals?.likes ?? 0) + (totals?.comments ?? 0) + (totals?.shares ?? 0) + (totals?.saves ?? 0);
        var avgEngagementRate = reach > 0 ? (decimal)interactions / reach : 0m;

        var postsPerWeek = totals?.posts > 0
            ? Math.Round((decimal)totals!.posts / (decimal)(spanDays / 7.0), 1)
            : 0m;

        var platforms = await q
            .GroupBy(p => p.Platform)
            .Select(g => new
            {
                platform = g.Key,
                reach = g.Sum(x => (long)x.Reach),
                interactions = g.Sum(x => (long)x.Likes) + g.Sum(x => (long)x.Comments) + g.Sum(x => (long)x.Shares) + g.Sum(x => (long)x.Saves),
                donationReferrals = g.Sum(x => (long)x.DonationReferrals),
                estimatedDonationPhp = g.Sum(x => x.EstimatedDonationValuePhp)
            })
            .OrderByDescending(x => x.estimatedDonationPhp)
            .ToListAsync();

        var platformSummary = platforms.Select(p => new
        {
            p.platform,
            p.reach,
            avgEngagementRate = p.reach > 0 ? (decimal)p.interactions / p.reach : 0m,
            donationReferrals = p.donationReferrals,
            estimatedDonationPhp = p.estimatedDonationPhp
        }).ToList();

        var contentTypes = await q
            .GroupBy(p => p.PostType)
            .Select(g => new
            {
                postType = g.Key,
                posts = g.Count(),
                avgLikes = g.Average(x => (double)x.Likes),
                donationReferrals = g.Sum(x => (long)x.DonationReferrals),
                estimatedDonationPhp = g.Sum(x => x.EstimatedDonationValuePhp),
                reach = g.Sum(x => (long)x.Reach)
            })
            .OrderByDescending(x => x.estimatedDonationPhp)
            .ToListAsync();

        var bestDays = await q
            .GroupBy(p => p.DayOfWeek)
            .Select(g => new
            {
                day = g.Key,
                reach = g.Sum(x => (long)x.Reach),
                interactions = g.Sum(x => (long)x.Likes) + g.Sum(x => (long)x.Comments) + g.Sum(x => (long)x.Shares) + g.Sum(x => (long)x.Saves),
                donationReferrals = g.Sum(x => (long)x.DonationReferrals)
            })
            .ToListAsync();

        var bestHours = await q
            .GroupBy(p => p.PostHour)
            .Select(g => new
            {
                hour = g.Key,
                reach = g.Sum(x => (long)x.Reach),
                interactions = g.Sum(x => (long)x.Likes) + g.Sum(x => (long)x.Comments) + g.Sum(x => (long)x.Shares) + g.Sum(x => (long)x.Saves),
                donationReferrals = g.Sum(x => (long)x.DonationReferrals)
            })
            .ToListAsync();

        // Composite score: blend normalized reach + engagement + donation referrals.
        // Kept simple and deterministic for now; ML can replace this later.
        decimal scoreDayMax = 1m;
        var dayScores = bestDays.Select(d =>
        {
            var er = d.reach > 0 ? (decimal)d.interactions / d.reach : 0m;
            var score = (decimal)d.reach + (er * 1000m) + (decimal)d.donationReferrals * 500m;
            if (score > scoreDayMax) scoreDayMax = score;
            return new { d.day, score };
        }).ToList();

        decimal scoreHourMax = 1m;
        var hourScores = bestHours.Select(h =>
        {
            var er = h.reach > 0 ? (decimal)h.interactions / h.reach : 0m;
            var score = (decimal)h.reach + (er * 1000m) + (decimal)h.donationReferrals * 500m;
            if (score > scoreHourMax) scoreHourMax = score;
            return new { h.hour, score };
        }).ToList();

        var topPosts = await q
            .OrderByDescending(p => p.EstimatedDonationValuePhp)
            .ThenByDescending(p => p.DonationReferrals)
            .ThenByDescending(p => p.Reach)
            .Take(10)
            .Select(p => new
            {
                p.PostId,
                p.Platform,
                p.PostType,
                p.PostUrl,
                p.CreatedAt,
                p.Reach,
                p.Likes,
                p.Comments,
                p.Shares,
                p.Saves,
                p.ClickThroughs,
                p.DonationReferrals,
                p.EstimatedDonationValuePhp,
                p.HasCallToAction,
                p.CallToActionType,
                p.IsBoosted,
                p.BoostBudgetPhp
            })
            .ToListAsync();

        var topPlatform = platformSummary.FirstOrDefault()?.platform ?? "";

        // Actionable insights (simple heuristics, not ML).
        var insights = new List<string>();
        if (totals?.posts > 0)
        {
            if (!string.IsNullOrWhiteSpace(topPlatform))
                insights.Add($"Double down on **{topPlatform}**: it produced the highest estimated donation value in this period.");

            var cta = await q.CountAsync(p => p.HasCallToAction);
            var ctaPct = totals.posts > 0 ? (decimal)cta / totals.posts : 0m;
            if (ctaPct < 0.35m)
                insights.Add("Add a clear **call-to-action** more often (Donate / Volunteer / Share). Many posts are missing one.");

            var boosted = await q.CountAsync(p => p.IsBoosted);
            if (boosted == 0)
                insights.Add("No boosted posts detected. If budget allows, test a small boost on your top-performing content type.");

            if (platformSummary.Count > 1)
            {
                var byRef = platformSummary.OrderByDescending(p => p.donationReferrals).FirstOrDefault();
                if (byRef != null && byRef.donationReferrals > 0)
                    insights.Add($"For raw donation referrals, **{byRef.platform}** led with {byRef.donationReferrals} referrals.");
            }
        }
        else
        {
            insights.Add("No posts found in this date range. Add/import posts to unlock insights.");
        }

        var response = new
        {
            period = new
            {
                dateFrom = from,
                dateTo = to,
                previousFrom = prevFrom,
                previousTo = prevTo
            },
            kpis = new
            {
                socialAttributedDonationsPhp = totals?.estimatedDonationPhp ?? 0m,
                avgEngagementRate,
                reach = reach,
                totalPosts = totals?.posts ?? 0,
                postsPerWeek
            },
            platformSummary,
            contentTypes = contentTypes.Select(c => new
            {
                c.postType,
                c.posts,
                avgLikes = Math.Round(c.avgLikes, 0),
                donationReferrals = c.donationReferrals,
                estimatedDonationPhp = c.estimatedDonationPhp,
                c.reach
            }),
            bestDays = dayScores.Select(d => new { d.day, score = scoreDayMax > 0 ? (double)(d.score / scoreDayMax) : 0.0 }),
            bestHours = hourScores.Select(h => new { hour = h.hour, score = scoreHourMax > 0 ? (double)(h.score / scoreHourMax) : 0.0 }),
            topPosts,
            insights,
            ml = new
            {
                placeholder = true,
                message = "ML recommendations will appear here after the pipeline is enabled."
            },
            deltas = new
            {
                donationsPhp = (totals?.estimatedDonationPhp ?? 0m) - (prevTotals?.estimatedDonationPhp ?? 0m),
                referrals = (totals?.donationReferrals ?? 0) - (prevTotals?.donationReferrals ?? 0),
                reach = (totals?.reach ?? 0) - (prevTotals?.reach ?? 0)
            }
        };

        return Ok(ApiResponse<object>.Ok(response));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> Get(int id)
    {
        var p = await _db.SocialMediaPosts.AsNoTracking().FirstOrDefaultAsync(x => x.PostId == id);
        if (p == null) return NotFound(ApiResponse<object>.Fail("Not found"));
        return Ok(ApiResponse<object>.Ok(p));
    }

    public class SocialPostWriteDto
    {
        public string Platform { get; set; } = string.Empty;
        public string PlatformPostId { get; set; } = string.Empty;
        public string PostUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string DayOfWeek { get; set; } = string.Empty;
        public int PostHour { get; set; }
        public string PostType { get; set; } = string.Empty;
        public string MediaType { get; set; } = string.Empty;
        public string Caption { get; set; } = string.Empty;
        public string Hashtags { get; set; } = string.Empty;
        public int NumHashtags { get; set; }
        public int MentionsCount { get; set; }
        public bool HasCallToAction { get; set; }
        public string? CallToActionType { get; set; }
        public string ContentTopic { get; set; } = string.Empty;
        public string SentimentTone { get; set; } = string.Empty;
        public int CaptionLength { get; set; }
        public bool FeaturesResidentStory { get; set; }
        public string? CampaignName { get; set; }
        public bool IsBoosted { get; set; }
        public decimal? BoostBudgetPhp { get; set; }
        public int Impressions { get; set; }
        public int Reach { get; set; }
        public int Likes { get; set; }
        public int Comments { get; set; }
        public int Shares { get; set; }
        public int Saves { get; set; }
        public int ClickThroughs { get; set; }
        public int? VideoViews { get; set; }
        public decimal EngagementRate { get; set; }
        public int ProfileVisits { get; set; }
        public int DonationReferrals { get; set; }
        public decimal EstimatedDonationValuePhp { get; set; }
        public int FollowerCountAtPost { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] SocialPostWriteDto dto)
    {
        var e = new SocialMediaPost
        {
            Platform = _s.Sanitize(dto.Platform) ?? "",
            PlatformPostId = _s.Sanitize(dto.PlatformPostId) ?? "",
            PostUrl = _s.Sanitize(dto.PostUrl) ?? "",
            CreatedAt = dto.CreatedAt.Kind == DateTimeKind.Utc ? dto.CreatedAt : DateTime.SpecifyKind(dto.CreatedAt, DateTimeKind.Utc),
            DayOfWeek = _s.Sanitize(dto.DayOfWeek) ?? "",
            PostHour = dto.PostHour,
            PostType = _s.Sanitize(dto.PostType) ?? "",
            MediaType = _s.Sanitize(dto.MediaType) ?? "",
            Caption = _s.Sanitize(dto.Caption) ?? "",
            Hashtags = _s.Sanitize(dto.Hashtags) ?? "",
            NumHashtags = dto.NumHashtags,
            MentionsCount = dto.MentionsCount,
            HasCallToAction = dto.HasCallToAction,
            CallToActionType = _s.Sanitize(dto.CallToActionType),
            ContentTopic = _s.Sanitize(dto.ContentTopic) ?? "",
            SentimentTone = _s.Sanitize(dto.SentimentTone) ?? "",
            CaptionLength = dto.CaptionLength,
            FeaturesResidentStory = dto.FeaturesResidentStory,
            CampaignName = _s.Sanitize(dto.CampaignName),
            IsBoosted = dto.IsBoosted,
            BoostBudgetPhp = dto.BoostBudgetPhp,
            Impressions = dto.Impressions,
            Reach = dto.Reach,
            Likes = dto.Likes,
            Comments = dto.Comments,
            Shares = dto.Shares,
            Saves = dto.Saves,
            ClickThroughs = dto.ClickThroughs,
            VideoViews = dto.VideoViews,
            EngagementRate = dto.EngagementRate,
            ProfileVisits = dto.ProfileVisits,
            DonationReferrals = dto.DonationReferrals,
            EstimatedDonationValuePhp = dto.EstimatedDonationValuePhp,
            FollowerCountAtPost = dto.FollowerCountAtPost
        };
        _db.SocialMediaPosts.Add(e);
        await _db.SaveChangesAsync();
        return StatusCode(201, ApiResponse<object>.Ok(new { id = e.PostId }));
    }
}
