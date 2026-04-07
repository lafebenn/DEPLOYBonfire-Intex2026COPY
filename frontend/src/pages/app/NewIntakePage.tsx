import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { residentsApi, safehousesApi } from "@/lib/api";

const programs = ["Residential", "Outpatient", "Aftercare"];
const statuses = ["Active", "Transitioning", "Completed"] as const;

export default function NewIntakePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const defaultAdmitted = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [residentId, setResidentId] = useState("");
  const [name, setName] = useState("");
  const [program, setProgram] = useState<string>(programs[0]);
  const [status, setStatus] = useState<(typeof statuses)[number]>("Active");
  const [admitted, setAdmitted] = useState(defaultAdmitted);
  const [safehouseId, setSafehouseId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    safehousesApi
      .list()
      .then((res) => {
        if (!res.success) return;
        const list = res.data as { safehouseId: number }[];
        if (list.length > 0) setSafehouseId(list[0].safehouseId);
      })
      .catch(() => {});
  }, []);

  const canSubmit =
    residentId.trim().length > 0 &&
    name.trim().length > 0 &&
    admitted.trim().length > 0 &&
    safehouseId != null;

  function dateOfBirthFromAdmission(admissionIso: string): string {
    const d = new Date(admissionIso + "T12:00:00");
    d.setFullYear(d.getFullYear() - 12);
    return d.toISOString().slice(0, 10);
  }

  function mapCaseStatus(s: (typeof statuses)[number]): string {
    if (s === "Completed") return "Closed";
    if (s === "Transitioning") return "Active";
    return s;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">New Intake</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Create a new case intake (stored locally for now).
        </p>
      </div>

      {submitError && <div className="text-sm text-destructive">{submitError}</div>}

      <Card className="card-warm">
        <CardHeader>
          <CardTitle>Case details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="residentId">Resident ID</Label>
              <Input
                id="residentId"
                placeholder="R-2026-001"
                value={residentId}
                onChange={(e) => setResidentId(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                placeholder="Jane D."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Program</Label>
              <Select value={program} onValueChange={setProgram}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as (typeof statuses)[number])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admitted">Admission date</Label>
              <Input
                id="admitted"
                type="date"
                value={admitted}
                onChange={(e) => setAdmitted(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/app/caseload")}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit || submitting}
              onClick={() => {
                setSubmitError(null);
                setSubmitting(true);
                const dob = dateOfBirthFromAdmission(admitted);
                const body = {
                  caseControlNo: residentId.trim(),
                  internalCode: name.trim(),
                  safehouseId: safehouseId!,
                  caseStatus: mapCaseStatus(status),
                  sex: "F",
                  dateOfBirth: dob,
                  birthStatus: "Live Birth",
                  placeOfBirth: "",
                  religion: "",
                  caseCategory: program,
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
                  pwdType: null as string | null,
                  hasSpecialNeeds: false,
                  specialNeedsDiagnosis: null as string | null,
                  familyIs4ps: false,
                  familySoloParent: false,
                  familyIndigenous: false,
                  familyParentPwd: false,
                  familyInformalSettler: false,
                  dateOfAdmission: admitted,
                  referralSource: "Intake form",
                  referringAgencyPerson: "",
                  assignedSocialWorker: "TBD",
                  initialCaseAssessment: "Pending intake review",
                  reintegrationType: null as string | null,
                  reintegrationStatus: null as string | null,
                  initialRiskLevel: "Low",
                  currentRiskLevel: "Low",
                  dateEnrolled: admitted,
                  dateClosed: null as string | null,
                  notesRestricted: null as string | null,
                };
                residentsApi
                  .create(body)
                  .then((res) => {
                    if (!res.success) throw new Error(res.message || "Failed to create intake");
                    toast({
                      title: "Intake created",
                      description: `Added ${residentId.trim()} to the caseload.`,
                    });
                    navigate("/app/caseload");
                  })
                  .catch((err: Error) => setSubmitError(err.message ?? "Failed to save"))
                  .finally(() => setSubmitting(false));
              }}
            >
              Save intake
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
