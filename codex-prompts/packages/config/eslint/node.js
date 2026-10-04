import globals from 'globals';

import { createBaseConfig } from './base.js';

/**
 * ESLint flat config for Node.js workspaces (API, shared libraries).
 * @param {{ tsconfigRootDir: string }} options
 */
export function createNodeConfig(options) {
  return [
    ...createBaseConfig(options),
    {
      languageOptions: { globals: { ...globals.node } },
    },
  ];
}
