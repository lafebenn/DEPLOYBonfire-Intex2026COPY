import { localData, type IntakeCase } from "@/lib/localData";

/** Summary row for caseload list */
export type ResidentListItem = {
  id: string;
  name: string;
  status: "Active" | "Transitioning" | "Completed";
  program: string;
  progress: number;
  admitted: string;
};

/** Full resident profile (demo data — mirrors caseload inventory fields from INTEX) */
export type ResidentDetail = ResidentListItem & {
  internalCode: string;
  safehouse: string;
  safehouseCode: string;
  caseCategory: string;
  subcategories: { label: string; value: boolean }[];
  isPwd: boolean;
  pwdType: string | null;
  hasSpecialNeeds: boolean;
  specialNeedsNote: string | null;
  family: {
    is4ps: boolean;
    soloParent: boolean;
    indigenous: boolean;
    parentPwd: boolean;
    informalSettler: boolean;
  };
  referralSource: string;
  referringAgency: string;
  assignedSocialWorker: string;
  initialAssessment: string;
  reintegrationType: string;
  reintegrationStatus: string;
  initialRiskLevel: "Low" | "Medium" | "High" | "Critical";
  currentRiskLevel: "Low" | "Medium" | "High" | "Critical";
  dateClosed: string | null;
  notesSummary: string;
  notesRestrictedHint: string;
};

const MOCK_RESIDENTS: ResidentDetail[] = [
  {
    id: "R-2024-089",
    internalCode: "INT-089",
    name: "Jane D.",
    status: "Active",
    program: "Residential",
    progress: 75,
    admitted: "2024-01-15",
    safehouse: "Luzon Safe Home North",
    safehouseCode: "SH-01",
    caseCategory: "Neglected",
    subcategories: [
      { label: "Trafficked", value: true },
      { label: "Sexual abuse", value: true },
      { label: "Physical abuse", value: false },
      { label: "OSAEC / CSAEM", value: false },
      { label: "At risk (CAR)", value: false },
    ],
    isPwd: false,
    pwdType: null,
    hasSpecialNeeds: true,
    specialNeedsNote: "Trauma-informed counseling; anxiety management plan in place.",
    family: {
      is4ps: true,
      soloParent: true,
      indigenous: false,
      parentPwd: false,
      informalSettler: true,
    },
    referralSource: "Government Agency",
    referringAgency: "DSWD Regional Office — Field Social Worker Maria L.",
    assignedSocialWorker: "James Rivera",
    initialAssessment: "For reunification with supervised family contact",
    reintegrationType: "Family Reunification",
    reintegrationStatus: "In Progress",
    initialRiskLevel: "High",
    currentRiskLevel: "Medium",
    dateClosed: null,
    notesSummary:
      "Steady engagement in counseling; education plan on track. Next case conference in two weeks.",
    notesRestrictedHint:
      "Additional protected notes are stored separately and visible only to authorized staff.",
  },
  {
    id: "R-2024-075",
    internalCode: "INT-075",
    name: "Maria S.",
    status: "Active",
    program: "Outpatient",
    progress: 60,
    admitted: "2024-02-20",
    safehouse: "Visayas Transition Center",
    safehouseCode: "SH-02",
    caseCategory: "Surrendered",
    subcategories: [
      { label: "Trafficked", value: true },
      { label: "Child labor", value: false },
      { label: "Street child", value: false },
      { label: "CICL", value: false },
    ],
    isPwd: false,
    pwdType: null,
    hasSpecialNeeds: false,
    specialNeedsNote: null,
    family: {
      is4ps: false,
      soloParent: false,
      indigenous: true,
      parentPwd: false,
      informalSettler: false,
    },
    referralSource: "NGO",
    referringAgency: "Hope Bridge Initiative",
    assignedSocialWorker: "Sarah Mitchell",
    initialAssessment: "For foster care assessment pending",
    reintegrationType: "Foster Care",
    reintegrationStatus: "Not Started",
    initialRiskLevel: "Medium",
    currentRiskLevel: "Medium",
    dateClosed: null,
    notesSummary:
      "Attending vocational skills sessions twice weekly; transportation support arranged.",
    notesRestrictedHint:
      "Restricted medical and legal documentation is maintained in the secure case file.",
  },
  {
    id: "R-2024-062",
    internalCode: "INT-062",
    name: "Aisha T.",
    status: "Active",
    program: "Residential",
    progress: 90,
    admitted: "2023-11-08",
    safehouse: "Luzon Safe Home North",
    safehouseCode: "SH-01",
    caseCategory: "Abandoned",
    subcategories: [
      { label: "Trafficked", value: true },
      { label: "Sexual abuse", value: true },
      { label: "OSAEC / CSAEM", value: true },
    ],
    isPwd: true,
    pwdType: "Hearing impairment (moderate)",
    hasSpecialNeeds: true,
    specialNeedsNote: "Sign-language support and classroom accommodations coordinated with education partner.",
    family: {
      is4ps: true,
      soloParent: true,
      indigenous: false,
      parentPwd: false,
      informalSettler: true,
    },
    referralSource: "Police",
    referringAgency: "PNP Women & Children Protection Desk",
    assignedSocialWorker: "James Rivera",
    initialAssessment: "For long-term residential care with reintegration planning",
    reintegrationType: "Independent Living",
    reintegrationStatus: "In Progress",
    initialRiskLevel: "Critical",
    currentRiskLevel: "Low",
    dateClosed: null,
    notesSummary:
      "Strong progress in group sessions; peer mentor pairing showing positive outcomes.",
    notesRestrictedHint: "Incident follow-ups and legal referrals are logged in restricted fields.",
  },
  {
    id: "R-2024-051",
    internalCode: "INT-051",
    name: "Emily R.",
    status: "Transitioning",
    program: "Aftercare",
    progress: 95,
    admitted: "2023-09-01",
    safehouse: "Mindanao Healing House",
    safehouseCode: "SH-03",
    caseCategory: "Foundling",
    subcategories: [
      { label: "Neglected", value: true },
      { label: "Trafficked", value: false },
    ],
    isPwd: false,
    pwdType: null,
    hasSpecialNeeds: false,
    specialNeedsNote: null,
    family: {
      is4ps: false,
      soloParent: false,
      indigenous: false,
      parentPwd: false,
      informalSettler: false,
    },
    referralSource: "Community",
    referringAgency: "Barangay Council — Child Protection Officer",
    assignedSocialWorker: "Sarah Mitchell",
    initialAssessment: "For adoption (domestic) pathway exploration",
    reintegrationType: "Adoption (Domestic)",
    reintegrationStatus: "In Progress",
    initialRiskLevel: "Medium",
    currentRiskLevel: "Low",
    dateClosed: null,
    notesSummary:
      "Transition plan approved; home visits scheduled for post-placement monitoring.",
    notesRestrictedHint: "Adoption-related records are restricted to authorized personnel only.",
  },
  {
    id: "R-2024-045",
    internalCode: "INT-045",
    name: "Lin W.",
    status: "Active",
    program: "Residential",
    progress: 40,
    admitted: "2024-03-10",
    safehouse: "Visayas Transition Center",
    safehouseCode: "SH-02",
    caseCategory: "Neglected",
    subcategories: [
      { label: "At risk (CAR)", value: true },
      { label: "Physical abuse", value: true },
    ],
    isPwd: false,
    pwdType: null,
    hasSpecialNeeds: true,
    specialNeedsNote: "Sleep disruption; nursing check-ins twice weekly.",
    family: {
      is4ps: true,
      soloParent: true,
      indigenous: false,
      parentPwd: true,
      informalSettler: true,
    },
    referralSource: "Court Order",
    referringAgency: "Family Court — Case Worker R. Dela Cruz",
    assignedSocialWorker: "James Rivera",
    initialAssessment: "For residential stabilization before reunification assessment",
    reintegrationType: "Family Reunification",
    reintegrationStatus: "On Hold",
    initialRiskLevel: "High",
    currentRiskLevel: "High",
    dateClosed: null,
    notesSummary:
      "Recent home visit flagged safety concerns; intervention plan updated with supervision levels.",
    notesRestrictedHint: "Restricted field contains safety-plan specifics and third-party contacts.",
  },
  {
    id: "R-2024-030",
    internalCode: "INT-030",
    name: "Sofia M.",
    status: "Completed",
    program: "Aftercare",
    progress: 100,
    admitted: "2023-06-15",
    safehouse: "Luzon Safe Home North",
    safehouseCode: "SH-01",
    caseCategory: "Surrendered",
    subcategories: [
      { label: "Trafficked", value: true },
      { label: "Sexual abuse", value: true },
    ],
    isPwd: false,
    pwdType: null,
    hasSpecialNeeds: false,
    specialNeedsNote: null,
    family: {
      is4ps: false,
      soloParent: false,
      indigenous: false,
      parentPwd: false,
      informalSettler: false,
    },
    referralSource: "Self-Referral",
    referringAgency: "Walk-in intake (verified)",
    assignedSocialWorker: "Sarah Mitchell",
    initialAssessment: "For independent living readiness",
    reintegrationType: "Independent Living",
    reintegrationStatus: "Completed",
    initialRiskLevel: "High",
    currentRiskLevel: "Low",
    dateClosed: "2025-12-01",
    notesSummary:
      "Case closed successfully after one year of aftercare monitoring with stable employment and housing.",
    notesRestrictedHint: "Post-closure contact preferences stored in restricted notes.",
  },
];

function intakeToDetail(intake: IntakeCase): ResidentDetail {
  return {
    ...intake,
    internalCode: `INT-${intake.id.replace(/[^a-zA-Z0-9]/g, "") || "NEW"}`,
    safehouse: "— Assign on intake —",
    safehouseCode: "—",
    caseCategory: "Pending classification",
    subcategories: [
      { label: "Trafficked", value: false },
      { label: "Sexual abuse", value: false },
      { label: "Physical abuse", value: false },
    ],
    isPwd: false,
    pwdType: null,
    hasSpecialNeeds: false,
    specialNeedsNote: null,
    family: {
      is4ps: false,
      soloParent: false,
      indigenous: false,
      parentPwd: false,
      informalSettler: false,
    },
    referralSource: "—",
    referringAgency: "—",
    assignedSocialWorker: "— Unassigned",
    initialAssessment: "Intake in progress",
    reintegrationType: "None",
    reintegrationStatus: "Not Started",
    initialRiskLevel: "Medium",
    currentRiskLevel: "Medium",
    dateClosed: null,
    notesSummary: "New intake — complete assessment and assign safehouse.",
    notesRestrictedHint: "No restricted notes yet.",
  };
}

export function getResidentDetail(id: string): ResidentDetail | null {
  const decoded = decodeURIComponent(id);
  const fromMock = MOCK_RESIDENTS.find((r) => r.id === decoded);
  if (fromMock) return fromMock;
  const intakes = localData.listIntakes();
  const intake = intakes.find((i) => i.id === decoded);
  if (intake) return intakeToDetail(intake);
  return null;
}

export function listResidentsForCaseload(): ResidentListItem[] {
  const intakes = localData.listIntakes();
  const intakeRows: ResidentListItem[] = intakes.map((i) => ({
    id: i.id,
    name: i.name,
    status: i.status,
    program: i.program,
    progress: i.progress,
    admitted: i.admitted,
  }));
  const mockRows: ResidentListItem[] = MOCK_RESIDENTS.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    program: r.program,
    progress: r.progress,
    admitted: r.admitted,
  }));
  // Intakes first (newest), then mocks; de-dupe by id
  const seen = new Set<string>();
  const out: ResidentListItem[] = [];
  for (const row of [...intakeRows, ...mockRows]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}
