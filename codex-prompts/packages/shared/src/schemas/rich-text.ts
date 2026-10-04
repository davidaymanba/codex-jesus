import { z } from 'zod';

import { arraySchema, objectSchema } from './common.js';
import { FIELD_LIMITS } from '../constants/field-limits.js';
import {
  RICH_TEXT_HEADING_LEVELS,
  RICH_TEXT_LIMITS,
  RICH_TEXT_LINK_PROTOCOLS,
  RICH_TEXT_MARK_ATTRIBUTES,
  RICH_TEXT_MARK_TYPES,
  RICH_TEXT_NODE_ATTRIBUTES,
  RICH_TEXT_NODE_TYPES,
} from '../constants/rich-text.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';

const ATTR_KEY_MAX = 40;
// Relative links are resolved against a placeholder origin: anything that escapes it (e.g.
// "//host" or "/\host", which browsers treat as protocol-relative) points off-site.
const RELATIVE_LINK_BASE = 'https://relative.invalid';
const MAX_MARKS_PER_NODE = RICH_TEXT_MARK_TYPES.length;

const attrValueSchema = z.union([
  z.string().max(FIELD_LIMITS.URL_MAX),
  z.number(),
  z.boolean(),
  z.null(),
  arraySchema(z.number()),
]);

const attrsSchema = z.record(z.string().max(ATTR_KEY_MAX), attrValueSchema);

const markSchema = objectSchema({
  type: z.enum(RICH_TEXT_MARK_TYPES, { error: MSG.RICH_TEXT_INVALID }),
  attrs: attrsSchema.optional(),
});

/** One Tiptap node. Structural only; per-type rules run once per document (see below). */
export const richTextNodeSchema = objectSchema({
  type: z.enum(RICH_TEXT_NODE_TYPES, { error: MSG.RICH_TEXT_INVALID }),
  attrs: attrsSchema.optional(),
  text: z.string().optional(),
  marks: arraySchema(markSchema).max(MAX_MARKS_PER_NODE).optional(),
  get content() {
    return arraySchema(richTextNodeSchema).optional();
  },
});

export type RichTextNode = z.infer<typeof richTextNodeSchema>;

/**
 * A parsed document. Named (not inferred from the transform) so declaration files reference
 * `RichTextNode` instead of expanding the recursive type inline.
 */
export interface RichTextDocument {
  type: 'doc';
  content: RichTextNode[];
}

type Path = (string | number)[];

interface Issue {
  message: string;
  path: Path;
}

function isSafeHref(href: unknown): boolean {
  if (typeof href !== 'string') return false;
  if (href.startsWith('/')) {
    return (
      URL.canParse(href, RELATIVE_LINK_BASE) &&
      new URL(href, RELATIVE_LINK_BASE).origin === RELATIVE_LINK_BASE
    );
  }
  if (!URL.canParse(href)) return false;
  return (RICH_TEXT_LINK_PROTOCOLS as readonly string[]).includes(new URL(href).protocol);
}

function isHttpsUrl(value: unknown): boolean {
  return typeof value === 'string' && URL.canParse(value) && new URL(value).protocol === 'https:';
}

function checkNode(node: RichTextNode, path: Path): Issue[] {
  const issues: Issue[] = [];
  const isText = node.type === 'text';

  if (isText !== (typeof node.text === 'string') || (isText && node.content)) {
    issues.push({ message: MSG.RICH_TEXT_INVALID, path });
  }
  if (node.type === 'doc') issues.push({ message: MSG.RICH_TEXT_INVALID, path: [...path, 'type'] });
  if (
    node.type === 'heading' &&
    !(RICH_TEXT_HEADING_LEVELS as readonly unknown[]).includes(node.attrs?.level)
  ) {
    issues.push({ message: MSG.RICH_TEXT_INVALID, path: [...path, 'attrs', 'level'] });
  }
  if (node.type === 'image' && !isHttpsUrl(node.attrs?.src)) {
    issues.push({ message: MSG.UNSAFE_LINK, path: [...path, 'attrs', 'src'] });
  }
  node.marks?.forEach((mark, index) => {
    if (mark.type === 'link' && !isSafeHref(mark.attrs?.href)) {
      issues.push({ message: MSG.UNSAFE_LINK, path: [...path, 'marks', index, 'attrs', 'href'] });
    }
  });
  return issues;
}

/** Walks the tree iteratively (no recursion limit concerns) and collects rule violations. */
function collectIssues(root: RichTextNode[]): Issue[] {
  const issues: Issue[] = [];
  const stack = root.map((node, index) => ({ node, path: ['content', index] as Path, depth: 1 }));

  for (let entry = stack.pop(); entry; entry = stack.pop()) {
    const { node, path, depth } = entry;
    if (depth > RICH_TEXT_LIMITS.MAX_DEPTH) {
      issues.push({ message: MSG.RICH_TEXT_TOO_LARGE, path });
      continue;
    }
    issues.push(...checkNode(node, path));
    node.content?.forEach((child, index) => {
      stack.push({ node: child, path: [...path, 'content', index], depth: depth + 1 });
    });
  }
  return issues;
}

type Attrs = NonNullable<RichTextNode['attrs']>;

function pickAttrs(
  attrs: Attrs | undefined,
  allowed: readonly string[] | undefined,
): Attrs | undefined {
  if (!attrs || !allowed) return undefined;
  const kept = Object.entries(attrs).filter(([key]) => allowed.includes(key));
  return kept.length > 0 ? Object.fromEntries(kept) : undefined;
}

/** Rebuilds a node keeping only allow-listed attributes (depth is already bounded). */
function stripUnknownAttributes(node: RichTextNode): RichTextNode {
  const attrs = pickAttrs(node.attrs, RICH_TEXT_NODE_ATTRIBUTES[node.type]);
  const marks = node.marks?.map((mark) => {
    const markAttrs = pickAttrs(mark.attrs, RICH_TEXT_MARK_ATTRIBUTES[mark.type]);
    return { type: mark.type, ...(markAttrs && { attrs: markAttrs }) };
  });
  return {
    type: node.type,
    ...(attrs && { attrs }),
    ...(node.text !== undefined && { text: node.text }),
    ...(marks && { marks }),
    ...(node.content && { content: node.content.map(stripUnknownAttributes) }),
  };
}

const textEncoder = new TextEncoder();

/**
 * A Tiptap JSON document restricted to the allow-listed nodes and marks, safe link
 * protocols, https images, h2–h4 headings, and bounded size/depth. Unknown attributes are
 * stripped, so the parsed output is the sanitized document to store (CLAUDE.md §8).
 */
export const richTextDocumentSchema = objectSchema({
  type: z.literal('doc', { error: MSG.RICH_TEXT_INVALID }),
  content: arraySchema(richTextNodeSchema).min(1, { error: MSG.REQUIRED }),
})
  .superRefine((document, ctx) => {
    if (textEncoder.encode(JSON.stringify(document)).length > RICH_TEXT_LIMITS.MAX_BYTES) {
      ctx.addIssue({ code: 'custom', message: MSG.RICH_TEXT_TOO_LARGE, path: [] });
      return;
    }
    for (const issue of collectIssues(document.content)) {
      ctx.addIssue({ code: 'custom', ...issue });
    }
  })
  .transform((document): RichTextDocument => ({
    type: document.type,
    content: document.content.map(stripUnknownAttributes),
  }));

/** Rich text in both locales: `{ ar: doc, en: doc }`. */
export const localizedRichTextSchema = objectSchema({
  ar: richTextDocumentSchema,
  en: richTextDocumentSchema,
});

export type LocalizedRichText = z.infer<typeof localizedRichTextSchema>;
