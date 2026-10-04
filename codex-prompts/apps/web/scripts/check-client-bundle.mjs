/**
 * Post-build guard for browser bundles (.next/static):
 * - zod only where a form needs it: a chunk containing zod may be referenced only by the
 *   contact and quote pages (their forms run zod in jitless mode; anywhere else it is dead
 *   weight, and without jitless it probes `new Function`, which the nonce CSP reports);
 * - no server secret: INTERNAL_API_TOKEN / REVALIDATE_SECRET values must never ship.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const STATIC_DIR = '.next/static';
const SERVER_APP_DIR = '.next/server/app';
const MANIFEST_SUFFIX = 'page_client-reference-manifest.js';
const ZOD_MARKER = '$ZodType';
// Routes whose client code may include zod (keys of the client reference manifests).
const ZOD_ROUTES = [/\/contact\/page$/, /\/quote\/page$/];
const SECRET_KEYS = ['INTERNAL_API_TOKEN', 'REVALIDATE_SECRET'];
// The files `next build` reads, highest priority first (loadEnvFile never overrides a key).
const ENV_FILES = ['.env.production.local', '.env.local', '.env.production', '.env'];

for (const file of ENV_FILES) if (existsSync(file)) process.loadEnvFile(file);

const filesIn = (dir, suffix) =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith(suffix))
    .map((file) => join(dir, file));

/** chunk file name → routes whose page manifest references it. */
function routesByChunk() {
  const routes = new Map();
  for (const manifest of filesIn(SERVER_APP_DIR, MANIFEST_SUFFIX)) {
    const code = readFileSync(manifest, 'utf8');
    const route = /__RSC_MANIFEST\["([^"]+)"\]/.exec(code)?.[1] ?? manifest;
    for (const [, chunk] of code.matchAll(/\/_next\/static\/chunks\/([^"]+\.js)/g)) {
      routes.set(chunk, (routes.get(chunk) ?? new Set()).add(route));
    }
  }
  return routes;
}

const nameOf = (file) => file.split('/').pop();

/**
 * Pages that can load `chunk`: those listing it, plus (for dynamic imports, which no manifest
 * lists) the pages of every chunk whose code references it.
 */
function pagesLoading(chunk, routes, codeByChunk, seen = new Set()) {
  if (seen.has(chunk)) return new Set();
  seen.add(chunk);
  const pages = new Set(routes.get(chunk) ?? []);
  for (const [other, code] of codeByChunk) {
    if (other !== chunk && code.includes(chunk)) {
      for (const page of pagesLoading(other, routes, codeByChunk, seen)) pages.add(page);
    }
  }
  return pages;
}

function zodProblem(file, routes, codeByChunk) {
  const users = [...pagesLoading(nameOf(file), routes, codeByChunk)];
  if (users.length === 0)
    return `${file}: contains zod but no page loads it (loaded from anywhere?)`;
  const others = users.filter((route) => !ZOD_ROUTES.some((allowed) => allowed.test(route)));
  return others.length > 0 ? `${file}: contains zod, used by ${others.join(', ')}` : undefined;
}

const routes = routesByChunk();
const files = filesIn(STATIC_DIR, '.js');
const codeByChunk = new Map(files.map((file) => [nameOf(file), readFileSync(file, 'utf8')]));
const secrets = SECRET_KEYS.map((key) => [key, process.env[key]]).filter(([, value]) => value);
const problems = files.flatMap((file) => {
  const code = codeByChunk.get(nameOf(file)) ?? '';
  return [
    ...(code.includes(ZOD_MARKER) ? [zodProblem(file, routes, codeByChunk)] : []),
    ...secrets
      .filter(([, value]) => code.includes(value))
      .map(([key]) => `${file}: contains ${key}`),
  ].filter(Boolean);
});

if (problems.length > 0) {
  process.stderr.write(
    `Client bundle check failed:\n${problems.map((p) => `  - ${p}`).join('\n')}\n`,
  );
  process.exit(1);
}
process.stdout.write(`Client bundle check passed (${files.length} files).\n`);
