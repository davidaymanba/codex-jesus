import { existsSync } from 'node:fs';

import { defineConfig } from 'prisma/config';

// Prisma 7 no longer loads .env itself; Node's built-in loader avoids a dotenv dependency.
if (existsSync('.env')) process.loadEnvFile('.env');

// Migrations use the direct (non-pooled) owner connection; the app uses DATABASE_URL (pooled,
// least-privilege) via the driver adapter. Optional here so `prisma generate` works without a
// database (CI); migrate/studio fail with a clear message when it is missing.
const directUrl = process.env.DIRECT_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed/index.ts',
  },
  ...(directUrl && { datasource: { url: directUrl } }),
});
