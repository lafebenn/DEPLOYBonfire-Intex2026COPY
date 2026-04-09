import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Home,
  Pencil,
  Shield,
  Trash2,
  User,
  Users,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import {
  fetchResidentRiskPrediction,
  parseResidentRiskMlResponse,
  pickMlProxyScore,
  residentsApi,
  type ResidentRiskMlDisplay,
} from "@/lib/api";
import { ResidentCaseEditDialog } from "@/components/ResidentCaseEditDialog";
import { residentGetToWritePayload, type ResidentCaseWrite } from "@/lib/residentCaseWrite";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

function formatRuleExplanation(rule: string): string {
  const known: Record<string, string> = {
    pct_safety_concerns_gte_50: "safety concerns were flagged in over 50% of home visits",
    pct_unresolved_gte_40: "over 40% of this resident's incidents remain unresolved",
    num_self_harm_gte_2: "two or more self-harm incidents have been recorded",
    pct_high_severity_gte_30: "over 30% of recorded incidents were rated high severity",
    num_runaway_attempts_gte_1: "one or more runaway attempts have been recorded",
    pct_follow_up_required_gte_50: "over 50% of incidents require follow-up",
    pct_unfavorable_outcome_gte_40: "over 40% of home visits had unfavorable outcomes",
    pct_distressed_start_gte_60: "distress was noted at the start of over 60% of sessions",
    pct_uncooperative_family_gte_40: "family cooperation was rated uncooperative in over 40% of visits",
  };
  const key = rule.trim();
  if (known[key]) return known[key];
  return rule
    .replace(/_gte_(\d+)/g, " ≥ $1%")
    .replace(/_lte_(\d+)/g, " ≤ $1%")
    .replace(/_gt_(\d+)/g, " > $1")
    .replace(/_lt_(\d+)/g, " < $1")
    .replace(/^pct_/, "")
    .replace(/^num_/, "count of ")
    .replace(/_/g, " ")
    .trim();
}

function buildRiskExplanation(parsed: ResidentRiskMlDisplay): string {
  const trig = parsed.rulesTriggered?.trim() ?? "";
  const hasOverride =
    parsed.ruleFlag && trig !== "" && trig.toLowerCase() !== "none";
  const rules = hasOverride
    ? trig
        .split(/,\s*/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(formatRuleExplanation)
    : [];

  const combined = (parsed.combinedAlert ?? "").trim();
  const isElevated = combined.toLowerCase().includes("elevated");
  const predictedStd = (parsed.predictedLabel ?? "").toLowerCase().includes("standard");

  if (isElevated) {
    if (hasOverride && predictedStd) {
      const ruleText =
        rules.length === 1
          ? `an automatic safety rule was triggered: ${rules[0]}`
          : `automatic safety rules were triggered: ${rules.join("; ")}`;
      return `The model assessed this resident's overall profile as lower risk, but ${ruleText}. This override ensures critical safety indicators are always escalated, even when the broader profile appears stable.`;
    }
    if (hasOverride) {
      const ruleText =
        rules.length === 1
          ? `a safety rule was also triggered: ${rules[0]}`
          : `safety rules were also triggered: ${rules.join("; ")}`;
      return `The model identified elevated risk patterns in this resident's recent history, and ${ruleText}.`;
    }
    return `The model identified elevated risk patterns in this resident's recent history, including their incident record, session engagement, and health and education progress.`;
  }

  return `The model assessed this resident as standard risk. No automatic safety thresholds were triggered. This reflects their current incident record, session engagement, and health and education progress.`;
}

const riskVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Low: "secondary",
  Medium: "default",
  High: "destructive",
  Critical: "destructive",
};

type ResidentApi = {
  residentId: number;
  caseControlNo: string;
  internalCode: string;
  caseStatus: string;
  caseCategory: string;
  dateOfAdmission: string;
  dateClosed?: string | null;
  dateEnrolled?: string;
  safehouseId: number;
  safehouse?: { name?: string; safehouseCode?: string };
  assignedSocialWorker: string;
  initialRiskLevel: string;
  currentRiskLevel: string;
  reintegrationType?: string | null;
  reintegrationStatus?: string | null;
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
  pwdType?: string | null;
  hasSpecialNeeds: boolean;
  specialNeedsDiagnosis?: string | null;
  familyIs4ps: boolean;
  familySoloParent: boolean;
  familyIndigenous: boolean;
  familyParentPwd: boolean;
  familyInformalSettler: boolean;
  referralSource: string;
  referringAgencyPerson: string;
  initialCaseAssessment: string;
  notesRestricted?: string | null;
};

type ProcessRec = {
  recordingId: number;
  sessionDate: string;
  sessionType: string;
  socialWorker: string;
  sessionNarrative: string;
};

type HomeVisit = {
  visitationId: number;
  visitDate: string;
  locationVisited: string;
  visitOutcome: string;
  socialWorker: string;
};

type InterventionPlanRow = {
  planId: number;
  planCategory: string;
  planDescription: string;
  servicesProvided: string;
  targetDate: string;
  status: string;
  caseConferenceDate?: string | null;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-2 border-b border-border/80 last:border-0">
      <dt className="text-sm text-muted-foreground sm:w-48 shrink-0">{label}</dt>
      <dd className="text-sm text-foreground font-medium">{value}</dd>
    </div>
  );
}

const HISTORY_PREVIEW = 10;

function subcategoriesFrom(r: ResidentApi) {
  return [
    { label: "Orphaned", value: r.subCatOrphaned },
    { label: "Trafficked", value: r.subCatTrafficked },
    { label: "Child labor", value: r.subCatChildLabor },
    { label: "Physical abuse", value: r.subCatPhysicalAbuse },
    { label: "Sexual abuse", value: r.subCatSexualAbuse },
    { label: "OSAEC / CSAEM", value: r.subCatOsaec },
    { label: "CICL", value: r.subCatCicl },
    { label: "At risk (CAR)", value: r.subCatAtRisk },
    { label: "Street child", value: r.subCatStreetChild },
    { label: "Child with HIV", value: r.subCatChildWithHiv },
  ];
}

export default function ResidentDetailPage() {
  const { residentId } = useParams<{ residentId: string }>();
  const idNum = residentId ? Number(residentId) : NaN;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = (user?.role ?? "").toLowerCase() === "admin";

  const [resident, setResident] = useState<ResidentApi | null>(null);
  const [writeSnapshot, setWriteSnapshot] = useState<ResidentCaseWrite | null>(null);
  const [recordings, setRecordings] = useState<ProcessRec[]>([]);
  const [visits, setVisits] = useState<HomeVisit[]>([]);
  const [interventionPlans, setInterventionPlans] = useState<InterventionPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [mlPred, setMlPred] = useState<unknown>(null);
  const [mlPredLoading, setMlPredLoading] = useState(false);
  const [mlPredError, setMlPredError] = useState<string | null>(null);
  const [mlRiskDetailsOpen, setMlRiskDetailsOpen] = useState(false);
  const [recordingsExpanded, setRecordingsExpanded] = useState(false);
  const [visitsExpanded, setVisitsExpanded] = useState(false);

  const sortedRecordings = useMemo(() => {
    return [...recordings].sort((a, b) => {
      const d = b.sessionDate.localeCompare(a.sessionDate);
      return d !== 0 ? d : b.recordingId - a.recordingId;
    });
  }, [recordings]);

  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => {
      const d = b.visitDate.localeCompare(a.visitDate);
      return d !== 0 ? d : b.visitationId - a.visitationId;
    });
  }, [visits]);

  const visibleRecordings = recordingsExpanded ? sortedRecordings : sortedRecordings.slice(0, HISTORY_PREVIEW);
  const visibleVisits = visitsExpanded ? sortedVisits : sortedVisits.slice(0, HISTORY_PREVIEW);

  const residentMlSuccess = useMemo(() => {
    if (mlPredLoading || mlPredError) return false;
    const parsed = parseResidentRiskMlResponse(mlPred);
    if (parsed) {
      const trig = parsed.rulesTriggered?.trim() ?? "";
      return (
        parsed.confidenceElevated != null ||
        parsed.confidenceStandard != null ||
        (parsed.predictedLabel != null && String(parsed.predictedLabel).trim() !== "") ||
        (parsed.combinedAlert != null && String(parsed.combinedAlert).trim() !== "") ||
        (trig !== "" && trig.toLowerCase() !== "none") ||
        parsed.ruleFlag === true
      );
    }
    return pickMlProxyScore(mlPred) != null;
  }, [mlPred, mlPredLoading, mlPredError]);

  const mlRiskDetailText = useMemo(() => {
    const parts: string[] = [];
    if (mlPredError) parts.push(mlPredError);
    if (!mlPredLoading && !residentMlSuccess) {
      parts.push("No usable automated risk summary is available for this case yet.");
    }
    if (mlPred != null) {
      parts.push(typeof mlPred === "string" ? mlPred : JSON.stringify(mlPred, null, 2));
    } else if (!mlPredError && !mlPredLoading) {
      parts.push("(Empty response body)");
    }
    return parts.filter((p) => p.length > 0).join("\n\n");
  }, [mlPred, mlPredError, mlPredLoading, residentMlSuccess]);

  const loadResident = useCallback(() => {
    if (!residentId || Number.isNaN(idNum)) return;
    setLoading(true);
    setError(null);
    Promise.all([
      residentsApi.get(idNum),
      residentsApi.processRecordings(idNum),
      residentsApi.homeVisitations(idNum),
      residentsApi.interventionPlans(idNum),
    ])
      .then(([res, recRes, visRes, planRes]) => {
        if (!res.success) {
          if (res.message?.toLowerCase().includes("not found")) setNotFound(true);
          else throw new Error(res.message || "Failed to load resident");
          return;
        }
        setNotFound(false);
        const data = res.data as Record<string, unknown>;
        setResident(res.data as ResidentApi);
        setWriteSnapshot(residentGetToWritePayload(data));
        if (recRes.success) setRecordings(recRes.data as ProcessRec[]);
        if (visRes.success) setVisits(visRes.data as HomeVisit[]);
        if (planRes.success) setInterventionPlans(planRes.data as InterventionPlanRow[]);
        else setInterventionPlans([]);
      })
      .catch((err: Error) => setError(err.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, [residentId, idNum]);

  useEffect(() => {
    if (!residentId || Number.isNaN(idNum)) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    loadResident();
  }, [residentId, idNum, loadResident]);

  useEffect(() => {
    setRecordingsExpanded(false);
    setVisitsExpanded(false);
    setMlRiskDetailsOpen(false);
  }, [idNum]);

  useEffect(() => {
    if (!resident) {
      setMlPred(null);
      setMlPredError(null);
      return;
    }
    let cancelled = false;
    setMlPredLoading(true);
    setMlPredError(null);
    fetchResidentRiskPrediction(resident.residentId)
      .then((data) => {
        if (!cancelled) setMlPred(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setMlPredError(e instanceof Error ? e.message : "Could not load prediction");
      })
      .finally(() => {
        if (!cancelled) setMlPredLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resident?.residentId]);

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      const res = await residentsApi.delete(idNum);
      if (!res.success) throw new Error(res.message || "Delete failed");
      toast({ title: "Case deleted", description: "This resident was removed from the database." });
      setDeleteOpen(false);
      navigate("/app/caseload");
    } catch (e: unknown) {
      toast({
        variant: "destructive",
        title: "Could not delete",
        description: e instanceof Error ? e.message : "Delete failed",
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (error)
    return (
      <div className="p-8 space-y-4">
        <Button variant="ghost" className="w-fit -ml-2 text-muted-foreground" asChild>
          <Link to="/app/caseload">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to caseload
          </Link>
        </Button>
        <div className="text-destructive">{error}</div>
      </div>
    );

  if (!residentId || notFound || !resident) {
    return (
      <div className="space-y-6 max-w-lg">
        <Button variant="ghost" className="w-fit -ml-2 text-muted-foreground" asChild>
          <Link to="/app/caseload">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to caseload
          </Link>
        </Button>
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="font-heading">Resident not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              We couldn&apos;t find a case for that ID. It may have been removed or the link is incorrect.
            </p>
            <Button asChild>
              <Link to="/app/caseload">Return to caseload inventory</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = resident.internalCode || resident.caseControlNo;
  const safeName = resident.safehouse;
  const safehouseLabel = safeName
    ? `${safeName.safehouseCode ?? ""} ${safeName.name ?? ""}`.trim()
    : `Safehouse #${resident.safehouseId}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="w-fit -ml-2 text-muted-foreground" asChild>
          <Link to="/app/caseload">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to caseload
          </Link>
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-heading font-bold text-xl">
                {displayName[0]}
              </span>
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold">{displayName}</h1>
              <p className="text-muted-foreground mt-1">
                Case ID <span className="font-mono text-foreground">{resident.caseControlNo}</span>
                {" · "}
                Internal <span className="font-mono text-foreground">{resident.internalCode}</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant={resident.caseStatus === "Active" ? "default" : resident.caseStatus === "Closed" ? "secondary" : "outline"}>
                  {resident.caseStatus}
                </Badge>
                <Badge variant="outline">{resident.caseCategory}</Badge>
                <Badge variant="outline">{safehouseLabel}</Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button variant="default" size="sm" onClick={() => setEditOpen(true)} disabled={!writeSnapshot}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit case
            </Button>
            {isAdmin && (
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete case
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to={`/app/recordings/new?residentId=${resident.residentId}`}>
                <FileText className="h-4 w-4 mr-2" />
                Process recording
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/app/visits/new?residentId=${resident.residentId}`}>
                <Home className="h-4 w-4 mr-2" />
                Home visits
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/app/conferences/new?residentId=${resident.residentId}`}>
                <Calendar className="h-4 w-4 mr-2" />
                Conferences
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="card-warm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <User className="h-5 w-5 text-primary" />
              Case overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow label="Case category" value={resident.caseCategory} />
            <DetailRow label="Date of admission" value={resident.dateOfAdmission} />
            <DetailRow label="Case closed" value={resident.dateClosed ?? "Open case"} />
            <DetailRow label="Program" value={resident.caseCategory} />
            <DetailRow label="Progress" value="—" />
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Risk & reintegration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Risk level</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={riskVariant[resident.initialRiskLevel] ?? "outline"}>
                  Initial: {resident.initialRiskLevel}
                </Badge>
                <Badge variant={riskVariant[resident.currentRiskLevel] ?? "outline"}>
                  Current: {resident.currentRiskLevel}
                </Badge>
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
              <p className="text-xs font-medium text-foreground">Automated risk insight</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Optional model-assisted summary. Case risk badges above remain the official record.
              </p>
              {mlPredLoading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : residentMlSuccess ? (
                (() => {
                  const parsed = parseResidentRiskMlResponse(mlPred);
                  if (parsed) {
                    const looksElevated =
                      parsed.combinedAlert?.toLowerCase().includes("elevated") ||
                      parsed.predictedLabel?.toLowerCase().includes("elevated");
                    const alertVariant = looksElevated ? "destructive" : "secondary";
                    const rawRuleKeys =
                      parsed.rulesTriggered
                        ?.split(/,\s*/)
                        .map((r) => r.trim())
                        .filter((r) => r.length > 0 && r.toLowerCase() !== "none") ?? [];
                    const showRuleBadges = rawRuleKeys.length > 0;
                    return (
                      <div className="space-y-2 text-sm">
                        {(parsed.combinedAlert || parsed.predictedLabel) && (
                          <div className="flex flex-wrap items-center gap-2">
                            {parsed.combinedAlert && (
                              <Badge variant={alertVariant} className="font-normal">
                                Assessment: {parsed.combinedAlert}
                              </Badge>
                            )}
                            {parsed.predictedLabel && (
                              <Badge variant="outline" className="font-normal">
                                Model prediction: {parsed.predictedLabel}
                              </Badge>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                          {buildRiskExplanation(parsed)}
                        </p>
                        {showRuleBadges ? (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {rawRuleKeys.map((r) => (
                              <Badge key={r} variant="secondary" className="text-[10px] font-normal max-w-full break-words">
                                {formatRuleExplanation(r)}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  }
                  const s = pickMlProxyScore(mlPred);
                  return s != null ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                        {s >= 0 && s <= 1
                          ? `The service returned a probability-style estimate (${Math.round(s * 100)}%). The case risk badges above remain the official record.`
                          : `The service returned a numeric estimate (${Number(s.toFixed(2))}). The case risk badges above remain the official record.`}
                      </p>
                    </div>
                  ) : null;
                })()
              ) : (
                <div className="space-y-3">
                  <p className="text-lg font-heading font-semibold text-foreground">Coming soon</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    An automated risk estimate will appear here when the service returns data for this case.
                  </p>
                  <Collapsible open={mlRiskDetailsOpen} onOpenChange={setMlRiskDetailsOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        <ChevronDown
                          className={`h-3.5 w-3.5 mr-1.5 transition-transform ${mlRiskDetailsOpen ? "rotate-180" : ""}`}
                        />
                        {mlRiskDetailsOpen ? "Hide" : "Show"} error details
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="text-[10px] leading-snug overflow-auto max-h-48 mt-2 p-3 rounded-md bg-muted/60 border border-border whitespace-pre-wrap break-words">
                        {mlRiskDetailText}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
            </div>
            <Separator />
            <DetailRow label="Reintegration type" value={resident.reintegrationType ?? "N/A"} />
            <DetailRow label="Reintegration status" value={resident.reintegrationStatus ?? "N/A"} />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Shield className="h-5 w-5 text-primary" />
              Case flags & categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {subcategoriesFrom(resident).map((s) => (
                <li
                  key={s.label}
                  className="flex items-center justify-between text-sm py-2 border-b border-border/60 last:border-0"
                >
                  <span className="text-muted-foreground">{s.label}</span>
                  <Badge variant={s.value ? "default" : "outline"}>
                    {s.value ? "Yes" : "No"}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Users className="h-5 w-5 text-primary" />
              Family & socio-demographic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow label="4Ps beneficiary" value={resident.familyIs4ps ? "Yes" : "No"} />
            <DetailRow label="Solo parent household" value={resident.familySoloParent ? "Yes" : "No"} />
            <DetailRow label="Indigenous group" value={resident.familyIndigenous ? "Yes" : "No"} />
            <DetailRow label="Parent / guardian PWD" value={resident.familyParentPwd ? "Yes" : "No"} />
            <DetailRow label="Informal settler / homeless" value={resident.familyInformalSettler ? "Yes" : "No"} />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="font-heading">Disability & special needs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow label="PWD" value={resident.isPwd ? "Yes" : "No"} />
            <DetailRow label="PWD type" value={resident.pwdType ?? "N/A"} />
            <DetailRow label="Special needs" value={resident.hasSpecialNeeds ? "Yes" : "No"} />
            <DetailRow label="Notes" value={resident.specialNeedsDiagnosis ?? "N/A"} />
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="font-heading">Referral & assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow label="Referral source" value={resident.referralSource} />
            <DetailRow label="Referring agency / person" value={resident.referringAgencyPerson} />
            <DetailRow label="Assigned social worker" value={resident.assignedSocialWorker} />
            <DetailRow label="Initial case assessment" value={resident.initialCaseAssessment} />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <FileText className="h-5 w-5 text-primary" />
              Process recordings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recordings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No process recordings on file.</p>
            ) : (
              <>
                {sortedRecordings.length > HISTORY_PREVIEW ? (
                  <p className="text-xs text-muted-foreground">
                    Showing {visibleRecordings.length} of {sortedRecordings.length} (newest first).
                  </p>
                ) : null}
                {visibleRecordings.map((rec) => (
                  <div key={rec.recordingId} className="text-sm border-b border-border/60 last:border-0 pb-3 last:pb-0">
                    <p className="font-medium">{rec.sessionType}</p>
                    <p className="text-muted-foreground text-xs mt-1">{rec.sessionDate} · {rec.socialWorker}</p>
                    <p className="text-foreground mt-2 leading-relaxed">{rec.sessionNarrative}</p>
                  </div>
                ))}
                {sortedRecordings.length > HISTORY_PREVIEW ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    aria-expanded={recordingsExpanded}
                    onClick={() => setRecordingsExpanded((e) => !e)}
                  >
                    {recordingsExpanded
                      ? "Show fewer"
                      : `See ${sortedRecordings.length - HISTORY_PREVIEW} more`}
                  </Button>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Home className="h-5 w-5 text-primary" />
              Home visitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {visits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No home visitations on file.</p>
            ) : (
              <>
                {sortedVisits.length > HISTORY_PREVIEW ? (
                  <p className="text-xs text-muted-foreground">
                    Showing {visibleVisits.length} of {sortedVisits.length} (newest first).
                  </p>
                ) : null}
                {visibleVisits.map((v) => (
                  <div key={v.visitationId} className="text-sm border-b border-border/60 last:border-0 pb-3 last:pb-0">
                    <p className="font-medium">{v.locationVisited}</p>
                    <p className="text-muted-foreground text-xs mt-1">{v.visitDate} · {v.socialWorker}</p>
                    <p className="text-foreground mt-2">{v.visitOutcome}</p>
                  </div>
                ))}
                {sortedVisits.length > HISTORY_PREVIEW ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    aria-expanded={visitsExpanded}
                    onClick={() => setVisitsExpanded((e) => !e)}
                  >
                    {visitsExpanded ? "Show fewer" : `See ${sortedVisits.length - HISTORY_PREVIEW} more`}
                  </Button>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="card-warm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <Calendar className="h-5 w-5 text-primary" />
            Case conferences & intervention plans
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {interventionPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No intervention plans or scheduled conferences on file.</p>
          ) : (
            interventionPlans.map((p) => (
              <div key={p.planId} className="text-sm border-b border-border/60 last:border-0 pb-4 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{p.planCategory}</p>
                  {p.caseConferenceDate ? (
                    <Badge variant="secondary" className="text-xs">
                      Conference {p.caseConferenceDate}
                    </Badge>
                  ) : null}
                  <Badge variant="outline" className="text-xs">
                    {p.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs mt-1">Target review: {p.targetDate}</p>
                <p className="text-foreground mt-2 whitespace-pre-wrap leading-relaxed">{p.planDescription}</p>
                {p.servicesProvided?.trim() ? (
                  <p className="text-muted-foreground text-xs mt-2">Services: {p.servicesProvided}</p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="card-warm border-dashed">
        <CardHeader>
          <CardTitle className="text-base font-heading">Case notes (summary)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed">
            {resident.notesRestricted?.trim() ? resident.notesRestricted : "No summary on file."}
          </p>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            Additional protected notes are stored separately and visible only to authorized staff.
          </p>
        </CardContent>
      </Card>

      <ResidentCaseEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        residentId={resident.residentId}
        initial={writeSnapshot}
        onSaved={loadResident}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this case?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This permanently removes <strong>{displayName}</strong> ({resident.caseControlNo}) and related records
                that cascade from the database (process recordings, visits, education, health, plans, incidents).
              </span>
              <span className="block text-destructive font-medium">This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={deleteBusy} onClick={() => void handleDelete()}>
              {deleteBusy ? "Deleting…" : "Delete permanently"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
