// The presets are plain JS, so they are linted without type information.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**'] },
  js.configs.recommended,
  { languageOptions: { globals: { ...globals.node } }, rules: { 'no-console': 'error' } },
  prettier,
];
