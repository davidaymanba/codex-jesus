import type { RichTextDocument, RichTextNode } from '../schemas/rich-text.js';

/**
 * Flattens a rich text document to plain text. Block nodes are separated by newlines
 * so words from adjacent paragraphs never merge.
 */
export function extractPlainText(document: RichTextDocument): string {
  const blocks: string[] = [];
  const collect = (node: RichTextNode): string =>
    node.text ?? (node.content ?? []).map(collect).join(node.type === 'paragraph' ? '' : '\n');

  for (const node of document.content) blocks.push(collect(node));
  return blocks.join('\n').trim();
}
