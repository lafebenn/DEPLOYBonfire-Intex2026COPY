import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ResidentCaseWrite } from "@/lib/residentCaseWrite";
import { CASE_STATUSES, RISK_LEVELS } from "@/lib/residentCaseConstants";

export type SafehouseOption = { safehouseId: number; name: string; safehouseCode?: string };

type Props = {
  form: ResidentCaseWrite;
  patch: <K extends keyof ResidentCaseWrite>(key: K, value: ResidentCaseWrite[K]) => void;
  safehouses: SafehouseOption[];
  /** Prefix for input ids (avoid duplicates if multiple forms could mount). */
  idPrefix?: string;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-foreground pt-4 first:pt-0 border-t border-border first:border-0">
      {children}
    </h3>
  );
}

export function ResidentCaseFormFields({ form, patch, safehouses, idPrefix = "rc" }: Props) {
  const id = (suffix: string) => `${idPrefix}-${suffix}`;

  return (
    <div className="space-y-4">
      <SectionTitle>Identity & placement</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={id("case")}>Case control no.</Label>
          <Input id={id("case")} value={form.caseControlNo} onChange={(e) => patch("caseControlNo", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("internal")}>Internal code / display name</Label>
          <Input id={id("internal")} value={form.internalCode} onChange={(e) => patch("internalCode", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Safehouse</Label>
          <Select
            value={form.safehouseId > 0 ? String(form.safehouseId) : undefined}
            onValueChange={(v) => patch("safehouseId", Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder={safehouses.length ? "Select site" : "Loading sites…"} />
            </SelectTrigger>
            <SelectContent>
              {safehouses.map((sh) => (
                <SelectItem key={sh.safehouseId} value={String(sh.safehouseId)}>
                  {sh.safehouseCode ? `${sh.safehouseCode} · ` : ""}
                  {sh.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Case status</Label>
          <Select value={form.caseStatus} onValueChange={(v) => patch("caseStatus", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CASE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={id("cat")}>Case category / program</Label>
          <Input id={id("cat")} value={form.caseCategory} onChange={(e) => patch("caseCategory", e.target.value)} />
        </div>
      </div>

      <SectionTitle>Demographics</SectionTitle>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Sex</Label>
          <Select value={form.sex} onValueChange={(v) => patch("sex", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="F">F</SelectItem>
              <SelectItem value="M">M</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("dob")}>Date of birth</Label>
          <Input id={id("dob")} type="date" value={form.dateOfBirth} onChange={(e) => patch("dateOfBirth", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("birth")}>Birth status</Label>
          <Input id={id("birth")} value={form.birthStatus} onChange={(e) => patch("birthStatus", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("pob")}>Place of birth</Label>
          <Input id={id("pob")} value={form.placeOfBirth} onChange={(e) => patch("placeOfBirth", e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={id("rel")}>Religion</Label>
          <Input id={id("rel")} value={form.religion} onChange={(e) => patch("religion", e.target.value)} />
        </div>
      </div>

      <SectionTitle>Program dates</SectionTitle>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={id("adm")}>Date of admission</Label>
          <Input id={id("adm")} type="date" value={form.dateOfAdmission} onChange={(e) => patch("dateOfAdmission", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("enr")}>Date enrolled</Label>
          <Input id={id("enr")} type="date" value={form.dateEnrolled} onChange={(e) => patch("dateEnrolled", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("closed")}>Date closed (if any)</Label>
          <Input
            id={id("closed")}
            type="date"
            value={form.dateClosed ?? ""}
            onChange={(e) => patch("dateClosed", e.target.value.trim() === "" ? null : e.target.value)}
          />
        </div>
      </div>

      <SectionTitle>Risk & reintegration</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Initial risk</Label>
          <Select value={form.initialRiskLevel} onValueChange={(v) => patch("initialRiskLevel", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RISK_LEVELS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Current risk</Label>
          <Select value={form.currentRiskLevel} onValueChange={(v) => patch("currentRiskLevel", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RISK_LEVELS.map((r) => (
                <SelectItem key={`c-${r}`} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("reint-type")}>Reintegration type</Label>
          <Input
            id={id("reint-type")}
            value={form.reintegrationType ?? ""}
            onChange={(e) => patch("reintegrationType", e.target.value.trim() === "" ? null : e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("reint-st")}>Reintegration status</Label>
          <Input
            id={id("reint-st")}
            value={form.reintegrationStatus ?? ""}
            onChange={(e) => patch("reintegrationStatus", e.target.value.trim() === "" ? null : e.target.value)}
          />
        </div>
      </div>

      <SectionTitle>Case flags (vulnerability categories)</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-3">
        {(
          [
            ["subCatOrphaned", "Orphaned"],
            ["subCatTrafficked", "Trafficked"],
            ["subCatChildLabor", "Child labor"],
            ["subCatPhysicalAbuse", "Physical abuse"],
            ["subCatSexualAbuse", "Sexual abuse"],
            ["subCatOsaec", "OSAEC / CSAEM"],
            ["subCatCicl", "CICL"],
            ["subCatAtRisk", "At risk (CAR)"],
            ["subCatStreetChild", "Street child"],
            ["subCatChildWithHiv", "Child with HIV"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <Checkbox checked={form[key]} onCheckedChange={(c) => patch(key, c === true)} />
            {label}
          </label>
        ))}
      </div>

      <SectionTitle>Family & household</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-3">
        {(
          [
            ["familyIs4ps", "4Ps beneficiary"],
            ["familySoloParent", "Solo parent household"],
            ["familyIndigenous", "Indigenous group"],
            ["familyParentPwd", "Parent / guardian PWD"],
            ["familyInformalSettler", "Informal settler / homeless"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <Checkbox checked={form[key]} onCheckedChange={(c) => patch(key, c === true)} />
            {label}
          </label>
        ))}
      </div>

      <SectionTitle>Disability & special needs</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.isPwd} onCheckedChange={(c) => patch("isPwd", c === true)} />
          PWD
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.hasSpecialNeeds} onCheckedChange={(c) => patch("hasSpecialNeeds", c === true)} />
          Special needs
        </label>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={id("pwd")}>PWD type</Label>
          <Input
            id={id("pwd")}
            value={form.pwdType ?? ""}
            onChange={(e) => patch("pwdType", e.target.value.trim() === "" ? null : e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={id("sn")}>Special needs notes</Label>
          <Input
            id={id("sn")}
            value={form.specialNeedsDiagnosis ?? ""}
            onChange={(e) => patch("specialNeedsDiagnosis", e.target.value.trim() === "" ? null : e.target.value)}
          />
        </div>
      </div>

      <SectionTitle>Referral & assignment</SectionTitle>
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor={id("ref-src")}>Referral source</Label>
          <Input id={id("ref-src")} value={form.referralSource} onChange={(e) => patch("referralSource", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("ref-person")}>Referring agency / person</Label>
          <Input
            id={id("ref-person")}
            value={form.referringAgencyPerson}
            onChange={(e) => patch("referringAgencyPerson", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("sw")}>Assigned social worker</Label>
          <Input id={id("sw")} value={form.assignedSocialWorker} onChange={(e) => patch("assignedSocialWorker", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("assess")}>Initial case assessment</Label>
          <Textarea
            id={id("assess")}
            rows={4}
            value={form.initialCaseAssessment}
            onChange={(e) => patch("initialCaseAssessment", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("notes")}>Case notes (restricted summary)</Label>
          <Textarea
            id={id("notes")}
            rows={3}
            value={form.notesRestricted ?? ""}
            onChange={(e) => patch("notesRestricted", e.target.value.trim() === "" ? null : e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
