/**
 * Demo aggregates for Social Media Insights (INTEX).
 * Shaped like `social_media_posts` + rollups - replace with API when wired to DB.
 */

export type PlatformRow = {
  platform: string;
  posts: number;
  reach: number;
  avgEngagementRate: number;
  donationReferrals: number;
  estimatedDonationPhp: number;
};

export type ContentTypeRow = {
  postType: string;
  label: string;
  posts: number;
  avgLikes: number;
  avgEngagementRate: number;
  donationReferrals: number;
  notes: string;
};

export type DayPart = { day: string; score: number };
export type HourPart = { hour: number; label: string; score: number };

export const MOCK_SOCIAL_KPIS = {
  periodLabel: "Last 90 days (demo)",
  totalPosts: 186,
  reach: 428_000,
  socialAttributedDonationsPhp: 312_400,
  avgEngagementRate: 0.041,
  postsPerWeek: 14,
  topPlatform: "Instagram",
};

export const MOCK_PLATFORM_SUMMARY: PlatformRow[] = [
  {
    platform: "Instagram",
    posts: 72,
    reach: 198_000,
    avgEngagementRate: 0.048,
    donationReferrals: 38,
    estimatedDonationPhp: 142_600,
  },
  {
    platform: "Facebook",
    posts: 54,
    reach: 121_000,
    avgEngagementRate: 0.035,
    donationReferrals: 22,
    estimatedDonationPhp: 89_200,
  },
  {
    platform: "TikTok",
    posts: 41,
    reach: 76_000,
    avgEngagementRate: 0.062,
    donationReferrals: 9,
    estimatedDonationPhp: 38_100,
  },
  {
    platform: "YouTube",
    posts: 11,
    reach: 22_000,
    avgEngagementRate: 0.028,
    donationReferrals: 6,
    estimatedDonationPhp: 31_500,
  },
  {
    platform: "WhatsApp",
    posts: 8,
    reach: 11_000,
    avgEngagementRate: 0.091,
    donationReferrals: 14,
    estimatedDonationPhp: 11_000,
  },
];

export const MOCK_CONTENT_TYPES: ContentTypeRow[] = [
  {
    postType: "FundraisingAppeal",
    label: "Fundraising appeal",
    posts: 28,
    avgLikes: 420,
    avgEngagementRate: 0.038,
    donationReferrals: 52,
    notes: "Fewer posts but strongest donation linkage. Prioritize during campaigns.",
  },
  {
    postType: "ImpactStory",
    label: "Impact story",
    posts: 44,
    avgLikes: 890,
    avgEngagementRate: 0.055,
    donationReferrals: 31,
    notes: "High reach and likes; pair with clear donate CTA to convert attention.",
  },
  {
    postType: "EducationalContent",
    label: "Educational content",
    posts: 36,
    avgLikes: 310,
    avgEngagementRate: 0.029,
    donationReferrals: 8,
    notes: "Builds trust over time; use in nurture sequences, not as sole ask.",
  },
  {
    postType: "ThankYou",
    label: "Thank-you / gratitude",
    posts: 22,
    avgLikes: 650,
    avgEngagementRate: 0.051,
    donationReferrals: 12,
    notes: "Great for retention; reinforce with impact metrics in captions.",
  },
  {
    postType: "Campaign",
    label: "Campaign / event",
    posts: 19,
    avgLikes: 510,
    avgEngagementRate: 0.044,
    donationReferrals: 18,
    notes: "Time-boxed spikes; schedule supporting posts before and after peak days.",
  },
];

export const MOCK_BEST_DAYS: DayPart[] = [
  { day: "Sunday", score: 0.72 },
  { day: "Monday", score: 0.45 },
  { day: "Tuesday", score: 0.58 },
  { day: "Wednesday", score: 0.55 },
  { day: "Thursday", score: 0.68 },
  { day: "Friday", score: 0.52 },
  { day: "Saturday", score: 0.61 },
];

export const MOCK_BEST_HOURS: HourPart[] = [
  { hour: 7, label: "7a", score: 0.42 },
  { hour: 9, label: "9a", score: 0.58 },
  { hour: 12, label: "12p", score: 0.55 },
  { hour: 15, label: "3p", score: 0.48 },
  { hour: 18, label: "6p", score: 0.78 },
  { hour: 20, label: "8p", score: 0.85 },
  { hour: 21, label: "9p", score: 0.72 },
];

export const MOCK_STRATEGY_RECOMMENDATIONS: string[] = [
  "Weight **fundraising appeals** and **campaign** posts around predictable windows (evenings, Thu-Sun) rather than spreading thin.",
  "Treat **TikTok** as awareness: high engagement does not always mean donations. Add trackable links and test CTAs.",
  "**WhatsApp** forwards show strong conversion in this demo. Consider a light monthly “insider update” with consent.",
  "Compare **likes vs. donation referrals** per post type weekly; rotate away from formats that only inflate vanity metrics.",
  "Post **consistently** (target 12-16 posts/week) but batch-create content in themed weeks to reduce founder burnout.",
];
