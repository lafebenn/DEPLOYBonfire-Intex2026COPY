import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { residentsApi, safehousesApi } from "@/lib/api";
import type { ResidentCaseWrite } from "@/lib/residentCaseWrite";
import { defaultIntakeForm, toApiWriteBody } from "@/lib/residentCaseWrite";
import { ResidentCaseFormFields, type SafehouseOption } from "@/components/ResidentCaseFormFields";

export default function NewIntakePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<ResidentCaseWrite>(() => defaultIntakeForm());
  const [safehouses, setSafehouses] = useState<SafehouseOption[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    safehousesApi
      .list()
      .then((res) => {
        if (!res.success) return;
        const list = (res.data as SafehouseOption[]) ?? [];
        setSafehouses(list);
        if (list.length > 0) {
          setForm((f) => (f.safehouseId > 0 ? f : { ...f, safehouseId: list[0].safehouseId }));
        }
      })
      .catch(() => {});
  }, []);

  const patch = useCallback(<K extends keyof ResidentCaseWrite>(key: K, value: ResidentCaseWrite[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const canSubmit =
    form.caseControlNo.trim().length > 0 &&
    form.internalCode.trim().length > 0 &&
    form.safehouseId > 0 &&
    form.dateOfBirth.trim().length > 0 &&
    form.dateOfAdmission.trim().length > 0 &&
    form.dateEnrolled.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">New Intake</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Create a resident case with the same fields used when editing a profile. All data is saved to the API.
        </p>
      </div>

      {submitError && <div className="text-sm text-destructive">{submitError}</div>}

      <Card className="card-warm">
        <CardHeader>
          <CardTitle>Case record</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResidentCaseFormFields form={form} patch={patch} safehouses={safehouses} idPrefix="intake" />

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => navigate("/app/caseload")}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit || submitting}
              onClick={() => {
                setSubmitError(null);
                setSubmitting(true);
                residentsApi
                  .create(toApiWriteBody(form))
                  .then((res) => {
                    if (!res.success) throw new Error(res.message || "Failed to create intake");
                    const id = (res.data as { id?: number })?.id;
                    if (id == null || Number.isNaN(id)) throw new Error("Invalid response from server");
                    toast({
                      title: "Intake created",
                      description: `${form.caseControlNo.trim()} was added to the caseload.`,
                    });
                    navigate(`/app/caseload/${id}`);
                  })
                  .catch((err: Error) => setSubmitError(err.message ?? "Failed to save"))
                  .finally(() => setSubmitting(false));
              }}
            >
              {submitting ? "Saving…" : "Save intake"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
