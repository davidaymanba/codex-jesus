// Root config only lints repo-level config files; each workspace has its own eslint.config.mjs
// (ESLint 10 resolves the config nearest to each linted file).
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  { ignores: ['apps/**', 'packages/**', '**/node_modules/**'] },
  js.configs.recommended,
  { languageOptions: { globals: { ...globals.node } }, rules: { 'no-console': 'error' } },
  prettier,
];
