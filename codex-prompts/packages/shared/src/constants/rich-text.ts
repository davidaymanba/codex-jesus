/**
 * Tiptap node and mark types allowed in rich text (CLAUDE.md §8: whitelist renderer).
 * Anything else is rejected by `richTextDocumentSchema`.
 */
export const RICH_TEXT_NODE_TYPES = [
  'doc',
  'paragraph',
  'text',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
  'hardBreak',
  'horizontalRule',
  'image',
  'table',
  'tableRow',
  'tableHeader',
  'tableCell',
] as const;

export const RICH_TEXT_MARK_TYPES = ['bold', 'italic', 'code', 'link'] as const;

/** Only h2–h4: the page title owns the single h1. */
export const RICH_TEXT_HEADING_LEVELS = [2, 3, 4] as const;

/** Link protocols allowed in rich text; relative paths ("/…") are allowed too. */
export const RICH_TEXT_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'] as const;

const TABLE_CELL_ATTRIBUTES = ['colspan', 'rowspan', 'colwidth'] as const;

/**
 * Attributes kept per node type. Everything else (e.g. `class`, `style`, event handlers) is
 * stripped on parse, so stored documents only hold what the renderer understands.
 */
export const RICH_TEXT_NODE_ATTRIBUTES: Partial<
  Record<(typeof RICH_TEXT_NODE_TYPES)[number], readonly string[]>
> = {
  heading: ['level'],
  image: ['src', 'alt', 'title', 'width', 'height'],
  codeBlock: ['language'],
  orderedList: ['start'],
  tableCell: TABLE_CELL_ATTRIBUTES,
  tableHeader: TABLE_CELL_ATTRIBUTES,
};

/** Attributes kept per mark type (the renderer decides `rel` and `target` itself). */
export const RICH_TEXT_MARK_ATTRIBUTES: Partial<
  Record<(typeof RICH_TEXT_MARK_TYPES)[number], readonly string[]>
> = {
  link: ['href'],
};

export const RICH_TEXT_LIMITS = {
  /** Serialized JSON size per document, in bytes. */
  MAX_BYTES: 200_000,
  MAX_DEPTH: 20,
} as const;
