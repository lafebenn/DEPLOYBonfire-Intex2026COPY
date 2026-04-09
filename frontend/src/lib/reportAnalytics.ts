import type {
  Conference,
  Donation,
  HomeVisit,
  IntakeCase,
  ProcessRecording,
} from "@/lib/localData";
import { localData } from "@/lib/localData";

export type ProgramBreakdown = { program: string; count: number };
export type AllocationBreakdown = { allocation: string; count: number; totalAmount: number };
export type MonthlyDonation = { month: string; total: number; count: number };
export type CategoryTotal = { label: string; count: number; total: number };
export type MonthlyAvg = { month: string; avg: number | null };
export type SafehouseMonthlyRow = {
  safehouseId: number;
  safehouseName: string;
  month: string;
  activeResidents: number;
  avgEducationProgress: number;
  avgHealthScore: number;
  processRecordingCount: number;
  homeVisitationCount: number;
  incidentCount: number;
};
export type ReintegrationCount = { label: string; count: number };

function parseAmountDisplay(amount: string): number {
  const n = parseFloat(String(amount).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function isoMonthKey(isoDate: string): string {
  if (!isoDate || isoDate.length < 7) return "unknown";
  return isoDate.slice(0, 7);
}

export type ReportAnalytics = {
  generatedAt: string;
  periodLabel: string;
  /** Where KPIs came from (insights wording + UI badge). */
  metricsSource?: "database" | "browser-storage";
  monthsBack?: number;
  safehouseId?: number | null;
  intakes: IntakeCase[];
  visits: HomeVisit[];
  donations: Donation[];
  conferences: Conference[];
  recordings: ProcessRecording[];
  totalResidents: number;
  byStatus: Record<string, number>;
  byProgram: ProgramBreakdown[];
  avgProgressActive: number | null;
  avgHealthActive?: number | null;
  transitioningOrCompleted: number;
  /** Total home visits (when known from API); else derived from local list length. */
  visitsTotal?: number;
  visitsCompleted: number;
  visitsScheduled: number;
  visitCompletionRate: number | null;
  totalRecordings: number;
  uniqueResidentsWithRecording: number;
  avgRecordingsPerIntake: number;
  donationCount: number;
  donationTotal: number;
  byAllocation: AllocationBreakdown[];
  donationsByMonth: MonthlyDonation[];
  donationByType?: CategoryTotal[];
  donationByChannel?: CategoryTotal[];
  donationByCampaign?: CategoryTotal[];
  educationProgressByMonth?: MonthlyAvg[];
  healthScoreByMonth?: MonthlyAvg[];
  safehouseMonthly?: SafehouseMonthlyRow[];
  reintegrationByStatus?: ReintegrationCount[];
  reintegrationByType?: ReintegrationCount[];
  conferencesCompleted: number;
  conferencesUpcoming: number;
  insights: string[];
};

export type ReportAnalyticsCore = Omit<ReportAnalytics, "insights">;

function pickNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function computeInsights(core: ReportAnalyticsCore): string[] {
  const where = core.metricsSource === "database" ? "the database" : "browser storage";
  const visitTotal =
    core.visitsTotal ??
    (core.visitsCompleted + core.visitsScheduled > 0
      ? core.visitsCompleted + core.visitsScheduled
      : core.visits.length);
  const insights: string[] = [];

  if (core.visitCompletionRate !== null && visitTotal >= 3) {
    if (core.visitCompletionRate >= 0.85) {
      insights.push("Home visit documentation is strong: most visits do not require follow-up.");
    } else if (core.visitCompletionRate < 0.5) {
      insights.push("Many home visits may still need follow-up—check outcomes and follow-up flags in case records.");
    }
  }
  if (core.avgProgressActive !== null && (core.byStatus.Active ?? 0) >= 2) {
    insights.push(
      `Active residents average ${Math.round(core.avgProgressActive)}% education progress where recorded—use reports to spot stalled cases.`,
    );
  }
  if (core.byAllocation[0]) {
    const top = core.byAllocation[0];
    if (core.metricsSource === "database") {
      insights.push(
        `Largest allocation total is “${top.allocation}” (${top.count} allocation line${top.count === 1 ? "" : "s"}, amounts from gift allocations).`,
      );
    } else {
      insights.push(
        `Largest share of recorded giving is allocated to “${top.allocation}” (${top.count} gifts in ${where}).`,
      );
    }
  }
  if (core.transitioningOrCompleted > 0 && core.totalResidents > 0) {
    const pct = Math.round((core.transitioningOrCompleted / core.totalResidents) * 100);
    insights.push(
      `${pct}% of resident records show transitioning, completed, or closed status—track reintegration outcomes in the annex tables.`,
    );
  }
  if (
    core.totalRecordings > 0 &&
    core.totalResidents > 0 &&
    core.totalRecordings / core.totalResidents < 2
  ) {
    insights.push("Process recordings per resident are low relative to caseload—consider documentation sprints.");
  }
  if (insights.length === 0) {
    insights.push(
      core.metricsSource === "database"
        ? "Add more residents, visits, donations, and process recordings in the system to enrich trends and comparisons."
        : "Add residents, visits, donations, and process recordings in browser storage—or sign in with the API running—to see live aggregates.",
    );
  }
  return insights;
}

export function attachInsights(core: ReportAnalyticsCore): ReportAnalytics {
  return { ...core, insights: computeInsights(core) };
}

function countBy<T>(items: T[], keyFn: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    const k = keyFn(it);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

const emptyLocal = {
  intakes: [] as IntakeCase[],
  visits: [] as HomeVisit[],
  donations: [] as Donation[],
  conferences: [] as Conference[],
  recordings: [] as ProcessRecording[],
};

/** Maps GET /api/dashboard/reports-metrics `data` payload to ReportAnalytics. */
export function mapDashboardReportsMetrics(raw: unknown): ReportAnalytics | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  const byStatus: Record<string, number> = {};
  const bs = d.byStatus;
  if (bs && typeof bs === "object" && !Array.isArray(bs)) {
    for (const [k, v] of Object.entries(bs as Record<string, unknown>)) {
      byStatus[k] = pickNum(v);
    }
  }

  const byProgram: ProgramBreakdown[] = [];
  const bp = d.byProgram;
  if (Array.isArray(bp)) {
    for (const row of bp) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const program = String(r.program ?? r.Program ?? "Unspecified");
      byProgram.push({ program, count: pickNum(r.count ?? r.Count) });
    }
  }

  const byAllocation: AllocationBreakdown[] = [];
  const ba = d.byAllocation;
  if (Array.isArray(ba)) {
    for (const row of ba) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      byAllocation.push({
        allocation: String(r.allocation ?? r.Allocation ?? "Unknown"),
        count: pickNum(r.count ?? r.Count),
        totalAmount: pickNum(r.totalAmount ?? r.TotalAmount),
      });
    }
  }

  const donationsByMonth: MonthlyDonation[] = [];
  const dm = d.donationsByMonth;
  if (Array.isArray(dm)) {
    for (const row of dm) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      donationsByMonth.push({
        month: String(r.month ?? r.Month ?? ""),
        total: pickNum(r.total ?? r.Total),
        count: pickNum(r.count ?? r.Count),
      });
    }
  }

  function mapCategoryTotals(key: unknown, labelKey: string): CategoryTotal[] {
    const out: CategoryTotal[] = [];
    if (!Array.isArray(key)) return out;
    for (const row of key) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const label = String(r[labelKey] ?? r[labelKey[0].toUpperCase() + labelKey.slice(1)] ?? "");
      if (!label) continue;
      out.push({
        label,
        count: pickNum(r.count ?? r.Count),
        total: pickNum(r.total ?? r.Total),
      });
    }
    return out;
  }

  function mapMonthlyAvg(key: unknown, avgKey: string): MonthlyAvg[] {
    const out: MonthlyAvg[] = [];
    if (!Array.isArray(key)) return out;
    for (const row of key) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const month = String(r.month ?? r.Month ?? "");
      if (!month) continue;
      const avgRaw = r[avgKey] ?? r[avgKey[0].toUpperCase() + avgKey.slice(1)];
      const avg = avgRaw == null ? null : pickNum(avgRaw);
      out.push({ month, avg });
    }
    return out;
  }

  function mapReintegrationCounts(key: unknown, labelKey: string): ReintegrationCount[] {
    const out: ReintegrationCount[] = [];
    if (!Array.isArray(key)) return out;
    for (const row of key) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const label = String(r[labelKey] ?? r[labelKey[0].toUpperCase() + labelKey.slice(1)] ?? "");
      if (!label) continue;
      out.push({ label, count: pickNum(r.count ?? r.Count) });
    }
    return out;
  }

  const safehouseMonthly: SafehouseMonthlyRow[] = [];
  const sm = d.safehouseMonthly;
  if (Array.isArray(sm)) {
    for (const row of sm) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const safehouseId = pickNum(r.safehouseId ?? r.SafehouseId);
      const safehouseName = String(r.safehouseName ?? r.SafehouseName ?? "");
      const month = String(r.month ?? r.Month ?? "");
      if (!safehouseId || !safehouseName || !month) continue;
      safehouseMonthly.push({
        safehouseId,
        safehouseName,
        month,
        activeResidents: pickNum(r.activeResidents ?? r.ActiveResidents),
        avgEducationProgress: pickNum(r.avgEducationProgress ?? r.AvgEducationProgress),
        avgHealthScore: pickNum(r.avgHealthScore ?? r.AvgHealthScore),
        processRecordingCount: pickNum(r.processRecordingCount ?? r.ProcessRecordingCount),
        homeVisitationCount: pickNum(r.homeVisitationCount ?? r.HomeVisitationCount),
        incidentCount: pickNum(r.incidentCount ?? r.IncidentCount),
      });
    }
  }

  const gen = d.generatedAtUtc ?? d.generatedAt ?? new Date().toISOString();
  const generatedAt = typeof gen === "string" ? gen : new Date(gen as string).toISOString();

  const core: ReportAnalyticsCore = {
    ...emptyLocal,
    generatedAt,
    periodLabel: String(d.periodLabel ?? `Calendar year ${new Date().getFullYear()}`),
    metricsSource: "database",
    monthsBack: pickNum(d.monthsBack ?? d.MonthsBack) || undefined,
    safehouseId: (d.safehouseId as number | null | undefined) ?? (d.SafehouseId as number | null | undefined),
    totalResidents: pickNum(d.totalResidents ?? d.TotalResidents),
    byStatus,
    byProgram,
    avgProgressActive: d.avgProgressActive == null && d.AvgProgressActive == null ? null : pickNum(d.avgProgressActive ?? d.AvgProgressActive),
    avgHealthActive: d.avgHealthActive == null && d.AvgHealthActive == null ? null : pickNum(d.avgHealthActive ?? d.AvgHealthActive),
    transitioningOrCompleted: pickNum(d.transitioningOrCompleted ?? d.TransitioningOrCompleted),
    visitsTotal: pickNum(d.visitsTotal ?? d.VisitsTotal) || undefined,
    visitsCompleted: pickNum(d.visitsCompleted ?? d.VisitsCompleted),
    visitsScheduled: pickNum(d.visitsScheduled ?? d.VisitsScheduled),
    visitCompletionRate:
      d.visitCompletionRate == null && d.VisitCompletionRate == null
        ? null
        : pickNum(d.visitCompletionRate ?? d.VisitCompletionRate),
    totalRecordings: pickNum(d.totalRecordings ?? d.TotalRecordings),
    uniqueResidentsWithRecording: pickNum(d.uniqueResidentsWithRecording ?? d.UniqueResidentsWithRecording),
    avgRecordingsPerIntake: pickNum(d.avgRecordingsPerIntake ?? d.AvgRecordingsPerIntake),
    donationCount: pickNum(d.donationCount ?? d.DonationCount),
    donationTotal: pickNum(d.donationTotal ?? d.DonationTotal),
    byAllocation,
    donationsByMonth: donationsByMonth.filter((x) => x.month),
    donationByType: mapCategoryTotals(d.donationByType, "donationType"),
    donationByChannel: mapCategoryTotals(d.donationByChannel, "channelSource"),
    donationByCampaign: mapCategoryTotals(d.donationByCampaign, "campaignName"),
    educationProgressByMonth: mapMonthlyAvg(d.educationProgressByMonth, "avgProgress"),
    healthScoreByMonth: mapMonthlyAvg(d.healthScoreByMonth, "avgHealth"),
    safehouseMonthly,
    reintegrationByStatus: mapReintegrationCounts(d.reintegrationByStatus, "status"),
    reintegrationByType: mapReintegrationCounts(d.reintegrationByType, "type"),
    conferencesCompleted: pickNum(d.conferencesCompleted ?? d.ConferencesCompleted),
    conferencesUpcoming: pickNum(d.conferencesUpcoming ?? d.ConferencesUpcoming),
  };

  return attachInsights(core);
}

export function computeReportAnalytics(opts?: { monthsBack?: number }): ReportAnalytics {
  const monthsBack =
    opts?.monthsBack && Number.isFinite(opts.monthsBack)
      ? Math.max(1, Math.min(36, opts.monthsBack))
      : 12;

  const now = new Date();
  const fromMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  fromMonth.setUTCMonth(fromMonth.getUTCMonth() - (monthsBack - 1));
  const fromIso = fromMonth.toISOString().slice(0, 10);

  const intakesAll = localData.listIntakes();
  const visitsAll = localData.listVisits();
  const donationsAll = localData.listDonations();
  const conferencesAll = localData.listConferences();
  const recordingsAll = localData.listRecordings();

  const intakes = intakesAll.filter((x) => String(x.admitted ?? "").slice(0, 10) >= fromIso);
  const visits = visitsAll.filter((x) => String(x.date ?? "").slice(0, 10) >= fromIso);
  const donations = donationsAll.filter((x) => String(x.date ?? "").slice(0, 10) >= fromIso);
  const conferences = conferencesAll.filter((x) => String(x.date ?? "").slice(0, 10) >= fromIso);
  const recordings = recordingsAll.filter((x) => String(x.date ?? "").slice(0, 10) >= fromIso);

  const periodLabel = `Last ${monthsBack} month${monthsBack === 1 ? "" : "s"} (demo aggregates from browser storage)`;

  const byStatus = countBy(intakes, (i) => i.status);
  const programCounts = countBy(intakes, (i) => i.program || "Unspecified");
  const byProgram: ProgramBreakdown[] = Object.entries(programCounts)
    .map(([program, count]) => ({ program, count }))
    .sort((a, b) => b.count - a.count);

  const active = intakes.filter((i) => i.status === "Active");
  const avgProgressActive =
    active.length > 0 ? active.reduce((s, i) => s + i.progress, 0) / active.length : null;

  const transitioningOrCompleted = intakes.filter((i) =>
    ["Transitioning", "Completed", "Closed"].includes(i.status),
  ).length;

  const visitsCompleted = visits.filter((v) => v.status === "Completed").length;
  const visitsScheduled = visits.filter((v) => v.status === "Scheduled").length;
  const visitTotal = visits.length;
  const visitCompletionRate = visitTotal > 0 ? visitsCompleted / visitTotal : null;

  const resWithRec = new Set(recordings.map((r) => r.resident));
  const avgRecordingsPerIntake = intakes.length > 0 ? recordings.length / intakes.length : 0;

  const donationTotal = donations.reduce((s, d) => s + parseAmountDisplay(d.amount), 0);
  const allocCounts: Record<string, { count: number; totalAmount: number }> = {};
  for (const d of donations) {
    const a = d.allocation || "General";
    if (!allocCounts[a]) allocCounts[a] = { count: 0, totalAmount: 0 };
    allocCounts[a].count += 1;
    allocCounts[a].totalAmount += parseAmountDisplay(d.amount);
  }
  const byAllocation: AllocationBreakdown[] = Object.entries(allocCounts)
    .map(([allocation, v]) => ({ allocation, count: v.count, totalAmount: v.totalAmount }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const monthMap: Record<string, { total: number; count: number }> = {};
  for (const d of donations) {
    const m = isoMonthKey(d.date);
    if (!monthMap[m]) monthMap[m] = { total: 0, count: 0 };
    monthMap[m].total += parseAmountDisplay(d.amount);
    monthMap[m].count += 1;
  }
  const donationsByMonth: MonthlyDonation[] = Object.entries(monthMap)
    .filter(([k]) => k !== "unknown")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, total: v.total, count: v.count }));

  const conferencesCompleted = conferences.filter((c) => c.status === "Completed").length;
  const conferencesUpcoming = conferences.filter((c) => c.status === "Upcoming").length;

  const core: ReportAnalyticsCore = {
    generatedAt: now.toISOString(),
    periodLabel,
    metricsSource: "browser-storage",
    monthsBack,
    safehouseId: null,
    intakes,
    visits,
    donations,
    conferences,
    recordings,
    totalResidents: intakes.length,
    byStatus,
    byProgram,
    avgProgressActive,
    avgHealthActive: null,
    transitioningOrCompleted,
    visitsTotal: visitTotal > 0 ? visitTotal : undefined,
    visitsCompleted,
    visitsScheduled,
    visitCompletionRate,
    totalRecordings: recordings.length,
    uniqueResidentsWithRecording: resWithRec.size,
    avgRecordingsPerIntake,
    donationCount: donations.length,
    donationTotal,
    byAllocation,
    donationsByMonth,
    donationByType: [],
    donationByChannel: [],
    donationByCampaign: [],
    educationProgressByMonth: [],
    healthScoreByMonth: [],
    safehouseMonthly: [],
    reintegrationByStatus: [],
    reintegrationByType: [],
    conferencesCompleted,
    conferencesUpcoming,
  };

  return attachInsights(core);
}

export function accomplishmentTableRows(a: ReportAnalytics) {
  const completedClosed = (a.byStatus.Completed ?? 0) + (a.byStatus.Closed ?? 0);
  return [
    { label: "Residents in caseload (records)", value: String(a.totalResidents) },
    { label: "Active", value: String(a.byStatus.Active ?? 0) },
    { label: "Transitioning", value: String(a.byStatus.Transitioning ?? 0) },
    { label: "Completed / closed (outcomes)", value: String(completedClosed) },
    { label: "Process recordings (counseling / case notes)", value: String(a.totalRecordings) },
    { label: "Home visits — completed", value: String(a.visitsCompleted) },
    { label: "Home visits — follow-up flagged / pending", value: String(a.visitsScheduled) },
    { label: "Case conferences — held", value: String(a.conferencesCompleted) },
    { label: "Case conferences — upcoming", value: String(a.conferencesUpcoming) },
    { label: "Gifts recorded (count)", value: String(a.donationCount) },
  ];
}

function csvEscape(cell: string): string {
  return `"${String(cell).replace(/"/g, '""')}"`;
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAccomplishmentAnnexCsv(a: ReportAnalytics) {
  const rows = accomplishmentTableRows(a).map((r) => [r.label, r.value]);
  downloadCsv(`bonfire-accomplishment-annex-${new Date().toISOString().slice(0, 10)}.csv`, ["Indicator", "Value"], rows);
}

export function downloadProgramComparisonCsv(a: ReportAnalytics) {
  const rows = a.byProgram.map((p) => [p.program, String(p.count)]);
  downloadCsv(`bonfire-program-comparison-${new Date().toISOString().slice(0, 10)}.csv`, ["Program / pathway", "Residents"], rows);
}

export function downloadAllocationCsv(a: ReportAnalytics) {
  const rows = a.byAllocation.map((x) => [x.allocation, String(x.count), String(Math.round(x.totalAmount))]);
  downloadCsv(
    `bonfire-donation-allocations-${new Date().toISOString().slice(0, 10)}.csv`,
    ["Allocation", "Gift count", "Total amount (parsed)"],
    rows,
  );
}

/** Calendar month before `reference` (UTC), as YYYY-MM. */
export function getPreviousCalendarMonthKey(reference: Date): string {
  const y = reference.getUTCFullYear();
  const m = reference.getUTCMonth();
  const d = new Date(Date.UTC(y, m - 1, 1));
  const yy = d.getUTCFullYear();
  const mm = d.getUTCMonth() + 1;
  return `${yy}-${String(mm).padStart(2, "0")}`;
}

export function formatMonthHeading(monthKey: string): string {
  const [ys, ms] = monthKey.split("-");
  const y = Number(ys);
  const mo = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(mo)) return monthKey;
  return new Date(y, mo - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
}

/** Shift YYYY-MM by delta months (UTC) for comparisons to API month keys. */
function addCalendarMonthsKey(monthKey: string, delta: number): string {
  const [ys, ms] = monthKey.split("-").map(Number);
  if (!Number.isFinite(ys) || !Number.isFinite(ms)) return monthKey;
  const d = new Date(Date.UTC(ys, ms - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type DonorImpactAllocationRow = {
  rank: number;
  name: string;
  role: string;
  bucket: string;
  giftLineNote: string;
};

/** Single previous-month snapshot for donor letter + CSV (no full-period metrics). */
export type DonorImpactPreviousMonthView = {
  monthKey: string;
  monthHeading: string;
  giftCount: number | null;
  giftTrendNote: string | null;
  education: string;
  health: string;
  homeVisitsNarrative: string;
  caseNotesTotal: number | null;
  activeResidentsApprox: number | null;
  allocations: DonorImpactAllocationRow[];
  /** True when rows came from per-gift tags for that month; false when from dashboard routing summary. */
  allocationIsMonthScoped: boolean;
  allocationFooterNote: string | null;
  emptyBanner: string | null;
};

function roughShareBucket(pct: number): string {
  if (pct >= 55) return "accounts for the largest portion of routed support (approximate)";
  if (pct >= 35) return "accounts for a large portion of routed support";
  if (pct >= 18) return "accounts for a meaningful portion of routed support";
  return "accounts for a smaller portion of routed support";
}

function roughAllocationRole(rank: number): string {
  if (rank === 0) return "This is where the largest portion of routed support went";
  if (rank === 1) return "Second-largest area for routed support";
  if (rank === 2) return "Third-largest area for routed support";
  return "Another area that received routed support";
}

function eduNarrativeDonor(avg: number | null | undefined): string {
  if (avg == null || !Number.isFinite(avg)) {
    return "We’re still pulling together education progress for this month, or fewer residents had milestones logged.";
  }
  if (avg >= 72) return "Residents made strong progress on education and life-skills goals where we track them.";
  if (avg >= 45) return "Residents kept moving forward on education milestones in the usual rhythm.";
  return "Some residents are still in earlier stages of their learning plans—staff are walking alongside them.";
}

function healthNarrativeDonor(avg: number | null | undefined): string {
  if (avg == null || !Number.isFinite(avg)) {
    return "Wellbeing check-ins for this month aren’t summarized here yet.";
  }
  if (avg >= 4) return "Wellbeing check-ins looked steady or encouraging where we record scores.";
  if (avg >= 3) return "Wellbeing scores varied in a normal way—staff follow up where it matters.";
  return "A few cases needed extra attention; that’s part of holistic care.";
}

function visitsNarrativeDonor(homeVisitSum: number): string {
  if (homeVisitSum <= 0) {
    return "Home-visit counts for this month are still updating, or were light on the calendar.";
  }
  if (homeVisitSum >= 20) {
    return "Teams were out often—many home and field visits happened across our sites.";
  }
  if (homeVisitSum >= 8) return "Staff kept up regular home visits and field contact.";
  return "We logged some face-to-face visits; levels vary by site and season.";
}

function buildAllocationFromDonationsInMonth(donations: Donation[], monthKey: string): DonorImpactAllocationRow[] {
  const inMonth = donations.filter((d) => isoMonthKey(d.date) === monthKey);
  if (inMonth.length === 0) return [];
  const buckets: Record<string, { count: number; totalAmount: number }> = {};
  for (const d of inMonth) {
    const al = (d.allocation || "General support").trim() || "General support";
    if (!buckets[al]) buckets[al] = { count: 0, totalAmount: 0 };
    buckets[al].count += 1;
    buckets[al].totalAmount += parseAmountDisplay(d.amount);
  }
  const sum = Object.values(buckets).reduce((s, x) => s + x.totalAmount, 0) || 1;
  return Object.entries(buckets)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .map((row, idx) => ({
      rank: idx,
      name: row.name,
      role: roughAllocationRole(idx),
      bucket: roughShareBucket((row.totalAmount / sum) * 100),
      giftLineNote: row.count === 1 ? "One gift tagged here." : `${row.count} gifts tagged here.`,
    }));
}

/** When monthly education *records* skip a month, safehouse snapshots often still have progress for that month. */
function weightedAvgEducationFromSafehouseMonth(rows: SafehouseMonthlyRow[]): number | null {
  if (rows.length === 0) return null;
  const weighted = rows.filter((r) => r.activeResidents > 0);
  if (weighted.length > 0) {
    const w = weighted.reduce((s, r) => s + r.activeResidents, 0);
    if (w <= 0) return null;
    return weighted.reduce((s, r) => s + r.avgEducationProgress * r.activeResidents, 0) / w;
  }
  const vals = rows.map((r) => r.avgEducationProgress).filter((x) => Number.isFinite(x) && x > 0);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function weightedAvgHealthFromSafehouseMonth(rows: SafehouseMonthlyRow[]): number | null {
  if (rows.length === 0) return null;
  const weighted = rows.filter((r) => r.activeResidents > 0);
  if (weighted.length > 0) {
    const w = weighted.reduce((s, r) => s + r.activeResidents, 0);
    if (w <= 0) return null;
    return weighted.reduce((s, r) => s + r.avgHealthScore * r.activeResidents, 0) / w;
  }
  const vals = rows.map((r) => r.avgHealthScore).filter((x) => Number.isFinite(x) && x > 0);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function resolveEducationAvgForMonth(a: ReportAnalytics, monthKey: string, shRows: SafehouseMonthlyRow[]): number | null {
  const trend = a.educationProgressByMonth?.find((e) => e.month === monthKey);
  if (trend?.avg != null && Number.isFinite(trend.avg) && trend.avg > 0) return trend.avg;
  const fromSites = weightedAvgEducationFromSafehouseMonth(shRows);
  if (fromSites != null) return fromSites;
  if (trend?.avg != null && Number.isFinite(trend.avg)) return trend.avg;
  return null;
}

function resolveHealthAvgForMonth(a: ReportAnalytics, monthKey: string, shRows: SafehouseMonthlyRow[]): number | null {
  const trend = a.healthScoreByMonth?.find((h) => h.month === monthKey);
  if (trend?.avg != null && Number.isFinite(trend.avg) && trend.avg > 0) return trend.avg;
  const fromSites = weightedAvgHealthFromSafehouseMonth(shRows);
  if (fromSites != null) return fromSites;
  if (trend?.avg != null && Number.isFinite(trend.avg)) return trend.avg;
  return null;
}

/**
 * Dashboard stores allocation by program/site; monthly split is not in the API yet.
 * Uses share of routed support (no dollar amounts in copy).
 */
function buildAllocationFromDashboardByAllocation(a: ReportAnalytics): DonorImpactAllocationRow[] {
  if (a.byAllocation.length === 0) return [];
  const sum = a.byAllocation.reduce((s, x) => s + x.totalAmount, 0) || 1;
  return [...a.byAllocation]
    .sort((x, y) => y.totalAmount - x.totalAmount)
    .map((row, idx) => ({
      rank: idx,
      name: row.allocation,
      role: roughAllocationRole(idx),
      bucket: roughShareBucket((row.totalAmount / sum) * 100),
      giftLineNote:
        row.count === 1 ?
          "One routing line in our system points here."
        : `${row.count} gift routing lines point here.`,
    }));
}

export function buildDonorImpactPreviousMonthView(a: ReportAnalytics): DonorImpactPreviousMonthView {
  /** Month before the metrics snapshot (not “today”), so the letter matches the loaded dashboard data. */
  const referenceDate = new Date(a.generatedAt);
  const monthKey = getPreviousCalendarMonthKey(referenceDate);
  const monthHeading = formatMonthHeading(monthKey);

  const dm = a.donationsByMonth.find((m) => m.month === monthKey);
  const giftCount = dm != null ? dm.count : null;

  const monthsSorted = [...a.donationsByMonth].sort((x, y) => x.month.localeCompare(y.month));
  let giftTrendNote: string | null = null;
  const curDm = monthsSorted.find((m) => m.month === monthKey);
  const priorMonthKey = addCalendarMonthsKey(monthKey, -1);
  const priorDm = monthsSorted.find((m) => m.month === priorMonthKey);
  if (curDm && priorDm) {
    if (curDm.count > priorDm.count) giftTrendNote = "A bit busier than the calendar month right before.";
    else if (curDm.count < priorDm.count) giftTrendNote = "A bit quieter than the calendar month right before.";
    else giftTrendNote = "About the same pace as the calendar month right before.";
  }

  const shRows = (a.safehouseMonthly ?? []).filter((r) => r.month === monthKey);
  const eduAvg = resolveEducationAvgForMonth(a, monthKey, shRows);
  const healthAvg = resolveHealthAvgForMonth(a, monthKey, shRows);
  const homeVisitSum = shRows.reduce((s, r) => s + r.homeVisitationCount, 0);
  const caseNotesTotal =
    shRows.length > 0 ? shRows.reduce((s, r) => s + r.processRecordingCount, 0) : null;
  const activeResidentsApprox =
    shRows.length > 0 ? shRows.reduce((s, r) => s + r.activeResidents, 0) : null;

  let allocations = buildAllocationFromDonationsInMonth(a.donations, monthKey);
  let allocationIsMonthScoped = allocations.length > 0;
  let allocationFooterNote: string | null = null;

  if (allocations.length === 0) {
    allocations = buildAllocationFromDashboardByAllocation(a);
    if (allocations.length > 0) {
      allocationIsMonthScoped = false;
      allocationFooterNote =
        "These rows use how gifts are routed to program areas in our live dashboard. They describe overall patterns in connected data—not only this single month, because month-by-month routing totals are not exported yet. Dollar amounts are never shown here.";
    }
  }

  if (allocations.length === 0) {
    allocationFooterNote =
      a.metricsSource === "database" ?
        "We could not find gift routing to program areas in the data feed. If you expect sites or funds here, confirm donations and allocations are recorded in Bonfire."
      : "Tag demo gifts by area to preview this section.";
  }

  const hasProgramSignals =
    (eduAvg != null && Number.isFinite(eduAvg)) ||
    (healthAvg != null && Number.isFinite(healthAvg)) ||
    homeVisitSum > 0 ||
    (caseNotesTotal != null && caseNotesTotal > 0) ||
    (giftCount != null && giftCount > 0);

  const emptyBanner =
    !hasProgramSignals && allocations.length === 0 ?
      `We don’t have a full story for ${monthHeading} yet—numbers often finish a few days after month-end. Check back or ask the office for an update.`
    : null;

  return {
    monthKey,
    monthHeading,
    giftCount,
    giftTrendNote,
    education: eduNarrativeDonor(eduAvg),
    health: healthNarrativeDonor(healthAvg),
    homeVisitsNarrative: visitsNarrativeDonor(homeVisitSum),
    caseNotesTotal,
    activeResidentsApprox,
    allocations,
    allocationIsMonthScoped,
    allocationFooterNote,
    emptyBanner,
  };
}

export type DonorImpactGiftTimelinePoint = { monthKey: string; labelShort: string; gifts: number };

function formatMonthShortLabel(monthKey: string): string {
  const [ys, ms] = monthKey.split("-").map(Number);
  if (!Number.isFinite(ys) || !Number.isFinite(ms)) return monthKey;
  return new Date(ys, ms - 1, 1).toLocaleString(undefined, { month: "short", year: "2-digit" });
}

/** Last N months of gift counts for a simple timeline (no dollar amounts). */
export function buildDonorImpactGiftTimeline(a: ReportAnalytics, maxMonths = 12): DonorImpactGiftTimelinePoint[] {
  const sorted = [...(a.donationsByMonth ?? [])].sort((x, y) => x.month.localeCompare(y.month));
  return sorted.slice(-maxMonths).map((m) => ({
    monthKey: m.month,
    labelShort: formatMonthShortLabel(m.month),
    gifts: m.count,
  }));
}

/** Left “At a glance” bar chart — prefers series that actually move month to month. */
export type DonorImpactAtGlanceBarKind = "programActivity" | "gifts" | "education" | "health" | "residents";

export type DonorImpactAtGlanceBarPoint = { monthKey: string; labelShort: string; value: number };

function atGlanceBarValuesVary(points: DonorImpactAtGlanceBarPoint[]): boolean {
  if (points.length === 0) return false;
  if (points.length === 1) return true;
  const vals = points.map((p) => p.value);
  return Math.min(...vals) !== Math.max(...vals);
}

function pickDonorAtGlanceBarCandidate(
  candidates: { kind: DonorImpactAtGlanceBarKind; points: DonorImpactAtGlanceBarPoint[] }[],
): { kind: DonorImpactAtGlanceBarKind; points: DonorImpactAtGlanceBarPoint[] } | null {
  const nonempty = candidates.filter((c) => c.points.length > 0);
  const varying = nonempty.filter((c) => atGlanceBarValuesVary(c.points));
  if (varying.length > 0) return varying[0];

  const skipFlatResidents = nonempty.filter(
    (c) => c.kind !== "residents" || atGlanceBarValuesVary(c.points),
  );
  if (skipFlatResidents.length > 0) return skipFlatResidents[0];

  return nonempty[0] ?? null;
}

/**
 * Monthly bars for donors: field activity & gifts first (usually varies); skips flat “capacity” when every month is the same.
 */
export function buildDonorImpactAtGlanceBarSeries(
  a: ReportAnalytics,
  maxMonths = 12,
): { kind: DonorImpactAtGlanceBarKind; points: DonorImpactAtGlanceBarPoint[] } | null {
  const rows = a.safehouseMonthly ?? [];
  const byMonthResidents: Record<string, number> = {};
  const byMonthActivity: Record<string, number> = {};
  for (const r of rows) {
    if (!r.month || r.month.length < 7) continue;
    const mk = r.month;
    byMonthResidents[mk] = (byMonthResidents[mk] ?? 0) + pickNum(r.activeResidents);
    byMonthActivity[mk] =
      (byMonthActivity[mk] ?? 0) + pickNum(r.processRecordingCount) + pickNum(r.homeVisitationCount);
  }
  const monthsSorted = [...new Set([...Object.keys(byMonthResidents), ...Object.keys(byMonthActivity)])].sort((x, y) =>
    x.localeCompare(y),
  );
  const tail = monthsSorted.slice(-maxMonths);

  const activityPoints: DonorImpactAtGlanceBarPoint[] = tail.map((monthKey) => ({
    monthKey,
    labelShort: formatMonthShortLabel(monthKey),
    value: byMonthActivity[monthKey] ?? 0,
  }));

  const dmSorted = [...(a.donationsByMonth ?? [])].sort((x, y) => x.month.localeCompare(y.month));
  const giftPoints: DonorImpactAtGlanceBarPoint[] = dmSorted.slice(-maxMonths).map((m) => ({
    monthKey: m.month,
    labelShort: formatMonthShortLabel(m.month),
    value: m.count,
  }));

  const eduSorted = [...(a.educationProgressByMonth ?? [])].sort((x, y) => x.month.localeCompare(y.month));
  const eduPoints: DonorImpactAtGlanceBarPoint[] = [];
  for (const m of eduSorted.slice(-maxMonths)) {
    if (m.avg == null || !Number.isFinite(m.avg)) continue;
    eduPoints.push({
      monthKey: m.month,
      labelShort: formatMonthShortLabel(m.month),
      value: Math.round(m.avg),
    });
  }

  const healthSorted = [...(a.healthScoreByMonth ?? [])].sort((x, y) => x.month.localeCompare(y.month));
  const healthPoints: DonorImpactAtGlanceBarPoint[] = [];
  for (const m of healthSorted.slice(-maxMonths)) {
    if (m.avg == null || !Number.isFinite(m.avg)) continue;
    healthPoints.push({
      monthKey: m.month,
      labelShort: formatMonthShortLabel(m.month),
      value: Math.round(m.avg),
    });
  }

  const residentPoints: DonorImpactAtGlanceBarPoint[] = tail.map((monthKey) => ({
    monthKey,
    labelShort: formatMonthShortLabel(monthKey),
    value: byMonthResidents[monthKey] ?? 0,
  }));

  return pickDonorAtGlanceBarCandidate([
    { kind: "programActivity", points: activityPoints },
    { kind: "gifts", points: giftPoints },
    { kind: "education", points: eduPoints },
    { kind: "health", points: healthPoints },
    { kind: "residents", points: residentPoints },
  ]);
}

export type DonorImpactAllocationSlice = { name: string; pct: number };

/**
 * Donor-facing safehouse labels: any name containing "Lighthouse" is shown as "Safehouse 1", "Safehouse 2", … by slice order.
 * Does not change internal routing keys—use only for display and CSV copy.
 */
export function donorFacingAllocationDisplayName(rawName: string, ordinalIndex: number): string {
  if (rawName === "Other areas") return rawName;
  const t = rawName.trim();
  if (!t) return `Safehouse ${ordinalIndex + 1}`;
  if (/lighthouse/i.test(t)) return `Safehouse ${ordinalIndex + 1}`;
  return t;
}

function collapseAllocationSlices(
  rows: { name: string; pct: number }[],
  maxSlices: number,
): DonorImpactAllocationSlice[] {
  if (rows.length === 0) return [];
  const rounded = rows.map((r) => ({
    name: r.name,
    pct: Math.round(r.pct),
  }));
  if (rounded.length <= maxSlices) return rounded;
  const head = rounded.slice(0, maxSlices - 1);
  const tail = rounded.slice(maxSlices - 1);
  const other = tail.reduce((s, r) => s + r.pct, 0);
  return [...head, { name: "Other areas", pct: other }];
}

/**
 * Approximate share (%) for pie / bar — from routing amounts when available, else gift-line counts.
 * Percentages are rounded; wedges are illustrative, not accounting statements.
 */
export function buildDonorImpactAllocationChart(
  a: ReportAnalytics,
  v: DonorImpactPreviousMonthView,
  maxSlices = 8,
): DonorImpactAllocationSlice[] {
  if (v.allocations.length === 0) return [];
  if (!v.allocationIsMonthScoped && a.byAllocation.length > 0) {
    const sum = a.byAllocation.reduce((s, x) => s + x.totalAmount, 0) || 1;
    const rows = v.allocations
      .map((row) => {
        const src = a.byAllocation.find((x) => x.allocation === row.name);
        const amt = src?.totalAmount ?? 0;
        return { name: row.name, pct: (amt / sum) * 100 };
      })
      .filter((x) => x.pct > 0);
    return collapseAllocationSlices(rows, maxSlices);
  }
  const counts = v.allocations.map((r) => {
    const m = r.giftLineNote.match(/(\d+)/);
    const n = m ? Number(m[1]) : 1;
    return { name: r.name, w: n };
  });
  const sum = counts.reduce((s, x) => s + x.w, 0) || 1;
  const rows = counts.map((x) => ({ name: x.name, pct: (x.w / sum) * 100 }));
  return collapseAllocationSlices(rows, maxSlices);
}

/** Education progress (%), when the dashboard exposes a monthly series — for donor trajectory chart. */
export function buildDonorImpactEducationTimeline(
  a: ReportAnalytics,
  maxMonths = 12,
): { monthKey: string; labelShort: string; pct: number | null }[] {
  const sorted = [...(a.educationProgressByMonth ?? [])].sort((x, y) => x.month.localeCompare(y.month));
  return sorted.slice(-maxMonths).map((m) => ({
    monthKey: m.month,
    labelShort: formatMonthShortLabel(m.month),
    pct: m.avg == null || !Number.isFinite(m.avg) ? null : Math.round(m.avg),
  }));
}

export function downloadDonorImpactReportCsv(a: ReportAnalytics) {
  const headers = ["Heading", "Details"] as const;
  const v = buildDonorImpactPreviousMonthView(a);
  const rows: string[][] = [];

  rows.push(["Bonfire Sanctuary — donor update (plain language)", ""]);
  rows.push([`Month covered: ${v.monthHeading}`, ""]);
  rows.push([
    "What you’re reading",
    "A short summary of the previous calendar month only. We do not list exact dollar amounts.",
  ]);
  rows.push(["Dashboard snapshot", new Date(a.generatedAt).toLocaleString()]);
  rows.push(["", ""]);

  if (v.emptyBanner) {
    rows.push(["Please note", v.emptyBanner]);
    rows.push(["", ""]);
  }

  rows.push(["Generosity", ""]);
  if (v.giftCount != null) {
    rows.push([
      "Gifts recorded (count only)",
      `${v.giftCount} separate gifts logged for ${v.monthHeading}. This is how many gifts—not how much money.`,
    ]);
  } else {
    rows.push([
      "Gifts recorded (count only)",
      `No gift rows for ${v.monthHeading} in the feed yet; they may still be syncing after month-end.`,
    ]);
  }
  if (v.giftTrendNote) rows.push(["Compared to the month before", v.giftTrendNote]);
  rows.push(["", ""]);

  rows.push(["Program life that month", ""]);
  rows.push(["Education & life skills", v.education]);
  rows.push(["Health & wellbeing", v.health]);
  rows.push(["Home & field visits", v.homeVisitsNarrative]);
  if (v.caseNotesTotal != null && v.caseNotesTotal > 0) {
    rows.push([
      "Case notes filed",
      `About ${v.caseNotesTotal} case notes or process recordings logged across sites (activity, not dollars).`,
    ]);
  }
  if (v.activeResidentsApprox != null && v.activeResidentsApprox > 0) {
    rows.push([
      "Residents in care (rough monthly snapshot)",
      `Sites reported roughly ${v.activeResidentsApprox} active resident slots combined—numbers shift daily; this is the month’s snapshot.`,
    ]);
  }
  rows.push(["", ""]);

  rows.push(["Where gifts were directed (tags, not amounts)", ""]);
  if (v.allocations.length > 0) {
    v.allocations.forEach((r, i) => {
      rows.push([
        donorFacingAllocationDisplayName(r.name, i),
        `${r.role}. ${r.bucket}. ${r.giftLineNote}`,
      ]);
    });
  }
  if (v.allocationFooterNote) {
    rows.push(["Note", v.allocationFooterNote]);
  }
  rows.push(["", ""]);

  rows.push([
    "Questions",
    "Contact the office that shared this letter if you want to know more—without sharing private details in a mass update.",
  ]);

  downloadCsv(`bonfire-donor-update-${v.monthKey}.csv`, [...headers], rows);
}
