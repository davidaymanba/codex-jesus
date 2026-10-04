import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { createIntegrationEnv, createTestEnv } from './src/test/test-env.js';

// Integration tests derive their URLs from the local .env (CI provides TEST_* variables).
if (existsSync('.env')) process.loadEnvFile('.env');

const INTEGRATION_TESTS = 'src/**/*.int.test.ts';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    // docs/phases/03 §9: ≥ 80% on services. `pnpm test:coverage` runs both projects, because
    // services are mostly exercised by the integration suite.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.service.ts'],
      reporter: ['text-summary', 'text', 'html'],
      reportsDirectory: 'coverage',
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'prisma/**/*.test.ts'],
          exclude: [INTEGRATION_TESTS],
          // env.ts validates on import; unit tests get a valid baseline and never reach a database.
          env: createTestEnv(),
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: [INTEGRATION_TESTS],
          env: createIntegrationEnv(process.env),
          globalSetup: ['src/test/integration/global-setup.ts'],
          setupFiles: ['src/test/integration/setup.ts'],
          // Suites share one database and reset it between tests.
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
