import { defineConfig } from 'tsdown';

export default defineConfig((options) => ({
  // Browser entries: `constants` has no zod at all (src/constants/client.ts); `forms` only the
  // public form schemas (src/forms.ts).
  entry: { index: 'src/index.ts', constants: 'src/constants/client.ts', forms: 'src/forms.ts' },
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
