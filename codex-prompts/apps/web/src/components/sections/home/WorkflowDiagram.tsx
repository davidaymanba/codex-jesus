import type { Locale } from '@codex/shared';

import { directionOf } from '@/lib/i18n/localized';

const WIDTH = 480;

const NODE_KEYS = ['trigger', 'agent', 'crm', 'notify'] as const;
type NodeKey = (typeof NODE_KEYS)[number];

// Left-to-right layout; mirrored horizontally for right-to-left readers.
const NODES: Record<NodeKey, { x: number; y: number; isHighlighted?: boolean }> = {
  trigger: { x: 70, y: 180 },
  agent: { x: 240, y: 180, isHighlighted: true },
  crm: { x: 410, y: 90 },
  notify: { x: 410, y: 270 },
};
const EDGES: [NodeKey, NodeKey][] = [
  ['trigger', 'agent'],
  ['agent', 'crm'],
  ['agent', 'notify'],
];
const NODE_WIDTH = 120;
const NODE_HEIGHT = 56;

interface WorkflowDiagramProps {
  locale: Locale;
  label: string;
  nodeLabels: Record<NodeKey, string>;
}

/**
 * An n8n-style workflow drawn in SVG: nodes joined by connectors with dashes flowing along
 * them (CSS animation; stopped by reduced motion). One accessible image with a description.
 */
export function WorkflowDiagram({ locale, label, nodeLabels }: WorkflowDiagramProps) {
  const isRtl = directionOf(locale) === 'rtl';
  const xOf = (x: number) => (isRtl ? WIDTH - x : x);
  const position = (key: NodeKey) => ({ x: xOf(NODES[key].x), y: NODES[key].y });

  return (
    <svg viewBox={`0 0 ${String(WIDTH)} 360`} role="img" aria-label={label} className="w-full">
      {EDGES.map(([from, to]) => {
        const start = position(from);
        const end = position(to);
        const midX = (start.x + end.x) / 2;
        const path = `M${String(start.x)} ${String(start.y)} C${String(midX)} ${String(start.y)} ${String(midX)} ${String(end.y)} ${String(end.x)} ${String(end.y)}`;
        return (
          <g key={`${from}-${to}`}>
            <path d={path} fill="none" stroke="var(--surface-border)" strokeWidth="2" />
            <path
              d={path}
              fill="none"
              stroke="var(--color-blue-500)"
              strokeWidth="2.5"
              strokeDasharray="6 10"
              strokeLinecap="round"
              className="animate-flow"
            />
          </g>
        );
      })}
      {NODE_KEYS.map((key) => {
        const node = NODES[key];
        const x = xOf(node.x);
        return (
          <g key={key}>
            {node.isHighlighted ? (
              <rect
                x={x - NODE_WIDTH / 2 - 8}
                y={node.y - NODE_HEIGHT / 2 - 8}
                width={NODE_WIDTH + 16}
                height={NODE_HEIGHT + 16}
                rx="22"
                fill="var(--color-blue-500)"
                opacity="0.18"
                className="animate-pulse-soft"
              />
            ) : null}
            <rect
              x={x - NODE_WIDTH / 2}
              y={node.y - NODE_HEIGHT / 2}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx="16"
              fill={node.isHighlighted ? 'var(--color-blue-700)' : 'var(--surface-card)'}
              stroke={node.isHighlighted ? 'var(--color-blue-500)' : 'var(--surface-border)'}
              strokeWidth="1.5"
            />
            <text
              x={x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--color-white)"
              fontSize="15"
              fontWeight="500"
            >
              {nodeLabels[key]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
