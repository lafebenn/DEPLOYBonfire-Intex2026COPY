import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Same sizes as the Water Project reference pagination. */
const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

export type ListPaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
  /** When there are many pages, show "Page X of Y" instead of one button per page (Water-style for small totals). */
  maxNumberedPages?: number;
};

export function ListPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  className,
  maxNumberedPages = 12,
}: ListPaginationProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const showNumberButtons = totalPages <= maxNumberedPages;

  return (
    <div className={cn("flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 mt-6", className)}>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        {showNumberButtons ? (
          Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <Button
              key={num}
              type="button"
              variant={currentPage === num ? "default" : "outline"}
              size="sm"
              className="min-w-9 px-2"
              disabled={currentPage === num}
              onClick={() => onPageChange(num)}
            >
              {num}
            </Button>
          ))
        ) : (
          <span className="text-sm text-muted-foreground px-2 tabular-nums">
            Page {currentPage} of {totalPages}
          </span>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {totalItems > 0 ? (
          <span className="tabular-nums">
            {start}–{end} of {totalItems}
          </span>
        ) : (
          <span>0 results</span>
        )}
        <div className="flex items-center gap-2">
          <Label htmlFor="list-page-size" className="text-muted-foreground whitespace-nowrap shrink-0">
            Results per page
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              const n = Number(v);
              onPageSizeChange(n);
              onPageChange(1);
            }}
          >
            <SelectTrigger id="list-page-size" className="w-[4.5rem] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
