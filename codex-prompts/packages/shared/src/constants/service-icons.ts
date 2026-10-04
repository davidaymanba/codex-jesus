/** lucide-react icon names a service may use; keeps the admin from storing arbitrary strings. */
export const SERVICE_ICONS = [
  'code-xml',
  'palette',
  'megaphone',
  'shopping-cart',
  'graduation-cap',
  'bot',
  'workflow',
  'layout-dashboard',
  'pen-tool',
  'chart-line',
] as const;

export type ServiceIcon = (typeof SERVICE_ICONS)[number];
