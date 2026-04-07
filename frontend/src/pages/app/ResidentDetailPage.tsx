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
import { getResidentDetail } from "@/lib/residentData";

const riskVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Low: "secondary",
  Medium: "default",
  High: "destructive",
  Critical: "destructive",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-2 border-b border-border/80 last:border-0">
      <dt className="text-sm text-muted-foreground sm:w-48 shrink-0">{label}</dt>
      <dd className="text-sm text-foreground font-medium">{value}</dd>
    </div>
  );
}

export default function ResidentDetailPage() {
  const { residentId } = useParams<{ residentId: string }>();
  const resident = residentId ? getResidentDetail(residentId) : null;

  if (!residentId || !resident) {
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
                {resident.name[0]}
              </span>
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold">{resident.name}</h1>
              <p className="text-muted-foreground mt-1">
                Case ID <span className="font-mono text-foreground">{resident.id}</span>
                {" · "}
                Internal <span className="font-mono text-foreground">{resident.internalCode}</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant={resident.status === "Active" ? "default" : resident.status === "Completed" ? "secondary" : "outline"}>
                  {resident.status}
                </Badge>
                <Badge variant="outline">{resident.program}</Badge>
                <Badge variant="outline">
                  {resident.safehouseCode} {resident.safehouse}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/app/process-recording?resident=${encodeURIComponent(resident.name)}`}>
                <FileText className="h-4 w-4 mr-2" />
                Process recording
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/app/home-visits?resident=${encodeURIComponent(resident.name)}`}>
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
            <DetailRow label="Date of admission" value={resident.admitted} />
            <DetailRow
              label="Case closed"
              value={resident.dateClosed ?? "Open case"}
            />
            <DetailRow label="Program" value={resident.program} />
            <DetailRow
              label="Progress"
              value={`${resident.progress}% (overall program progress)`}
            />
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
            <DetailRow label="Reintegration type" value={resident.reintegrationType} />
            <DetailRow label="Reintegration status" value={resident.reintegrationStatus} />
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
              {resident.subcategories.map((s) => (
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
            <DetailRow
              label="4Ps beneficiary"
              value={resident.family.is4ps ? "Yes" : "No"}
            />
            <DetailRow
              label="Solo parent household"
              value={resident.family.soloParent ? "Yes" : "No"}
            />
            <DetailRow
              label="Indigenous group"
              value={resident.family.indigenous ? "Yes" : "No"}
            />
            <DetailRow
              label="Parent / guardian PWD"
              value={resident.family.parentPwd ? "Yes" : "No"}
            />
            <DetailRow
              label="Informal settler / homeless"
              value={resident.family.informalSettler ? "Yes" : "No"}
            />
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
            <DetailRow
              label="Special needs"
              value={resident.hasSpecialNeeds ? "Yes" : "No"}
            />
            <DetailRow
              label="Notes"
              value={resident.specialNeedsNote ?? "N/A"}
            />
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="font-heading">Referral & assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow label="Referral source" value={resident.referralSource} />
            <DetailRow label="Referring agency / person" value={resident.referringAgency} />
            <DetailRow label="Assigned social worker" value={resident.assignedSocialWorker} />
            <DetailRow label="Initial case assessment" value={resident.initialAssessment} />
          </CardContent>
        </Card>
      </div>

      <Card className="card-warm border-dashed">
        <CardHeader>
          <CardTitle className="text-base font-heading">Case notes (summary)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed">{resident.notesSummary}</p>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            {resident.notesRestrictedHint}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
