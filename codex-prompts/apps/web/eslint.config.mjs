import { createReactConfig } from '@codex/config/eslint/react';

export default [
  { ignores: ['next-env.d.ts'] },
  ...createReactConfig({ tsconfigRootDir: import.meta.dirname, next: true }),
];
