import type { RichTextDto } from '@codex/shared';

/** A Tiptap node as stored (already sanitized on save against the shared whitelist). */
export interface RichNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Narrows stored JSON to a node; anything malformed is dropped rather than rendered. */
export function asNode(value: unknown): RichNode | null {
  if (!isRecord(value) || typeof value.type !== 'string') return null;
  return value as unknown as RichNode;
}

/** The top-level nodes of a document. */
export const rootNodes = (doc: RichTextDto): RichNode[] =>
  doc.content.map(asNode).filter((node): node is RichNode => node !== null);

/** Child nodes, malformed ones dropped. */
export const childrenOf = (node: RichNode): RichNode[] =>
  (Array.isArray(node.content) ? node.content : [])
    .map(asNode)
    .filter((child): child is RichNode => child !== null);

/** All the text inside a node (headings for the table of contents, code blocks). */
export function textOf(node: RichNode): string {
  if (node.type === 'text') return typeof node.text === 'string' ? node.text : '';
  return childrenOf(node).map(textOf).join('');
}

export const stringAttr = (node: RichNode, name: string): string | undefined => {
  const value = node.attrs?.[name];
  return typeof value === 'string' ? value : undefined;
};

export const numberAttr = (node: RichNode, name: string): number | undefined => {
  const value = node.attrs?.[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};
