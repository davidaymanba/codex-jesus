/** A page number, or a gap between distant page numbers. */
export type PageItem = number | 'gap';

/**
 * Compact page list: first, last, and the current page with its neighbours, with gaps in
 * between (`1 … 4 5 6 … 12`). Short lists are shown in full.
 */
export function pageItems(page: number, totalPages: number, siblings = 1): PageItem[] {
  const shown = new Set([1, totalPages]);
  for (let offset = -siblings; offset <= siblings; offset += 1) {
    const candidate = page + offset;
    if (candidate >= 1 && candidate <= totalPages) shown.add(candidate);
  }
  const sorted = [...shown].sort((a, b) => a - b);
  return sorted.flatMap((current, index): PageItem[] => {
    const previous = sorted[index - 1];
    if (previous === undefined || current - previous === 1) return [current];
    // A gap of exactly one page is shown as that page: "…" would hide nothing.
    return current - previous === 2 ? [current - 1, current] : ['gap', current];
  });
}
