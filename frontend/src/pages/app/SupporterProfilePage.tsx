import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CircleHelp, Gift, Loader2, Mail, MapPin, Pencil, Phone, Plus, Trash2, User } from "lucide-react";
import { donorsApi, fetchDonorGivingPrediction, pickMlProxyScore, safehousesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const donationTypes = ["Monetary", "InKind", "Time", "Skills", "SocialMedia"] as const;
const channelSources = ["Campaign", "Event", "Direct", "SocialMedia", "PartnerReferral"] as const;
const programAreas = ["Education", "Wellbeing", "Operations", "Transport", "Maintenance", "Outreach"] as const;

const typeColors: Record<string, "default" | "secondary" | "outline" | "warning"> = {
  Monthly: "default",
  "One-time": "secondary",
  Grant: "warning",
  Annual: "outline",
  Monetary: "default",
  InKind: "secondary",
  Time: "outline",
  Skills: "outline",
  SocialMedia: "warning",
};

type SupporterApi = {
  supporterId: number;
  displayName: string;
  supporterType: string;
  status: string;
  email: string;
  phone: string;
  region: string;
  country: string;
  acquisitionChannel: string;
  firstDonationDate: string | null;
  createdAt?: string;
  organizationName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  relationshipType?: string;
};

type ContactDraft = {
  displayName: string;
  email: string;
  phone: string;
  region: string;
  country: string;
};

function givingTier(score: number): "High" | "Moderate" | "Low" {
  const norm = score >= 0 && score <= 1 ? score * 100 : score;
  if (norm >= 70) return "High";
  if (norm >= 40) return "Moderate";
  return "Low";
}

type DonationRow = {
  donationId: number;
  donationType: string;
  donationDate: string;
  amount: number | null;
  estimatedValue: number | null;
  channelSource: string;
};

type AllocationFormRow = {
  safehouseId: string;
  programArea: (typeof programAreas)[number];
  amountAllocated: string;
};

function buildSupporterPutBody(p: SupporterApi, d: ContactDraft): Record<string, unknown> {
  return {
    supporterType: p.supporterType,
    displayName: d.displayName.trim(),
    organizationName: p.organizationName ?? null,
    firstName: p.firstName ?? null,
    lastName: p.lastName ?? null,
    relationshipType: p.relationshipType ?? "",
    region: d.region.trim(),
    country: d.country.trim(),
    email: d.email.trim(),
    phone: d.phone.trim(),
    status: p.status,
    firstDonationDate: p.firstDonationDate,
    acquisitionChannel: p.acquisitionChannel,
  };
}

function formatPhp(n: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
}

function parseAmount(raw: string): number | null {
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function dateInputFromApi(d: string | undefined): string {
  if (!d) return new Date().toISOString().slice(0, 10);
  return d.length >= 10 ? d.slice(0, 10) : d;
}

function emptyAllocationRow(): AllocationFormRow {
  return { safehouseId: "", programArea: "Operations", amountAllocated: "" };
}

function normalizeSupporterFromApi(raw: unknown): SupporterApi {
  const o = raw as Record<string, unknown>;
  const pickStr = (...keys: string[]) => {
    for (const k of keys) {
      const v = o[k];
      if (v != null && String(v).trim() !== "") return String(v);
    }
    return "";
  };
  const pickNum = (...keys: string[]) => {
    for (const k of keys) {
      const v = o[k];
      if (typeof v === "number" && Number.isFinite(v)) return v;
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  };
  const optStr = (...keys: string[]) => {
    for (const k of keys) {
      const v = o[k];
      if (v != null && String(v).trim() !== "") return String(v);
    }
    return null;
  };
  const fd = o.firstDonationDate ?? o.FirstDonationDate;
  return {
    supporterId: pickNum("supporterId", "SupporterId"),
    displayName: pickStr("displayName", "DisplayName"),
    supporterType: pickStr("supporterType", "SupporterType"),
    status: pickStr("status", "Status"),
    email: pickStr("email", "Email"),
    phone: pickStr("phone", "Phone"),
    region: pickStr("region", "Region"),
    country: pickStr("country", "Country"),
    acquisitionChannel: pickStr("acquisitionChannel", "AcquisitionChannel"),
    firstDonationDate: fd != null ? String(fd).slice(0, 10) : null,
    createdAt: o.createdAt != null ? String(o.createdAt) : o.CreatedAt != null ? String(o.CreatedAt) : undefined,
    organizationName: optStr("organizationName", "OrganizationName"),
    firstName: optStr("firstName", "FirstName"),
    lastName: optStr("lastName", "LastName"),
    relationshipType: pickStr("relationshipType", "RelationshipType"),
  };
}

export default function SupporterProfilePage() {
  const { supporterId } = useParams<{ supporterId: string }>();
  const idNum = supporterId ? Number(supporterId) : NaN;
  const { toast } = useToast();
  const defaultDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [profile, setProfile] = useState<SupporterApi | null>(null);
  const [contributions, setContributions] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [givingMlScore, setGivingMlScore] = useState<number | null>(null);
  const [givingMlLoading, setGivingMlLoading] = useState(false);
  const [givingMlError, setGivingMlError] = useState<string | null>(null);

  const [editingContact, setEditingContact] = useState(false);
  const [contactDraft, setContactDraft] = useState<ContactDraft>({
    displayName: "",
    email: "",
    phone: "",
    region: "",
    country: "",
  });
  const [savingContact, setSavingContact] = useState(false);

  const [safehouses, setSafehouses] = useState<{ id: number; name: string }[]>([]);

  const [donDialogOpen, setDonDialogOpen] = useState(false);
  const [donMode, setDonMode] = useState<"create" | "edit">("create");
  const [donEditingId, setDonEditingId] = useState<number | null>(null);
  const [donationType, setDonationType] = useState<(typeof donationTypes)[number]>("Monetary");
  const [channelSource, setChannelSource] = useState<(typeof channelSources)[number]>("Direct");
  const [donAmount, setDonAmount] = useState("");
  const [donDate, setDonDate] = useState(defaultDate);
  const [donNotes, setDonNotes] = useState("");
  const [allocRows, setAllocRows] = useState<AllocationFormRow[]>([emptyAllocationRow()]);
  const [donSaving, setDonSaving] = useState(false);
  const [donLoadingDetail, setDonLoadingDetail] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const refreshContributions = useCallback(async () => {
    const donRes = await donorsApi.donationsList({ supporterId: String(idNum) });
    if (donRes.success && Array.isArray(donRes.data)) {
      setContributions(donRes.data as DonationRow[]);
    }
  }, [idNum]);

  useEffect(() => {
    if (!supporterId || Number.isNaN(idNum)) {
      setLoading(false);
      return;
    }

    Promise.all([donorsApi.supporterGet(idNum), donorsApi.donationsList({ supporterId: String(idNum) })])
      .then(([supRes, donRes]) => {
        if (!supRes.success) throw new Error(supRes.message || "Supporter not found");
        setProfile(normalizeSupporterFromApi(supRes.data));
        if (donRes.success && Array.isArray(donRes.data)) setContributions(donRes.data as DonationRow[]);
      })
      .catch((err: Error) => setError(err.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, [supporterId, idNum]);

  useEffect(() => {
    let cancelled = false;
    safehousesApi
      .list()
      .then((res) => {
        if (cancelled) return;
        if (!res.success || !Array.isArray(res.data)) return;
        const list = res.data;
        const parsed =
          Array.isArray(list) ?
            list
              .map((r) => {
                if (!r || typeof r !== "object") return null;
                const o = r as Record<string, unknown>;
                const id = Number(o.safehouseId ?? o.SafehouseId ?? o.id ?? o.Id);
                const name = String(o.name ?? o.Name ?? "");
                if (!Number.isFinite(id) || !name) return null;
                return { id, name };
              })
              .filter((x): x is { id: number; name: string } => x !== null)
              .sort((a, b) => a.name.localeCompare(b.name))
            : [];
        setSafehouses(parsed);
      })
      .catch(() => {
        if (!cancelled) setSafehouses([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setGivingMlLoading(true);
    setGivingMlError(null);
    fetchDonorGivingPrediction(profile.supporterId)
      .then((raw) => {
        if (cancelled) return;
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          const o = raw as Record<string, unknown>;
          if (o.insufficient_data === true) {
            setGivingMlScore(null);
            setGivingMlError(null);
            return;
          }
        }
        setGivingMlScore(pickMlProxyScore(raw));
      })
      .catch(() => {
        if (!cancelled) {
          setGivingMlError(
            "There isn’t enough donation history to estimate giving potential yet, or the estimate couldn’t be loaded.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setGivingMlLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.supporterId]);

  function openCreateDonation() {
    setDonMode("create");
    setDonEditingId(null);
    setDonationType("Monetary");
    setChannelSource("Direct");
    setDonAmount("");
    setDonDate(defaultDate);
    setDonNotes("");
    setAllocRows([
      {
        safehouseId: safehouses[0] ? String(safehouses[0].id) : "",
        programArea: "Operations",
        amountAllocated: "",
      },
    ]);
    setDonDialogOpen(true);
  }

  async function openEditDonation(donationId: number) {
    setDonMode("edit");
    setDonEditingId(donationId);
    setDonDialogOpen(true);
    setDonLoadingDetail(true);
    setDonNotes("");
    try {
      const res = await donorsApi.donationGet(donationId);
      if (!res.success) throw new Error(res.message || "Could not load donation");
      const raw = res.data as Record<string, unknown>;
      const dtype = String(raw.donationType ?? raw.DonationType ?? "Monetary");
      setDonationType(
        donationTypes.includes(dtype as (typeof donationTypes)[number]) ? (dtype as (typeof donationTypes)[number]) : "Monetary"
      );
      const ch = String(raw.channelSource ?? raw.ChannelSource ?? "Direct");
      setChannelSource(
        channelSources.includes(ch as (typeof channelSources)[number]) ? (ch as (typeof channelSources)[number]) : "Direct"
      );
      const dStr = String(raw.donationDate ?? raw.DonationDate ?? "");
      setDonDate(dateInputFromApi(dStr));
      const amt = raw.amount ?? raw.Amount;
      const ev = raw.estimatedValue ?? raw.EstimatedValue;
      const num = amt != null ? Number(amt) : ev != null ? Number(ev) : null;
      setDonAmount(num != null && Number.isFinite(num) ? String(num) : "");
      setDonNotes(String(raw.notes ?? raw.Notes ?? ""));

      const allocs = (raw.allocations as unknown[]) ?? [];
      if (allocs.length > 0) {
        setAllocRows(
          allocs.map((a) => {
            const o = a as Record<string, unknown>;
            const pa = String(o.programArea ?? o.ProgramArea ?? "Operations");
            const prog = programAreas.includes(pa as (typeof programAreas)[number]) ?
                (pa as (typeof programAreas)[number])
              : "Operations";
            return {
              safehouseId: String(o.safehouseId ?? o.SafehouseId ?? ""),
              programArea: prog,
              amountAllocated: String(o.amountAllocated ?? o.AmountAllocated ?? ""),
            };
          })
        );
      } else {
        setAllocRows([emptyAllocationRow()]);
      }
    } catch (e: unknown) {
      toast({
        variant: "destructive",
        title: "Could not load donation",
        description: e instanceof Error ? e.message : "Unknown error",
      });
      setDonDialogOpen(false);
    } finally {
      setDonLoadingDetail(false);
    }
  }

  async function submitDonationForm() {
    if (!profile) return;
    setDonSaving(true);
    try {
      const parsed = parseAmount(donAmount);
      if (parsed == null || parsed <= 0) {
        toast({ variant: "destructive", title: "Enter a valid gift amount" });
        return;
      }
      const allocationPayload = allocRows
        .map((row) => {
          const sh = Number(row.safehouseId);
          const alloc = parseAmount(row.amountAllocated);
          if (!Number.isFinite(sh) || sh <= 0 || alloc == null || alloc <= 0) return null;
          return {
            safehouseId: sh,
            programArea: row.programArea,
            amountAllocated: alloc,
          };
        })
        .filter((x): x is { safehouseId: number; programArea: string; amountAllocated: number } => x !== null);

      if (allocationPayload.length === 0) {
        toast({ variant: "destructive", title: "Add at least one allocation", description: "Choose a safehouse and amount for program attribution." });
        return;
      }

      const body = {
        supporterId: profile.supporterId,
        donationType,
        donationDate: donDate,
        channelSource,
        currencyCode: "PHP",
        amount: parsed,
        estimatedValue: null as number | null,
        impactUnit: null as string | null,
        isRecurring: false,
        campaignName: null as string | null,
        notes: donNotes.trim() === "" ? null : donNotes.trim(),
        createdByPartnerId: null as number | null,
        referralPostId: null as number | null,
        allocations: allocationPayload,
      };

      if (donMode === "create") {
        const res = await donorsApi.donationCreate(body);
        if (!res.success) throw new Error(res.message || "Failed to create");
        toast({ title: "Contribution recorded" });
      } else if (donEditingId != null) {
        const res = await donorsApi.donationUpdate(donEditingId, body);
        if (!res.success) throw new Error(res.message || "Failed to update");
        toast({ title: "Contribution updated" });
      }
      setDonDialogOpen(false);
      await refreshContributions();
    } catch (e: unknown) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setDonSaving(false);
    }
  }

  async function confirmDeleteDonation() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      const res = await donorsApi.donationDelete(deleteTarget.id);
      if (!res.success) throw new Error(res.message || "Delete failed");
      toast({ title: "Contribution removed" });
      setDeleteTarget(null);
      await refreshContributions();
    } catch (e: unknown) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (error || !profile) {
    return (
      <div className="space-y-4 p-8">
        <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
          <Link to="/app/donors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to supporters
          </Link>
        </Button>
        <div className="text-destructive">{error ?? "Supporter not found"}</div>
      </div>
    );
  }

  let sum = 0;
  let counted = 0;
  for (const c of contributions) {
    const v = c.amount ?? c.estimatedValue;
    if (v != null) {
      sum += Number(v);
      counted++;
    }
  }
  const totalLabel =
    counted > 0
      ? `${formatPhp(sum)} from ${contributions.length} gift${contributions.length === 1 ? "" : "s"}`
      : `${contributions.length} gift${contributions.length === 1 ? "" : "s"} on file`;

  const allocationTally = new Map<string, number>();
  for (const c of contributions) {
    const key = c.channelSource || "—";
    allocationTally.set(key, (allocationTally.get(key) ?? 0) + 1);
  }
  const topAllocations = [...allocationTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  const memberSince =
    profile.firstDonationDate?.slice(0, 4) ?? (profile.createdAt ? profile.createdAt.slice(0, 4) : "—");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
          <Link to="/app/donors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to supporters
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={openCreateDonation}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add contribution
          </Button>
          <Button asChild size="sm">
            <Link to="/app/donations/new">Full donation form</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-2xl font-bold">{profile.displayName}</h2>
          <Badge variant={profile.status === "Active" ? "default" : "secondary"}>{profile.status}</Badge>
          <Badge variant="outline">{profile.supporterType}</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Supporter profile and contribution history from the operational database.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              Giving summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-heading font-semibold">{totalLabel}</p>
            <p className="text-xs text-muted-foreground mt-1">Amounts shown in PHP where available.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Relationship
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Since </span>
              <span className="font-medium">{memberSince}</span>
            </p>
            {profile.acquisitionChannel && (
              <p>
                <span className="text-muted-foreground">Source </span>
                <span className="font-medium">{profile.acquisitionChannel}</span>
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body">Top allocations</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {topAllocations.length === 0 ? (
              <p className="text-muted-foreground">No allocation data yet.</p>
            ) : (
              topAllocations.map(([label, n]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-muted-foreground truncate">{label}</span>
                  <span className="font-medium tabular-nums shrink-0">{n}×</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-body">
                Predicted giving potential
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground rounded-full p-0.5 -m-0.5"
                    aria-label="About this estimate"
                  >
                    <CircleHelp className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-sm leading-relaxed">
                  Estimated based on this supporter&apos;s giving history and profile. Shown as a guide only — not a
                  guarantee of future gifts.
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xs text-muted-foreground font-normal mt-1 leading-relaxed">
              Estimated based on this supporter&apos;s giving history and profile. Shown as a guide only — not a
              guarantee of future gifts.
            </p>
          </CardHeader>
          <CardContent className="text-sm">
            {givingMlLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : givingMlError ? (
              <p className="text-muted-foreground text-sm leading-relaxed">{givingMlError}</p>
            ) : givingMlScore != null ? (
              <p className="text-2xl font-heading font-bold tabular-nums">
                {(() => {
                  const tier = givingTier(givingMlScore);
                  const formatted =
                    givingMlScore >= 0 && givingMlScore <= 1
                      ? `${Math.round(givingMlScore * 100)}%`
                      : givingMlScore >= 100
                        ? Math.round(givingMlScore).toLocaleString()
                        : Number(givingMlScore.toFixed(2));
                  return `${tier} (${formatted})`;
                })()}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">No estimate returned for this profile yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-base font-heading">Name &amp; contact</CardTitle>
            <p className="text-xs text-muted-foreground font-normal mt-1">Display name, email, phone, and location.</p>
          </div>
          {!editingContact ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => {
                setContactDraft({
                  displayName: profile.displayName ?? "",
                  email: profile.email ?? "",
                  phone: profile.phone ?? "",
                  region: profile.region ?? "",
                  country: profile.country ?? "",
                });
                setEditingContact(true);
              }}
            >
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button type="button" variant="ghost" size="sm" disabled={savingContact} onClick={() => setEditingContact(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={savingContact}
                onClick={async () => {
                  if (!contactDraft.displayName.trim()) {
                    toast({ variant: "destructive", title: "Display name is required" });
                    return;
                  }
                  setSavingContact(true);
                  try {
                    const body = buildSupporterPutBody(profile, contactDraft);
                    const res = await donorsApi.supporterUpdate(idNum, body);
                    if (!res.success) throw new Error(res.message || "Update failed");
                    const fresh = await donorsApi.supporterGet(idNum);
                    if (!fresh.success) throw new Error(fresh.message || "Reload failed");
                    setProfile(normalizeSupporterFromApi(fresh.data));
                    toast({ title: "Profile updated" });
                    setEditingContact(false);
                  } catch (e: unknown) {
                    toast({
                      variant: "destructive",
                      title: "Could not save",
                      description: e instanceof Error ? e.message : "Unknown error",
                    });
                  } finally {
                    setSavingContact(false);
                  }
                }}
              >
                {savingContact ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="text-sm max-w-xl">
          {!editingContact ? (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4 shrink-0" />
                <span className="text-foreground font-medium">{profile.displayName}</span>
              </p>
              {profile.email && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href={`mailto:${profile.email}`} className="text-foreground hover:underline">
                    {profile.email}
                  </a>
                </p>
              )}
              {profile.phone && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="text-foreground">{profile.phone}</span>
                </p>
              )}
              {(profile.region || profile.country) && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="text-foreground">{[profile.region, profile.country].filter(Boolean).join(", ")}</span>
                </p>
              )}
              {!profile.email && !profile.phone && !profile.region && !profile.country && (
                <p className="text-muted-foreground">No email, phone, or location on file.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="supporter-display-name">Display name</Label>
                <Input
                  id="supporter-display-name"
                  autoComplete="off"
                  value={contactDraft.displayName}
                  onChange={(e) => setContactDraft((d) => ({ ...d, displayName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supporter-email">Email</Label>
                <Input
                  id="supporter-email"
                  type="email"
                  autoComplete="off"
                  value={contactDraft.email}
                  onChange={(e) => setContactDraft((d) => ({ ...d, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supporter-phone">Phone</Label>
                <Input
                  id="supporter-phone"
                  type="tel"
                  autoComplete="off"
                  value={contactDraft.phone}
                  onChange={(e) => setContactDraft((d) => ({ ...d, phone: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="supporter-region">Region</Label>
                  <Input
                    id="supporter-region"
                    value={contactDraft.region}
                    onChange={(e) => setContactDraft((d) => ({ ...d, region: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="supporter-country">Country</Label>
                  <Input
                    id="supporter-country"
                    value={contactDraft.country}
                    onChange={(e) => setContactDraft((d) => ({ ...d, country: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-base font-heading">Contribution history</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">Newest first · edit or remove rows as needed</p>
          </div>
          <Button type="button" size="sm" variant="secondary" className="shrink-0" onClick={openCreateDonation}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No contributions yet. Use Add to record a gift.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Allocation</TableHead>
                  <TableHead className="hidden md:table-cell">Source</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.map((row) => {
                  const amt = row.amount ?? row.estimatedValue;
                  const amtLabel = amt != null ? formatPhp(Number(amt)) : "—";
                  return (
                    <TableRow key={row.donationId}>
                      <TableCell className="tabular-nums">{row.donationDate}</TableCell>
                      <TableCell>
                        <Badge variant={typeColors[row.donationType] ?? "outline"}>{row.donationType}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{amtLabel}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{row.channelSource || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground capitalize">{row.channelSource || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Edit contribution"
                            onClick={() => openEditDonation(row.donationId)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label="Delete contribution"
                            onClick={() =>
                              setDeleteTarget({
                                id: row.donationId,
                                label: `${row.donationDate} · ${amtLabel}`,
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={donDialogOpen} onOpenChange={setDonDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{donMode === "create" ? "Add contribution" : "Edit contribution"}</DialogTitle>
          </DialogHeader>
          {donLoadingDetail ? (
            <p className="text-sm text-muted-foreground py-6">Loading donation…</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={donationType} onValueChange={(v) => setDonationType(v as (typeof donationTypes)[number])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {donationTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Channel</Label>
                  <Select value={channelSource} onValueChange={(v) => setChannelSource(v as (typeof channelSources)[number])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {channelSources.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="don-amount">Amount (PHP)</Label>
                  <Input id="don-amount" value={donAmount} onChange={(e) => setDonAmount(e.target.value)} autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="don-date">Date</Label>
                  <Input id="don-date" type="date" value={donDate} onChange={(e) => setDonDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="don-notes">Notes (optional)</Label>
                <Textarea id="don-notes" className="min-h-[72px]" value={donNotes} onChange={(e) => setDonNotes(e.target.value)} />
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                <p className="text-sm font-medium">Program &amp; safehouse</p>
                {allocRows.map((row, idx) => (
                  <div key={idx} className="grid gap-2 sm:grid-cols-12 sm:items-end border-b border-border/60 pb-3 last:border-0 last:pb-0">
                    <div className="sm:col-span-5 space-y-1.5">
                      <Label className={idx > 0 ? "sr-only" : undefined}>Safehouse</Label>
                      <Select
                        value={row.safehouseId || undefined}
                        onValueChange={(v) => {
                          setAllocRows((rows) => rows.map((r, i) => (i === idx ? { ...r, safehouseId: v } : r)));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select safehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {safehouses.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-4 space-y-1.5">
                      <Label className={idx > 0 ? "sr-only" : undefined}>Program</Label>
                      <Select
                        value={row.programArea}
                        onValueChange={(v) => {
                          setAllocRows((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, programArea: v as (typeof programAreas)[number] } : r))
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {programAreas.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className={idx > 0 ? "sr-only" : undefined}>Allocated (PHP)</Label>
                      <Input
                        value={row.amountAllocated}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAllocRows((rows) => rows.map((r, i) => (i === idx ? { ...r, amountAllocated: v } : r)));
                        }}
                        autoComplete="off"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end pb-1">
                      {allocRows.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          aria-label="Remove allocation row"
                          onClick={() => setAllocRows((rows) => rows.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setAllocRows((rows) => [...rows, emptyAllocationRow()])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add allocation row
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDonDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={donSaving || donLoadingDetail} onClick={() => void submitDonationForm()}>
              {donSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : donMode === "create" ? (
                "Save"
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget != null} onOpenChange={(o) => !o && !deleteBusy && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this contribution?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the gift record{deleteTarget ? ` (${deleteTarget.label})` : ""}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteBusy}
              onClick={(e) => {
                e.preventDefault();
                void confirmDeleteDonation();
              }}
            >
              {deleteBusy ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
