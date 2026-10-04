import { describe, expect, it } from 'vitest';

import { richTextDocumentSchema, type RichTextNode } from './rich-text.js';
import { RICH_TEXT_LIMITS } from '../constants/rich-text.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { issueMessages } from '../test/issues.js';

const paragraph = (text: string, marks?: RichTextNode['marks']): RichTextNode => ({
  type: 'paragraph',
  content: [{ type: 'text', text, ...(marks && { marks }) }],
});

const doc = (...content: RichTextNode[]) => ({ type: 'doc', content });

describe('richTextDocumentSchema', () => {
  it('accepts allow-listed nodes and marks', () => {
    const input = doc(
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'عنوان' }] },
      paragraph('Visit', [{ type: 'link', attrs: { href: 'https://codex.example' } }]),
      { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph('item')] }] },
      { type: 'image', attrs: { src: 'https://res.cloudinary.com/x.png', alt: 'x' } },
    );

    expect(richTextDocumentSchema.safeParse(input).success).toBe(true);
  });

  it('rejects unknown node types', () => {
    expect(issueMessages(richTextDocumentSchema, doc({ type: 'iframe' } as never))).toEqual([
      MSG.RICH_TEXT_INVALID,
    ]);
  });

  it('rejects unknown marks', () => {
    const input = doc(paragraph('x', [{ type: 'script' } as never]));

    expect(issueMessages(richTextDocumentSchema, input)).toEqual([MSG.RICH_TEXT_INVALID]);
  });

  it.each([
    ['javascript:alert(1)'],
    ['data:text/html,<script>alert(1)</script>'],
    ['//evil.example'],
    ['/\\evil.example'],
    ['/\\/evil.example'],
    ['vbscript:msgbox'],
  ])('rejects the unsafe link %s', (href) => {
    const input = doc(paragraph('x', [{ type: 'link', attrs: { href } }]));

    expect(issueMessages(richTextDocumentSchema, input)).toEqual([MSG.UNSAFE_LINK]);
  });

  it.each([['/ar/services'], ['mailto:hello@codex.example'], ['tel:+966500000000']])(
    'accepts the safe link %s',
    (href) => {
      const input = doc(paragraph('x', [{ type: 'link', attrs: { href } }]));

      expect(richTextDocumentSchema.safeParse(input).success).toBe(true);
    },
  );

  it('rejects non-https images and h1 headings', () => {
    const input = doc(
      { type: 'image', attrs: { src: 'http://insecure.example/x.png' } },
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'h1' }] },
    );

    expect(issueMessages(richTextDocumentSchema, input).sort()).toEqual(
      [MSG.RICH_TEXT_INVALID, MSG.UNSAFE_LINK].sort(),
    );
  });

  it('rejects text nodes without text and nested docs', () => {
    expect(issueMessages(richTextDocumentSchema, doc({ type: 'text' }))).toEqual([
      MSG.RICH_TEXT_INVALID,
    ]);
    expect(issueMessages(richTextDocumentSchema, doc({ type: 'doc', content: [] }))).toEqual([
      MSG.RICH_TEXT_INVALID,
    ]);
  });

  it('rejects empty, oversized and overly deep documents', () => {
    expect(issueMessages(richTextDocumentSchema, doc())).toEqual([MSG.REQUIRED]);

    const huge = doc(paragraph('x'.repeat(RICH_TEXT_LIMITS.MAX_BYTES)));
    expect(issueMessages(richTextDocumentSchema, huge)).toEqual([MSG.RICH_TEXT_TOO_LARGE]);

    let deep: RichTextNode = paragraph('deep');
    for (let level = 0; level < RICH_TEXT_LIMITS.MAX_DEPTH; level += 1) {
      deep = { type: 'blockquote', content: [deep] };
    }
    expect(issueMessages(richTextDocumentSchema, doc(deep))).toContain(MSG.RICH_TEXT_TOO_LARGE);
  });

  it('strips attributes the renderer does not allow-list', () => {
    const input = doc(
      {
        type: 'paragraph',
        attrs: { class: 'x', style: 'color: red', onclick: 'alert(1)' },
        content: [
          {
            type: 'text',
            text: 'x',
            marks: [{ type: 'link', attrs: { href: '/ar', target: '_blank', rel: 'opener' } }],
          },
        ],
      },
      { type: 'heading', attrs: { level: 2, id: 'x' }, content: [{ type: 'text', text: 'h' }] },
    );

    expect(richTextDocumentSchema.parse(input).content).toEqual([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: '/ar' } }] }],
      },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'h' }] },
    ]);
  });
});
