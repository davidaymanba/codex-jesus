import {
  BookOpenCheck,
  Bot,
  Boxes,
  ChartLine,
  Compass,
  Contact,
  Globe,
  Layers,
  Megaphone,
  PenTool,
  Search,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Store,
  SwatchBook,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

import type { ServiceOffering } from '@codex/shared';

const ICONS: Record<ServiceOffering, LucideIcon> = {
  ECOMMERCE: ShoppingCart,
  ELEARNING: BookOpenCheck,
  ERP: Boxes,
  CRM: Contact,
  SALLA: Store,
  SHOPIFY: ShoppingBag,
  WORDPRESS: Globe,
  AI_AGENTS: Bot,
  N8N_AUTOMATION: Workflow,
  BRAND_STRATEGY: Compass,
  LOGO_DESIGN: PenTool,
  VISUAL_IDENTITY: SwatchBook,
  BRAND_GUIDELINES: Layers,
  SOCIAL_MEDIA: Share2,
  CONTENT_CREATION: Megaphone,
  PAID_ADS: ChartLine,
  SEO: Search,
};

/** Decorative icon of a requestable service (its label names it). */
export function OfferingIcon({
  offering,
  className,
}: {
  offering: ServiceOffering;
  className?: string;
}) {
  const Icon = ICONS[offering];
  return <Icon aria-hidden className={className} />;
}
