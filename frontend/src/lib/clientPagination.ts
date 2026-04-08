/** Client-side list pagination helpers (full dataset already in memory). */

export function clientTotalPages(itemCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

export function clampClientPage(page: number, itemCount: number, pageSize: number): number {
  const tp = clientTotalPages(itemCount, pageSize);
  return Math.min(Math.max(1, page), tp);
}
