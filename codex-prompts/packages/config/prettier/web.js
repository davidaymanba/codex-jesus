import * as tailwindPlugin from 'prettier-plugin-tailwindcss';

import base from './index.js';

/** @type {import('prettier').Config} */
const config = {
  ...base,
  // Pass the module (not its name) so it resolves from this package, not the caller's cwd.
  plugins: [tailwindPlugin],
  tailwindFunctions: ['cn', 'cva'],
};

export default config;
