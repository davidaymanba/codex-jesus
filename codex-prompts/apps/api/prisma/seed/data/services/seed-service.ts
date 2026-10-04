import type { CreateServiceInput } from '@codex/shared';

import { seedId } from '../../builders.js';

export const serviceId = (key: string): string => seedId(`service:${key}`);

export type SeedService = CreateServiceInput & { id: string; slugAr: string; slugEn: string };
