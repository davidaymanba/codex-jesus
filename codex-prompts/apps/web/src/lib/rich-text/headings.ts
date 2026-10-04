import type { RichTextDto } from '@codex/shared';

import { childrenOf, numberAttr, rootNodes, textOf, type RichNode } from './nodes';

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

/** A URL fragment from heading text; keeps Arabic and other scripts' letters and digits. */
export function slugifyHeading(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

/**
 * Hands out unique heading ids in document order (`setup`, `setup-2`…). The renderer and the
 * table of contents each walk the document with a fresh allocator, so their ids match.
 */
export function createHeadingIds(fallback = 'section'): (text: string) => string {
  const used = new Map<string, number>();
  return (text) => {
    const base = slugifyHeading(text) || fallback;
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    return count === 1 ? base : `${base}-${String(count)}`;
  };
}

/** h2 and h3 headings for the table of contents, with the ids the renderer gives them. */
export function collectHeadings(doc: RichTextDto): TocHeading[] {
  const nextId = createHeadingIds();
  const headings: TocHeading[] = [];
  const visit = (node: RichNode) => {
    if (node.type === 'heading') {
      const text = textOf(node);
      const level = numberAttr(node, 'level') ?? 2;
      const id = nextId(text);
      if (level <= 3 && text.trim()) headings.push({ id, text, level });
      return;
    }
    childrenOf(node).forEach(visit);
  };
  rootNodes(doc).forEach(visit);
  return headings;
}
