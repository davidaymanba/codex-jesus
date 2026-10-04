import Image from 'next/image';
import type { ReactNode } from 'react';

import type { Locale, RichTextDto } from '@codex/shared';

import { isAllowedImageUrl } from '@/lib/images';
import { cn } from '@/lib/utils/cn';

import { createHeadingIds } from './headings';
import { toSafeLink } from './links';
import { childrenOf, numberAttr, rootNodes, stringAttr, textOf, type RichNode } from './nodes';

// Images without stored dimensions keep a 16:9 box (next/image needs a size to avoid CLS).
const DEFAULT_IMAGE = { width: 1200, height: 675 } as const;
const IMAGE_SIZES = '(min-width: 768px) 45rem, 100vw';

interface RenderContext {
  locale: Locale;
  nextHeadingId: (text: string) => string;
}

type Mark = NonNullable<RichNode['marks']>[number];

function applyMark(mark: Mark, children: ReactNode, context: RenderContext): ReactNode {
  switch (mark.type) {
    case 'bold':
      return <strong>{children}</strong>;
    case 'italic':
      return <em>{children}</em>;
    case 'code':
      return <code>{children}</code>;
    case 'link': {
      const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : '';
      const link = toSafeLink(href, context.locale);
      if (!link) return children;
      return link.kind === 'external' ? (
        <a href={link.href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      ) : (
        <a href={link.href}>{children}</a>
      );
    }
    default:
      return children;
  }
}

function renderText(node: RichNode, context: RenderContext): ReactNode {
  const text = typeof node.text === 'string' ? node.text : '';
  return (node.marks ?? []).reduce<ReactNode>(
    (children, mark) => applyMark(mark, children, context),
    text,
  );
}

function renderChildren(node: RichNode, context: RenderContext): ReactNode[] {
  // Stored documents are rendered once and never reordered, so position is a stable key.
  return childrenOf(node).map((child, index) => (
    <RichNodeView key={`${child.type}-${String(index)}`} node={child} context={context} />
  ));
}

function renderImage(node: RichNode): ReactNode {
  const src = stringAttr(node, 'src');
  if (!src || !isAllowedImageUrl(src)) return null;
  const title = stringAttr(node, 'title');
  return (
    <figure>
      <Image
        src={src}
        alt={stringAttr(node, 'alt') ?? ''}
        width={numberAttr(node, 'width') ?? DEFAULT_IMAGE.width}
        height={numberAttr(node, 'height') ?? DEFAULT_IMAGE.height}
        sizes={IMAGE_SIZES}
        className="h-auto w-full rounded-2xl"
      />
      {title ? <figcaption>{title}</figcaption> : null}
    </figure>
  );
}

function renderHeading(node: RichNode, context: RenderContext): ReactNode {
  const level = numberAttr(node, 'level');
  const Heading = level === 3 ? 'h3' : level === 4 ? 'h4' : 'h2';
  return (
    <Heading id={context.nextHeadingId(textOf(node))}>{renderChildren(node, context)}</Heading>
  );
}

function renderTableCell(node: RichNode, context: RenderContext): ReactNode {
  const Cell = node.type === 'tableHeader' ? 'th' : 'td';
  return (
    <Cell colSpan={numberAttr(node, 'colspan')} rowSpan={numberAttr(node, 'rowspan')}>
      {renderChildren(node, context)}
    </Cell>
  );
}

/** One whitelisted node; any other type renders nothing. */
function RichNodeView({ node, context }: { node: RichNode; context: RenderContext }): ReactNode {
  switch (node.type) {
    case 'text':
      return renderText(node, context);
    case 'paragraph':
      return <p>{renderChildren(node, context)}</p>;
    case 'heading':
      return renderHeading(node, context);
    case 'bulletList':
      return <ul>{renderChildren(node, context)}</ul>;
    case 'orderedList':
      return <ol start={numberAttr(node, 'start')}>{renderChildren(node, context)}</ol>;
    case 'listItem':
      return <li>{renderChildren(node, context)}</li>;
    case 'blockquote':
      return <blockquote>{renderChildren(node, context)}</blockquote>;
    case 'codeBlock':
      return (
        <pre dir="ltr">
          <code>{textOf(node)}</code>
        </pre>
      );
    case 'hardBreak':
      return <br />;
    case 'horizontalRule':
      return <hr />;
    case 'image':
      return renderImage(node);
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table>
            <tbody>{renderChildren(node, context)}</tbody>
          </table>
        </div>
      );
    case 'tableRow':
      return <tr>{renderChildren(node, context)}</tr>;
    case 'tableHeader':
    case 'tableCell':
      return renderTableCell(node, context);
    default:
      return null;
  }
}

/**
 * Renders stored Tiptap JSON through a whitelist (CLAUDE.md §8): only known nodes and marks,
 * links with an allowed protocol (external ones in a new tab without an opener), and https
 * images from the allowed hosts through `next/image`. No HTML string is ever injected.
 */
export function RichText({
  doc,
  locale,
  className,
}: {
  doc: RichTextDto;
  locale: Locale;
  className?: string;
}) {
  const context: RenderContext = { locale, nextHeadingId: createHeadingIds() };
  return (
    <div className={cn('prose-codex', className)}>
      {renderChildren({ type: 'doc', content: rootNodes(doc) }, context)}
    </div>
  );
}
