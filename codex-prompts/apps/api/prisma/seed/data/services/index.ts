import { branding } from './branding.js';
import { development } from './development.js';
import { marketing } from './marketing.js';
import type { SeedService } from './seed-service.js';

export { serviceId } from './seed-service.js';

export const SERVICES: SeedService[] = [development, branding, marketing];
