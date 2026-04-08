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

function monthKey(isoDate: string): string {
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
    const m = monthKey(d.date);
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
