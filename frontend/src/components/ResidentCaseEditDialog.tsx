import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { residentsApi, safehousesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { ResidentCaseWrite } from "@/lib/residentCaseWrite";
import { toApiWriteBody } from "@/lib/residentCaseWrite";

const CASE_STATUSES = ["Active", "Transitioning", "Completed", "Closed", "Transferred"] as const;
const RISK_LEVELS = ["Low", "Medium", "High", "Critical"] as const;

type SafehouseOpt = { safehouseId: number; name: string; safehouseCode?: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: number;
  initial: ResidentCaseWrite | null;
  onSaved: () => void;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground pt-4 first:pt-0 border-t border-border first:border-0">{children}</h3>;
}

export function ResidentCaseEditDialog({ open, onOpenChange, residentId, initial, onSaved }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<ResidentCaseWrite | null>(null);
  const [safehouses, setSafehouses] = useState<SafehouseOpt[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    safehousesApi
      .list()
      .then((res) => {
        if (!res.success) return;
        setSafehouses((res.data as SafehouseOpt[]) ?? []);
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (open && initial) setForm({ ...initial });
  }, [open, initial]);

  const patch = <K extends keyof ResidentCaseWrite>(key: K, value: ResidentCaseWrite[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await residentsApi.update(residentId, toApiWriteBody(form));
      if (!res.success) throw new Error(res.message || "Update failed");
      toast({ title: "Case updated", description: "Changes were saved to the database." });
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: e instanceof Error ? e.message : "Update failed",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Edit case</DialogTitle>
          <DialogDescription>
            Update resident record fields. All changes are written to the API with your current permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 overflow-y-auto flex-1 min-h-0 space-y-4 pb-4">
          {!form ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <SectionTitle>Identity & placement</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ec-case">Case control no.</Label>
                  <Input id="ec-case" value={form.caseControlNo} onChange={(e) => patch("caseControlNo", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ec-internal">Internal code / display name</Label>
                  <Input id="ec-internal" value={form.internalCode} onChange={(e) => patch("internalCode", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Safehouse</Label>
                  <Select
                    value={String(form.safehouseId)}
                    onValueChange={(v) => patch("safehouseId", Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
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
                  <Label htmlFor="ec-cat">Case category / program</Label>
                  <Input id="ec-cat" value={form.caseCategory} onChange={(e) => patch("caseCategory", e.target.value)} />
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
                  <Label htmlFor="ec-dob">Date of birth</Label>
                  <Input id="ec-dob" type="date" value={form.dateOfBirth} onChange={(e) => patch("dateOfBirth", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ec-birth">Birth status</Label>
                  <Input id="ec-birth" value={form.birthStatus} onChange={(e) => patch("birthStatus", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ec-pob">Place of birth</Label>
                  <Input id="ec-pob" value={form.placeOfBirth} onChange={(e) => patch("placeOfBirth", e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ec-rel">Religion</Label>
                  <Input id="ec-rel" value={form.religion} onChange={(e) => patch("religion", e.target.value)} />
                </div>
              </div>

              <SectionTitle>Program dates</SectionTitle>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ec-adm">Date of admission</Label>
                  <Input id="ec-adm" type="date" value={form.dateOfAdmission} onChange={(e) => patch("dateOfAdmission", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ec-enr">Date enrolled</Label>
                  <Input id="ec-enr" type="date" value={form.dateEnrolled} onChange={(e) => patch("dateEnrolled", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ec-closed">Date closed (if any)</Label>
                  <Input
                    id="ec-closed"
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
                  <Label htmlFor="ec-reint-type">Reintegration type</Label>
                  <Input
                    id="ec-reint-type"
                    value={form.reintegrationType ?? ""}
                    onChange={(e) => patch("reintegrationType", e.target.value.trim() === "" ? null : e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ec-reint-st">Reintegration status</Label>
                  <Input
                    id="ec-reint-st"
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
                    <Checkbox
                      checked={form[key]}
                      onCheckedChange={(c) => patch(key, c === true)}
                    />
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
                  <Label htmlFor="ec-pwd">PWD type</Label>
                  <Input
                    id="ec-pwd"
                    value={form.pwdType ?? ""}
                    onChange={(e) => patch("pwdType", e.target.value.trim() === "" ? null : e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ec-sn">Special needs notes</Label>
                  <Input
                    id="ec-sn"
                    value={form.specialNeedsDiagnosis ?? ""}
                    onChange={(e) =>
                      patch("specialNeedsDiagnosis", e.target.value.trim() === "" ? null : e.target.value)
                    }
                  />
                </div>
              </div>

              <SectionTitle>Referral & assignment</SectionTitle>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ec-ref-src">Referral source</Label>
                  <Input id="ec-ref-src" value={form.referralSource} onChange={(e) => patch("referralSource", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ec-ref-person">Referring agency / person</Label>
                  <Input
                    id="ec-ref-person"
                    value={form.referringAgencyPerson}
                    onChange={(e) => patch("referringAgencyPerson", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ec-sw">Assigned social worker</Label>
                  <Input id="ec-sw" value={form.assignedSocialWorker} onChange={(e) => patch("assignedSocialWorker", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ec-assess">Initial case assessment</Label>
                  <Textarea
                    id="ec-assess"
                    rows={4}
                    value={form.initialCaseAssessment}
                    onChange={(e) => patch("initialCaseAssessment", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ec-notes">Case notes (restricted summary)</Label>
                  <Textarea
                    id="ec-notes"
                    rows={3}
                    value={form.notesRestricted ?? ""}
                    onChange={(e) => patch("notesRestricted", e.target.value.trim() === "" ? null : e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving || !form}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
