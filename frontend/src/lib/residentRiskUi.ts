/**
 * Case risk level → urgency tier for outline badge styling (aligned with admin dashboard).
 * 0 = low / unknown, 1 = medium, 2 = high, 3 = critical.
 */
export function caseRiskFlameTier(level: string | null | undefined): number {
  const l = String(level ?? "").trim().toLowerCase();
  if (!l) return 0;
  if (l.includes("critical")) return 3;
  if (l.includes("high")) return 2;
  if (l.includes("medium")) return 1;
  if (l.includes("low")) return 0;
  return 0;
}

export function riskTierBadgeClass(tier: number): string {
  if (tier >= 3) {
    return "border-red-500/55 bg-red-500/10 text-red-600 shadow-[0_0_10px_-4px_rgba(239,68,68,0.45)] dark:text-red-400 dark:bg-red-500/15 dark:border-red-500/45";
  }
  if (tier >= 2) {
    return "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400 dark:bg-orange-500/15 dark:border-orange-500/45";
  }
  if (tier >= 1) {
    return "border-amber-500/45 bg-amber-500/10 text-amber-800 dark:text-amber-400 dark:bg-amber-500/15 dark:border-amber-500/40";
  }
  return "border-muted-foreground/25 bg-muted/40 text-muted-foreground";
}

export function riskLevelBadgeClassFromLevel(level: string | null | undefined): string {
  return riskTierBadgeClass(caseRiskFlameTier(level));
}
