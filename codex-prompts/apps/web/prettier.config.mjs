import web from '@codex/config/prettier/web';

/** @type {import('prettier').Config} */
const config = {
  ...web,
  tailwindStylesheet: './src/styles/globals.css',
};

export default config;
