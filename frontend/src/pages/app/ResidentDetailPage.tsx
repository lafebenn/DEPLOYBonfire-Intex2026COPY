import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Home,
  Shield,
  User,
  Users,
  AlertTriangle,
} from "lucide-react";
import { residentsApi } from "@/lib/api";

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-2 border-b border-border/80 last:border-0">
      <dt className="text-sm text-muted-foreground sm:w-48 shrink-0">{label}</dt>
      <dd className="text-sm text-foreground font-medium">{value}</dd>
    </div>
  );
}

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

  const [resident, setResident] = useState<ResidentApi | null>(null);
  const [recordings, setRecordings] = useState<ProcessRec[]>([]);
  const [visits, setVisits] = useState<HomeVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!residentId || Number.isNaN(idNum)) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    Promise.all([
      residentsApi.get(idNum),
      residentsApi.processRecordings(idNum),
      residentsApi.homeVisitations(idNum),
    ])
      .then(([res, recRes, visRes]) => {
        if (!res.success) {
          if (res.message?.toLowerCase().includes("not found")) setNotFound(true);
          else throw new Error(res.message || "Failed to load resident");
          return;
        }
        setResident(res.data as ResidentApi);
        if (recRes.success) setRecordings(recRes.data as ProcessRec[]);
        if (visRes.success) setVisits(visRes.data as HomeVisit[]);
      })
      .catch((err: Error) => setError(err.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, [residentId, idNum]);

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
              <Link to="/app/case-conferences">
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
              recordings.map((rec) => (
                <div key={rec.recordingId} className="text-sm border-b border-border/60 last:border-0 pb-3 last:pb-0">
                  <p className="font-medium">{rec.sessionType}</p>
                  <p className="text-muted-foreground text-xs mt-1">{rec.sessionDate} · {rec.socialWorker}</p>
                  <p className="text-foreground mt-2 leading-relaxed">{rec.sessionNarrative}</p>
                </div>
              ))
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
              visits.map((v) => (
                <div key={v.visitationId} className="text-sm border-b border-border/60 last:border-0 pb-3 last:pb-0">
                  <p className="font-medium">{v.locationVisited}</p>
                  <p className="text-muted-foreground text-xs mt-1">{v.visitDate} · {v.socialWorker}</p>
                  <p className="text-foreground mt-2">{v.visitOutcome}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
