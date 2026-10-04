import { Button, Heading, Text } from '@react-email/components';
import type { ReactNode } from 'react';

import { BRAND_COLORS } from '@codex/shared';

export function EmailHeading({ children }: { children: ReactNode }) {
  return (
    <Heading
      as="h1"
      style={{
        color: BRAND_COLORS.navy950,
        fontSize: '22px',
        lineHeight: '30px',
        margin: '0 0 16px',
      }}
    >
      {children}
    </Heading>
  );
}

export function Paragraph({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        color: BRAND_COLORS.indigo700,
        fontSize: '16px',
        lineHeight: '26px',
        margin: '0 0 16px',
      }}
    >
      {children}
    </Text>
  );
}

/** Primary CTA: gold with navy text (CLAUDE.md §5; never gold text on light). */
export function PrimaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: BRAND_COLORS.gold500,
        borderRadius: '12px',
        color: BRAND_COLORS.navy950,
        display: 'inline-block',
        fontSize: '16px',
        fontWeight: 700,
        padding: '14px 24px',
        textDecoration: 'none',
      }}
    >
      {children}
    </Button>
  );
}

/** One labelled value in a details list; long text keeps its line breaks. */
export function Field({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ fontSize: '15px', lineHeight: '24px', margin: '0 0 12px' }}>
      <strong style={{ color: BRAND_COLORS.navy950 }}>{label}</strong>
      <br />
      <span style={{ color: BRAND_COLORS.indigo700, whiteSpace: 'pre-wrap' }}>{value}</span>
    </Text>
  );
}
