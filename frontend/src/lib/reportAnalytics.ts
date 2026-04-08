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
  intakes: IntakeCase[];
  visits: HomeVisit[];
  donations: Donation[];
  conferences: Conference[];
  recordings: ProcessRecording[];
  totalResidents: number;
  byStatus: Record<string, number>;
  byProgram: ProgramBreakdown[];
  avgProgressActive: number | null;
  transitioningOrCompleted: number;
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
  conferencesCompleted: number;
  conferencesUpcoming: number;
  /** Simple “insight” strings for the UI */
  insights: string[];
};

function countBy<T>(items: T[], keyFn: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    const k = keyFn(it);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export function computeReportAnalytics(): ReportAnalytics {
  const intakes = localData.listIntakes();
  const visits = localData.listVisits();
  const donations = localData.listDonations();
  const conferences = localData.listConferences();
  const recordings = localData.listRecordings();
  const now = new Date();
  const periodLabel = `Calendar year ${now.getFullYear()} (YTD — demo aggregates from local records)`;

  const byStatus = countBy(intakes, (i) => i.status);
  const programCounts = countBy(intakes, (i) => i.program || "Unspecified");
  const byProgram: ProgramBreakdown[] = Object.entries(programCounts)
    .map(([program, count]) => ({ program, count }))
    .sort((a, b) => b.count - a.count);

  const active = intakes.filter((i) => i.status === "Active");
  const avgProgressActive =
    active.length > 0 ? active.reduce((s, i) => s + i.progress, 0) / active.length : null;

  const transitioningOrCompleted = intakes.filter(
    (i) => i.status === "Transitioning" || i.status === "Completed",
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

  const insights: string[] = [];
  if (visitCompletionRate !== null && visitTotal >= 3) {
    if (visitCompletionRate >= 0.85) {
      insights.push("Home visit documentation is strong: most scheduled visits are marked completed.");
    } else if (visitCompletionRate < 0.5) {
      insights.push("Many visits remain scheduled—follow up on field completion and documentation.");
    }
  }
  if (avgProgressActive !== null && active.length >= 2) {
    insights.push(
      `Active residents average ${Math.round(avgProgressActive)}% progress on case plans—use reports to spot stalled cases.`,
    );
  }
  if (byAllocation[0]) {
    insights.push(
      `Largest share of recorded giving is allocated to “${byAllocation[0].allocation}” (${byAllocation[0].count} gifts in local data).`,
    );
  }
  if (transitioningOrCompleted > 0 && intakes.length > 0) {
    const pct = Math.round((transitioningOrCompleted / intakes.length) * 100);
    insights.push(
      `${pct}% of resident records show transitioning or completed status—track reintegration outcomes in the annex tables.`,
    );
  }
  if (recordings.length > 0 && intakes.length > 0 && recordings.length / intakes.length < 2) {
    insights.push("Process recordings per resident are low relative to caseload—consider documentation sprints.");
  }
  if (insights.length === 0) {
    insights.push(
      "Add residents, visits, donations, and process recordings to unlock trend charts and program comparisons.",
    );
  }

  return {
    generatedAt: now.toISOString(),
    periodLabel,
    intakes,
    visits,
    donations,
    conferences,
    recordings,
    totalResidents: intakes.length,
    byStatus,
    byProgram,
    avgProgressActive,
    transitioningOrCompleted,
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
    conferencesCompleted,
    conferencesUpcoming,
    insights,
  };
}

export function accomplishmentTableRows(a: ReportAnalytics) {
  return [
    { label: "Residents in caseload (records)", value: String(a.totalResidents) },
    { label: "Active", value: String(a.byStatus.Active ?? 0) },
    { label: "Transitioning", value: String(a.byStatus.Transitioning ?? 0) },
    { label: "Completed / closed (outcomes)", value: String(a.byStatus.Completed ?? 0) },
    { label: "Process recordings (counseling / case notes)", value: String(a.totalRecordings) },
    { label: "Home visits — completed", value: String(a.visitsCompleted) },
    { label: "Home visits — scheduled / pending", value: String(a.visitsScheduled) },
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
