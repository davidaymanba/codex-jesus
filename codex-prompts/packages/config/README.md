# @codex/config

Shared TypeScript, ESLint (flat config) and Prettier presets. Imported by every workspace; never imports from apps.

## Path aliases

`tsconfig/base.json` deliberately has no `paths`. TypeScript 6 dropped `baseUrl`, so `paths` resolve relative to the file that declares them; a base-level `@/*` would point into this package. Each app declares its own `@/*` → `./src/*`.
