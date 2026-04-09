import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ResidentCaseWrite } from "@/lib/residentCaseWrite";
import {
  BIRTH_STATUSES,
  CASE_CATEGORIES,
  CASE_STATUSES,
  PWD_TYPES,
  REFERRAL_SOURCES,
  RELIGIONS,
  REINTEGRATION_STATUSES,
  REINTEGRATION_TYPES,
  RISK_LEVELS,
} from "@/lib/residentCaseConstants";
import { cn } from "@/lib/utils";

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

function FlagToggleRow({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (c: boolean) => void;
  label: string;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 text-sm rounded-lg border p-3 transition-colors cursor-pointer",
        checked ? "border-primary/50 bg-primary/10 shadow-sm" : "border-border bg-card hover:bg-muted/40",
      )}
    >
      <Checkbox checked={checked} onCheckedChange={(c) => onCheckedChange(c === true)} className="shrink-0" />
      <span className="leading-snug">{label}</span>
    </label>
  );
}

function withLegacyOption<T extends readonly string[]>(list: T, current: string): string[] {
  const base = [...list] as string[];
  if (current && !base.includes(current)) base.unshift(current);
  return base;
}

export function ResidentCaseFormFields({ form, patch, safehouses, idPrefix = "rc" }: Props) {
  const id = (suffix: string) => `${idPrefix}-${suffix}`;

  const categoryItems = useMemo(() => withLegacyOption(CASE_CATEGORIES, form.caseCategory), [form.caseCategory]);
  const birthItems = useMemo(() => withLegacyOption(BIRTH_STATUSES, form.birthStatus), [form.birthStatus]);
  const religionItems = useMemo(() => withLegacyOption(RELIGIONS, form.religion), [form.religion]);
  const referralItems = useMemo(() => withLegacyOption(REFERRAL_SOURCES, form.referralSource), [form.referralSource]);
  const reintTypeItems = useMemo(
    () => withLegacyOption(REINTEGRATION_TYPES, form.reintegrationType ?? ""),
    [form.reintegrationType],
  );
  const reintStatusItems = useMemo(
    () => withLegacyOption(REINTEGRATION_STATUSES, form.reintegrationStatus ?? ""),
    [form.reintegrationStatus],
  );
  const pwdTypeItems = useMemo(() => withLegacyOption(PWD_TYPES, form.pwdType ?? ""), [form.pwdType]);

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
          <Label>Case category / program</Label>
          <Select value={form.caseCategory || categoryItems[0]!} onValueChange={(v) => patch("caseCategory", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryItems.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Label>Birth status</Label>
          <Select value={form.birthStatus || birthItems[0]!} onValueChange={(v) => patch("birthStatus", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {birthItems.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("pob")}>Place of birth</Label>
          <Input id={id("pob")} value={form.placeOfBirth} onChange={(e) => patch("placeOfBirth", e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Religion</Label>
          <Select value={form.religion || religionItems[0]!} onValueChange={(v) => patch("religion", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {religionItems.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Label>Reintegration type</Label>
          <Select
            value={form.reintegrationType ?? "__none__"}
            onValueChange={(v) => patch("reintegrationType", v === "__none__" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Not set</SelectItem>
              {reintTypeItems.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Reintegration status</Label>
          <Select
            value={form.reintegrationStatus ?? "__none__"}
            onValueChange={(v) => patch("reintegrationStatus", v === "__none__" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Not set</SelectItem>
              {reintStatusItems.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <FlagToggleRow
            key={key}
            checked={form[key]}
            onCheckedChange={(c) => patch(key, c)}
            label={label}
          />
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
          <FlagToggleRow key={key} checked={form[key]} onCheckedChange={(c) => patch(key, c)} label={label} />
        ))}
      </div>

      <SectionTitle>Disability & special needs</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-4">
        <FlagToggleRow checked={form.isPwd} onCheckedChange={(c) => patch("isPwd", c)} label="PWD" />
        <FlagToggleRow
          checked={form.hasSpecialNeeds}
          onCheckedChange={(c) => patch("hasSpecialNeeds", c)}
          label="Special needs"
        />
        <div className="space-y-2 sm:col-span-2">
          <Label>PWD type</Label>
          <Select
            value={form.pwdType ?? "__none__"}
            onValueChange={(v) => patch("pwdType", v === "__none__" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Not specified</SelectItem>
              {pwdTypeItems.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={id("sn")}>Special needs notes</Label>
          <Textarea
            id={id("sn")}
            rows={2}
            value={form.specialNeedsDiagnosis ?? ""}
            onChange={(e) => patch("specialNeedsDiagnosis", e.target.value.trim() === "" ? null : e.target.value)}
          />
        </div>
      </div>

      <SectionTitle>Referral & assignment</SectionTitle>
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Referral source</Label>
          <Select value={form.referralSource || referralItems[0]!} onValueChange={(v) => patch("referralSource", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {referralItems.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
