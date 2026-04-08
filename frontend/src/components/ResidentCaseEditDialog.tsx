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
import { residentsApi, safehousesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { ResidentCaseWrite } from "@/lib/residentCaseWrite";
import { toApiWriteBody } from "@/lib/residentCaseWrite";
import { ResidentCaseFormFields, type SafehouseOption } from "@/components/ResidentCaseFormFields";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: number;
  initial: ResidentCaseWrite | null;
  onSaved: () => void;
};

export function ResidentCaseEditDialog({ open, onOpenChange, residentId, initial, onSaved }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<ResidentCaseWrite | null>(null);
  const [safehouses, setSafehouses] = useState<SafehouseOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    safehousesApi
      .list()
      .then((res) => {
        if (!res.success) return;
        setSafehouses((res.data as SafehouseOption[]) ?? []);
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
            <ResidentCaseFormFields form={form} patch={patch} safehouses={safehouses} idPrefix="ec" />
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
