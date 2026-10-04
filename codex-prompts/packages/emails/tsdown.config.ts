import { defineConfig } from 'tsdown';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'neutral',
  target: 'es2023',
  sourcemap: true,
  // Declarations come from the package tsconfig (TS 6 compatible, unlike tsup's dts build).
  dts: { sourcemap: true },
  // Keep `.js` / `.d.ts` so the package `exports` stay stable.
  fixedExtension: false,
  // Cleaning on every watch rebuild briefly removes dist and breaks dependents mid-dev.
  clean: !options.watch,
  failOnWarn: true,
}));
