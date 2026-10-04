import {
  Bot,
  ChartLine,
  CodeXml,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Palette,
  PenTool,
  ShoppingCart,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

import type { ServiceIcon as ServiceIconName } from '@codex/shared';

const ICONS: Record<ServiceIconName, LucideIcon> = {
  'code-xml': CodeXml,
  palette: Palette,
  megaphone: Megaphone,
  'shopping-cart': ShoppingCart,
  'graduation-cap': GraduationCap,
  bot: Bot,
  workflow: Workflow,
  'layout-dashboard': LayoutDashboard,
  'pen-tool': PenTool,
  'chart-line': ChartLine,
};

const isKnownIcon = (name: string): name is ServiceIconName => name in ICONS;

/** The lucide icon the admin picked for a service (decorative; the title names it). */
export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = isKnownIcon(name) ? ICONS[name] : CodeXml;
  return <Icon aria-hidden className={className} />;
}
