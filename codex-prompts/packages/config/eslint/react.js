import eslintReact from '@eslint-react/eslint-plugin';
import nextPlugin from '@next/eslint-plugin-next';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import { createBaseConfig } from './base.js';

/**
 * ESLint flat config for React workspaces. Pass `next: true` for Next.js apps.
 * Uses @eslint-react (ESLint 10 compatible) instead of eslint-plugin-react.
 * @param {{ tsconfigRootDir: string, next?: boolean }} options
 */
export function createReactConfig({ next = false, ...options }) {
  const { tsconfigRootDir } = options;
  return [
    ...createBaseConfig(options),
    {
      files: ['**/*.{ts,tsx}'],
      ...eslintReact.configs['strict-type-checked'],
      languageOptions: { globals: { ...globals.browser, ...globals.node } },
      rules: {
        ...eslintReact.configs['strict-type-checked'].rules,
        // Security rules are errors, not warnings (CLAUDE.md §8: never render unsanitized HTML).
        '@eslint-react/dom-no-dangerously-set-innerhtml': 'error',
        '@eslint-react/dom-no-unsafe-target-blank': 'error',
        '@eslint-react/dom-no-script-url': 'error',
      },
    },
    // eslint-plugin-react-hooks owns the hooks rules (incl. React Compiler checks).
    {
      files: ['**/*.{ts,tsx}'],
      ...eslintReact.configs['disable-conflict-eslint-plugin-react-hooks'],
    },
    reactHooks.configs.flat['recommended-latest'],
    jsxA11y.flatConfigs.strict,
    ...(next
      ? [
          {
            plugins: { '@next/next': nextPlugin },
            // The Next plugin otherwise looks for `pages/` relative to the cwd (repo root under lint-staged).
            settings: { next: { rootDir: tsconfigRootDir } },
            rules: {
              ...nextPlugin.configs.recommended.rules,
              ...nextPlugin.configs['core-web-vitals'].rules,
            },
          },
        ]
      : []),
  ];
}
