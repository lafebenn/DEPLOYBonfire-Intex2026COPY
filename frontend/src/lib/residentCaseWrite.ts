/** Body shape for POST /api/residents and PUT /api/residents/{id} (matches backend ResidentWriteDto). */

export type ResidentCaseWrite = {
  caseControlNo: string;
  internalCode: string;
  safehouseId: number;
  caseStatus: string;
  sex: string;
  dateOfBirth: string;
  birthStatus: string;
  placeOfBirth: string;
  religion: string;
  caseCategory: string;
  subCatOrphaned: boolean;
  subCatTrafficked: boolean;
  subCatChildLabor: boolean;
  subCatPhysicalAbuse: boolean;
  subCatSexualAbuse: boolean;
  subCatOsaec: boolean;
  subCatCicl: boolean;
  subCatAtRisk: boolean;
  subCatStreetChild: boolean;
  subCatChildWithHiv: boolean;
  isPwd: boolean;
  pwdType: string | null;
  hasSpecialNeeds: boolean;
  specialNeedsDiagnosis: string | null;
  familyIs4ps: boolean;
  familySoloParent: boolean;
  familyIndigenous: boolean;
  familyParentPwd: boolean;
  familyInformalSettler: boolean;
  dateOfAdmission: string;
  referralSource: string;
  referringAgencyPerson: string;
  assignedSocialWorker: string;
  initialCaseAssessment: string;
  reintegrationType: string | null;
  reintegrationStatus: string | null;
  initialRiskLevel: string;
  currentRiskLevel: string;
  dateEnrolled: string;
  dateClosed: string | null;
  notesRestricted: string | null;
};

export function residentGetToWritePayload(raw: Record<string, unknown>): ResidentCaseWrite {
  const str = (k: string, d = "") => {
    const v = raw[k];
    if (v == null) return d;
    return String(v);
  };
  const dateStr = (k: string, d = "") => {
    const v = raw[k];
    if (v == null || v === "") return d;
    const s = String(v);
    return s.length >= 10 ? s.slice(0, 10) : s;
  };
  const bool = (k: string) => Boolean(raw[k]);
  const num = (k: string, d = 0) => {
    const v = raw[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    const n = Number(v);
    return Number.isNaN(n) ? d : n;
  };
  const optStr = (k: string): string | null => {
    const v = raw[k];
    if (v == null || v === "") return null;
    return String(v);
  };

  const dateOfAdmission = dateStr("dateOfAdmission");
  const dateEnrolled = dateStr("dateEnrolled") || dateOfAdmission;

  return {
    caseControlNo: str("caseControlNo"),
    internalCode: str("internalCode"),
    safehouseId: num("safehouseId", 1),
    caseStatus: str("caseStatus", "Active"),
    sex: str("sex", "F"),
    dateOfBirth: dateStr("dateOfBirth", "2010-01-01"),
    birthStatus: str("birthStatus", "Live Birth"),
    placeOfBirth: str("placeOfBirth"),
    religion: str("religion"),
    caseCategory: str("caseCategory"),
    subCatOrphaned: bool("subCatOrphaned"),
    subCatTrafficked: bool("subCatTrafficked"),
    subCatChildLabor: bool("subCatChildLabor"),
    subCatPhysicalAbuse: bool("subCatPhysicalAbuse"),
    subCatSexualAbuse: bool("subCatSexualAbuse"),
    subCatOsaec: bool("subCatOsaec"),
    subCatCicl: bool("subCatCicl"),
    subCatAtRisk: bool("subCatAtRisk"),
    subCatStreetChild: bool("subCatStreetChild"),
    subCatChildWithHiv: bool("subCatChildWithHiv"),
    isPwd: bool("isPwd"),
    pwdType: optStr("pwdType"),
    hasSpecialNeeds: bool("hasSpecialNeeds"),
    specialNeedsDiagnosis: optStr("specialNeedsDiagnosis"),
    familyIs4ps: bool("familyIs4ps"),
    familySoloParent: bool("familySoloParent"),
    familyIndigenous: bool("familyIndigenous"),
    familyParentPwd: bool("familyParentPwd"),
    familyInformalSettler: bool("familyInformalSettler"),
    dateOfAdmission,
    referralSource: str("referralSource"),
    referringAgencyPerson: str("referringAgencyPerson"),
    assignedSocialWorker: str("assignedSocialWorker"),
    initialCaseAssessment: str("initialCaseAssessment"),
    reintegrationType: optStr("reintegrationType"),
    reintegrationStatus: optStr("reintegrationStatus"),
    initialRiskLevel: str("initialRiskLevel", "Low"),
    currentRiskLevel: str("currentRiskLevel", "Low"),
    dateEnrolled,
    dateClosed: optStr("dateClosed"),
    notesRestricted: optStr("notesRestricted"),
  };
}

/** Default form state for new intake (API-safe after safehouse is chosen). */
export function defaultIntakeForm(): ResidentCaseWrite {
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date(today + "T12:00:00");
  d.setFullYear(d.getFullYear() - 12);
  const defaultDob = d.toISOString().slice(0, 10);
  return {
    caseControlNo: "",
    internalCode: "",
    safehouseId: 0,
    caseStatus: "Active",
    sex: "F",
    dateOfBirth: defaultDob,
    birthStatus: "Live Birth",
    placeOfBirth: "",
    religion: "",
    caseCategory: "",
    subCatOrphaned: false,
    subCatTrafficked: false,
    subCatChildLabor: false,
    subCatPhysicalAbuse: false,
    subCatSexualAbuse: false,
    subCatOsaec: false,
    subCatCicl: false,
    subCatAtRisk: false,
    subCatStreetChild: false,
    subCatChildWithHiv: false,
    isPwd: false,
    pwdType: null,
    hasSpecialNeeds: false,
    specialNeedsDiagnosis: null,
    familyIs4ps: false,
    familySoloParent: false,
    familyIndigenous: false,
    familyParentPwd: false,
    familyInformalSettler: false,
    dateOfAdmission: today,
    referralSource: "",
    referringAgencyPerson: "",
    assignedSocialWorker: "",
    initialCaseAssessment: "",
    reintegrationType: null,
    reintegrationStatus: null,
    initialRiskLevel: "Low",
    currentRiskLevel: "Low",
    dateEnrolled: today,
    dateClosed: null,
    notesRestricted: null,
  };
}

export function toApiWriteBody(form: ResidentCaseWrite): Record<string, unknown> {
  const trimOrNull = (s: string | null) => {
    if (s == null) return null;
    const t = s.trim();
    return t === "" ? null : t;
  };
  return {
    ...form,
    pwdType: trimOrNull(form.pwdType),
    specialNeedsDiagnosis: trimOrNull(form.specialNeedsDiagnosis),
    reintegrationType: trimOrNull(form.reintegrationType),
    reintegrationStatus: trimOrNull(form.reintegrationStatus),
    dateClosed: form.dateClosed?.trim() ? form.dateClosed.trim().slice(0, 10) : null,
    notesRestricted: trimOrNull(form.notesRestricted),
  };
}
