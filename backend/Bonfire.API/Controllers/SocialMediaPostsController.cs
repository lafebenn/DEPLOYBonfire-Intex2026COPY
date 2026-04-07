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
