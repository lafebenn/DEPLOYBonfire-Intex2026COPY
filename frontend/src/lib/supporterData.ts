import { localData, type Donation } from "@/lib/localData";

export type SupporterStatus = "Active" | "Inactive";

export type SupporterProfile = {
  profileId: string;
  name: string;
  supporterType: string;
  status: SupporterStatus;
  email?: string;
  phone?: string;
  region?: string;
  acquisitionChannel?: string;
  /** First year of giving (display) */
  memberSinceYear: string;
  notes?: string;
};

export type ContributionLine = {
  id: string;
  profileId: string;
  date: string;
  donationType: string;
  amount: string;
  allocation: string;
  source: "demo" | "recorded";
};

export type SupporterTableRow = {
  profileId: string;
  name: string;
  type: string;
  amount: string;
  total: string;
  allocation: string;
  since: string;
};

const DEMO_PROFILES: SupporterProfile[] = [
  {
    profileId: "sup-1",
    name: "Sarah Kingsley",
    supporterType: "Monetary donor",
    status: "Active",
    email: "s.kingsley@email.com",
    phone: "+1 (555) 010-2001",
    region: "North America",
    acquisitionChannel: "Church partner",
    memberSinceYear: "2022",
    notes: "Monthly sustainer; prefers impact letters quarterly.",
  },
  {
    profileId: "sup-2",
    name: "Robert Chen",
    supporterType: "Monetary donor",
    status: "Active",
    email: "r.chen@email.com",
    region: "Asia-Pacific",
    acquisitionChannel: "Website",
    memberSinceYear: "2021",
  },
  {
    profileId: "sup-3",
    name: "Grace Foundation",
    supporterType: "Grant / organization",
    status: "Active",
    email: "grants@gracefoundation.org",
    phone: "+1 (555) 010-3300",
    region: "International",
    acquisitionChannel: "Partner referral",
    memberSinceYear: "2020",
    notes: "Restricted grants for housing capital when flagged.",
  },
  {
    profileId: "sup-4",
    name: "Michael Torres",
    supporterType: "Volunteer & donor",
    status: "Active",
    email: "m.torres@email.com",
    region: "Local",
    acquisitionChannel: "Event",
    memberSinceYear: "2023",
  },
  {
    profileId: "sup-5",
    name: "Amara Johnson",
    supporterType: "Monetary donor",
    status: "Active",
    email: "amara.j@email.com",
    region: "North America",
    acquisitionChannel: "Social media",
    memberSinceYear: "2021",
  },
];

/** Demo ledger - aligns with Donors list; merged with localStorage in UI */
const DEMO_CONTRIBUTIONS: ContributionLine[] = [
  { id: "demo-c1", profileId: "sup-1", date: "2026-04-01", donationType: "Monthly", amount: "$500", allocation: "Direct Services", source: "demo" },
  { id: "demo-c2", profileId: "sup-1", date: "2026-03-01", donationType: "Monthly", amount: "$500", allocation: "Direct Services", source: "demo" },
  { id: "demo-c3", profileId: "sup-1", date: "2026-02-14", donationType: "One-time", amount: "$250", allocation: "Education", source: "demo" },
  { id: "demo-c4", profileId: "sup-2", date: "2026-03-20", donationType: "One-time", amount: "$2,500", allocation: "Housing", source: "demo" },
  { id: "demo-c5", profileId: "sup-2", date: "2025-12-01", donationType: "One-time", amount: "$2,500", allocation: "Housing", source: "demo" },
  { id: "demo-c6", profileId: "sup-2", date: "2025-06-15", donationType: "One-time", amount: "$2,500", allocation: "Direct Services", source: "demo" },
  { id: "demo-c7", profileId: "sup-3", date: "2026-01-10", donationType: "Grant", amount: "$25,000", allocation: "General", source: "demo" },
  { id: "demo-c8", profileId: "sup-3", date: "2025-01-08", donationType: "Grant", amount: "$25,000", allocation: "General", source: "demo" },
  { id: "demo-c9", profileId: "sup-3", date: "2024-01-12", donationType: "Grant", amount: "$25,000", allocation: "Housing", source: "demo" },
  { id: "demo-c10", profileId: "sup-4", date: "2026-04-02", donationType: "Monthly", amount: "$100", allocation: "Training", source: "demo" },
  { id: "demo-c11", profileId: "sup-4", date: "2026-03-02", donationType: "Monthly", amount: "$100", allocation: "Training", source: "demo" },
  { id: "demo-c12", profileId: "sup-5", date: "2026-01-05", donationType: "Annual", amount: "$5,000", allocation: "Direct Services", source: "demo" },
  { id: "demo-c13", profileId: "sup-5", date: "2025-01-08", donationType: "Annual", amount: "$5,000", allocation: "Direct Services", source: "demo" },
  { id: "demo-c14", profileId: "sup-5", date: "2024-01-10", donationType: "Annual", amount: "$5,000", allocation: "Operations", source: "demo" },
];

const nameKey = (name: string) => name.trim().toLowerCase();

const STATIC_NAME_TO_PROFILE_ID = new Map(
  DEMO_PROFILES.map((p) => [nameKey(p.name), p.profileId]),
);

export function slugifySupporterName(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "supporter";
}

/** Map a donor name from recorded gifts to a stable profile id (static or local). */
export function resolveProfileIdForDonorName(name: string): string {
  const id = STATIC_NAME_TO_PROFILE_ID.get(nameKey(name));
  if (id) return id;
  return `sup-local-${slugifySupporterName(name)}`;
}

function donationToLine(d: Donation): ContributionLine {
  return {
    id: d.id,
    profileId: resolveProfileIdForDonorName(d.donorName),
    date: d.date,
    donationType: d.donationType,
    amount: d.amount,
    allocation: d.allocation,
    source: "recorded",
  };
}

export function getMergedContributionsByProfile(): Map<string, ContributionLine[]> {
  const map = new Map<string, ContributionLine[]>();

  for (const line of DEMO_CONTRIBUTIONS) {
    const list = map.get(line.profileId) ?? [];
    list.push(line);
    map.set(line.profileId, list);
  }

  for (const d of localData.listDonations()) {
    const line = donationToLine(d);
    const list = map.get(line.profileId) ?? [];
    list.push(line);
    map.set(line.profileId, list);
  }

  for (const [pid, list] of map) {
    list.sort((a, b) => b.date.localeCompare(a.date));
    map.set(pid, list);
  }

  return map;
}

function parseRoughUsd(amount: string): number | null {
  const cleaned = amount.replace(/,/g, "");
  const m = cleaned.match(/\$?\s*([\d.]+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function formatTotalHint(lines: ContributionLine[]): string {
  let sum = 0;
  let counted = 0;
  for (const l of lines) {
    const v = parseRoughUsd(l.amount);
    if (v != null) {
      sum += v;
      counted++;
    }
  }
  if (counted === 0) return `${lines.length} gift${lines.length === 1 ? "" : "s"}`;
  return `~$${Math.round(sum).toLocaleString()} (${lines.length} gift${lines.length === 1 ? "" : "s"})`;
}

function dominantType(lines: ContributionLine[]): string {
  const counts = new Map<string, number>();
  for (const l of lines) {
    counts.set(l.donationType, (counts.get(l.donationType) ?? 0) + 1);
  }
  let best = lines[0]?.donationType ?? "N/A";
  let max = 0;
  for (const [t, c] of counts) {
    if (c > max) {
      max = c;
      best = t;
    }
  }
  return best;
}

function syntheticProfile(profileId: string, contributions: ContributionLine[]): SupporterProfile {
  const recorded = contributions.filter((c) => c.source === "recorded");
  let name = "Supporter";
  if (recorded.length > 0) {
    const d = localData.listDonations().find((x) => x.id === recorded[0].id);
    if (d) name = d.donorName;
  } else {
    const slug = profileId.replace(/^sup-local-/, "").replace(/-/g, " ");
    name = slug.replace(/\b\w/g, (ch) => ch.toUpperCase()) || "Supporter";
  }

  const years = contributions.map((c) => parseInt(c.date.slice(0, 4), 10)).filter((y) => !Number.isNaN(y));
  const minY = years.length ? String(Math.min(...years)) : new Date().getFullYear().toString();

  return {
    profileId,
    name,
    supporterType: "Recorded supporter",
    status: "Active",
    memberSinceYear: minY,
    notes: "Profile created from gifts recorded in Bonfire (local storage).",
  };
}

export function getProfileForId(profileId: string, contributions: ContributionLine[]): SupporterProfile {
  const staticP = DEMO_PROFILES.find((p) => p.profileId === profileId);
  if (staticP) return staticP;
  return syntheticProfile(profileId, contributions);
}

export type SupporterBundle = {
  profile: SupporterProfile;
  contributions: ContributionLine[];
};

export function getSupporterBundle(profileId: string): SupporterBundle | null {
  const map = getMergedContributionsByProfile();
  const contributions = map.get(profileId);
  if (!contributions || contributions.length === 0) return null;
  const profile = getProfileForId(profileId, contributions);
  return { profile, contributions };
}

export function listSupporterTableRows(): SupporterTableRow[] {
  const map = getMergedContributionsByProfile();
  const rows: SupporterTableRow[] = [];

  for (const [profileId, lines] of map) {
    if (lines.length === 0) continue;
    const latest = lines[0];
    const profile = getProfileForId(profileId, lines);
    rows.push({
      profileId,
      name: profile.name,
      type: dominantType(lines),
      amount: latest.amount,
      total: formatTotalHint(lines),
      allocation: latest.allocation,
      since:
        profile.memberSinceYear ||
        String(Math.min(...lines.map((l) => parseInt(l.date.slice(0, 4), 10)))),
    });
  }

  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}
