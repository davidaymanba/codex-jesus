import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { RichTextDto } from '@codex/shared';

import { collectHeadings, slugifyHeading } from './headings';
import { toSafeLink } from './links';
import { RichText } from './RichText';

const doc = (...content: Record<string, unknown>[]): RichTextDto => ({ type: 'doc', content });
const text = (value: string, marks?: Record<string, unknown>[]) => ({
  type: 'text',
  text: value,
  ...(marks && { marks }),
});
const linked = (href: string) =>
  doc({ type: 'paragraph', content: [text('here', [{ type: 'link', attrs: { href } }])] });
const render = (document: RichTextDto) =>
  renderToStaticMarkup(<RichText doc={document} locale="en" />);

describe('RichText', () => {
  it('renders whitelisted nodes and marks', () => {
    const html = render(
      doc(
        { type: 'heading', attrs: { level: 2 }, content: [text('Start here')] },
        { type: 'paragraph', content: [text('bold', [{ type: 'bold' }]), text(' and plain')] },
        {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [text('a')] }] }],
        },
      ),
    );
    expect(html).toContain('<h2 id="start-here">Start here</h2>');
    expect(html).toContain('<p><strong>bold</strong> and plain</p>');
    expect(html).toContain('<ul><li><p>a</p></li></ul>');
  });

  it('drops unknown nodes and escapes text instead of injecting HTML', () => {
    const html = render(
      doc(
        { type: 'iframe', attrs: { src: 'https://evil.example' } },
        { type: 'paragraph', content: [text('<script>alert(1)</script>')] },
      ),
    );
    expect(html).not.toContain('iframe');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('never renders a javascript: or protocol-relative link', () => {
    expect(render(linked('javascript:alert(1)'))).toBe(
      '<div class="prose-codex"><p>here</p></div>',
    );
    expect(render(linked('//evil.example/x'))).not.toContain('href');
  });

  it('opens external links in a new tab without an opener; site links stay in the locale', () => {
    expect(render(linked('https://example.com/a'))).toContain(
      '<a href="https://example.com/a" target="_blank" rel="noopener noreferrer">here</a>',
    );
    expect(render(linked('/contact'))).toContain('<a href="/en/contact">here</a>');
  });

  it('renders images from allowed https hosts only', () => {
    const image = (src: string) => doc({ type: 'image', attrs: { src, alt: 'Diagram' } });
    expect(render(image('https://res.cloudinary.com/codex/image/upload/a.png'))).toContain(
      'alt="Diagram"',
    );
    expect(render(image('https://tracker.example/pixel.png'))).not.toContain('<img');
    expect(render(image('http://res.cloudinary.com/a.png'))).not.toContain('<img');
  });
});

describe('headings', () => {
  it('gives duplicate headings unique ids that match the table of contents', () => {
    const document = doc(
      { type: 'heading', attrs: { level: 2 }, content: [text('Setup')] },
      { type: 'heading', attrs: { level: 3 }, content: [text('Setup')] },
      { type: 'heading', attrs: { level: 4 }, content: [text('Details')] },
    );
    expect(collectHeadings(document)).toEqual([
      { id: 'setup', text: 'Setup', level: 2 },
      { id: 'setup-2', text: 'Setup', level: 3 },
    ]);
    expect(render(document)).toContain('<h3 id="setup-2">');
  });

  it('keeps Arabic letters in ids', () => {
    expect(slugifyHeading('أين يناسب n8n؟')).toBe('أين-يناسب-n8n');
  });
});

describe('toSafeLink', () => {
  it('keeps an existing locale prefix and classifies contact links', () => {
    expect(toSafeLink('/ar/blog', 'en')).toEqual({ kind: 'internal', href: '/ar/blog' });
    expect(toSafeLink('mailto:hello@example.com', 'en')).toEqual({
      kind: 'contact',
      href: 'mailto:hello@example.com',
    });
    expect(toSafeLink('data:text/html,hi', 'en')).toBeNull();
  });
});
