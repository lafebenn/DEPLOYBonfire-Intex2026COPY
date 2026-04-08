import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, Users } from "lucide-react";
import { residentsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export type ResidentPickerRow = {
  residentId: number;
  internalCode: string;
  caseControlNo: string;
  caseStatus: string;
};

type Props = {
  id?: string;
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
};

export function ResidentMultiSelect({
  id,
  value,
  onChange,
  disabled,
  label = "Residents involved",
  description = "Choose one or more cases from the database. Each selected resident will get this event on their file.",
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [residents, setResidents] = useState<ResidentPickerRow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    residentsApi
      .list()
      .then((res) => {
        if (cancelled) return;
        if (!res.success) throw new Error(res.message || "Failed to load residents");
        const rows = (res.data as ResidentPickerRow[]).slice();
        rows.sort((a, b) => a.internalCode.localeCompare(b.internalCode, undefined, { sensitivity: "base" }));
        setResidents(rows);
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message ?? "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter(
      (r) =>
        r.internalCode.toLowerCase().includes(q) ||
        r.caseControlNo.toLowerCase().includes(q) ||
        String(r.residentId).includes(q)
    );
  }, [residents, query]);

  function toggle(idNum: number) {
    if (value.includes(idNum)) onChange(value.filter((x) => x !== idNum));
    else onChange([...value, idNum]);
  }

  const summary =
    value.length === 0
      ? "Select residents…"
      : value.length === 1
        ? (() => {
            const r = residents.find((x) => x.residentId === value[0]);
            return r ? `${r.internalCode} (${r.caseControlNo})` : `1 resident`;
          })()
        : `${value.length} residents selected`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {description ? <p className="text-xs text-muted-foreground leading-relaxed">{description}</p> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading || !!loadError}
            className={cn("w-full justify-between font-normal text-left min-h-10 h-auto py-2")}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{loadError ?? (loading ? "Loading caseload…" : summary)}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,420px)] p-0" align="start">
          <div className="p-2 border-b border-border">
            <Input
              placeholder="Search by name, case ID, or numeric ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9"
              autoComplete="off"
            />
          </div>
          <ScrollArea className="h-[min(280px,40vh)]">
            <ul className="p-2 space-y-1">
              {filtered.length === 0 ? (
                <li className="text-sm text-muted-foreground px-2 py-6 text-center">No matching cases.</li>
              ) : (
                filtered.map((r) => {
                  const checked = value.includes(r.residentId);
                  return (
                    <li key={r.residentId}>
                      <label
                        className={cn(
                          "flex items-start gap-3 rounded-lg px-2 py-2 cursor-pointer hover:bg-accent text-sm",
                          checked && "bg-accent/60"
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggle(r.residentId)}
                          className="mt-0.5"
                          aria-label={`${r.internalCode} ${r.caseControlNo}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="font-medium text-foreground block">{r.internalCode}</span>
                          <span className="text-xs text-muted-foreground">
                            {r.caseControlNo} · {r.caseStatus} · ID {r.residentId}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })
              )}
            </ul>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
