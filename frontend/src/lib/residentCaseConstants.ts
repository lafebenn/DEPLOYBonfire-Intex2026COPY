export const CASE_STATUSES = ["Active", "Transitioning", "Completed", "Closed", "Transferred"] as const;
export const RISK_LEVELS = ["Low", "Medium", "High", "Critical"] as const;

/** Canonical program / case lines (align with internal reporting). */
export const CASE_CATEGORIES = [
  "Residential care",
  "Community-based",
  "Aftercare / follow-up",
  "Emergency shelter",
  "Legal / referral support",
  "Education support",
  "Other",
] as const;

export const BIRTH_STATUSES = ["Live Birth", "Stillbirth", "Unknown", "Not declared"] as const;

export const RELIGIONS = [
  "Roman Catholic",
  "Christian (other)",
  "Islam",
  "Indigenous belief",
  "None / not declared",
  "Other",
] as const;

export const REFERRAL_SOURCES = [
  "DSWD",
  "LGUs / barangay",
  "Police / WCPD",
  "NGO partner",
  "School",
  "Self / family",
  "Hospital / clinic",
  "Other",
] as const;

export const REINTEGRATION_TYPES = [
  "Family reunification",
  "Independent living",
  "Foster / kinship",
  "Alternative care",
  "Not applicable",
  "Other",
] as const;

export const REINTEGRATION_STATUSES = [
  "Not started",
  "In progress",
  "Completed",
  "Deferred",
  "Not applicable",
] as const;

export const PWD_TYPES = [
  "Physical",
  "Sensory (hearing / vision)",
  "Intellectual / developmental",
  "Psychosocial",
  "Multiple",
  "Not specified",
] as const;
