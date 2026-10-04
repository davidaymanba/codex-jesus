import type { Router } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '@/app.js';
import { API_PREFIX, HEALTH_PATH } from '@/config/constants.js';
import { healthRouter } from '@/modules/health/health.routes.js';
import { apiRouters } from '@/routes.js';
import { productionEnvOverrides } from '@/test/test-env.js';

import { documentedPaths } from './openapi.js';

/** `METHOD /path` for every route of a router, with Express `:param` turned into `{param}`. */
function routesOf(router: Router, prefix: string): string[] {
  return router.stack.flatMap(({ route }) => {
    if (!route) return [];
    const path = `${prefix}${route.path === '/' ? '' : route.path}`.replace(/:(\w+)/g, '{$1}');
    const methods = new Set(route.stack.map((layer) => layer.method.toUpperCase()));
    return [...methods].map((method) => `${method} ${path}`);
  });
}

const documented = Object.entries(documentedPaths).flatMap(([path, item]) =>
  Object.keys(item).map((method) => `${method.toUpperCase()} ${path}`),
);

describe('OpenAPI document', () => {
  it('documents every mounted route, and nothing else', () => {
    const mounted = [
      ...routesOf(healthRouter, HEALTH_PATH),
      ...apiRouters.flatMap((router) => routesOf(router, API_PREFIX)),
    ];

    expect(documented.sort()).toEqual(mounted.sort());
  });

  it('serves Swagger UI and the document outside production', async () => {
    const app = createApp();
    const ui = await request(app).get('/api/docs/').redirects(1);
    const json = await request(app).get('/api/docs/openapi.json');

    expect(ui.status).toBe(200);
    expect(ui.text).toContain('swagger-ui');
    expect(json.status).toBe(200);
    expect(Object.keys((json.body as { paths: object }).paths)).toEqual(
      Object.keys(documentedPaths),
    );
  });
});

describe('docs in production', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function productionApp(credentials?: { username: string; password: string }) {
    vi.resetModules();
    for (const [key, value] of Object.entries(productionEnvOverrides())) vi.stubEnv(key, value);
    vi.stubEnv('DOCS_USERNAME', credentials?.username ?? '');
    vi.stubEnv('DOCS_PASSWORD', credentials?.password ?? '');
    const { createDocsRouter } = await import('./docs.routes.js');
    return createDocsRouter();
  }

  it('are disabled without credentials', async () => {
    expect(await productionApp()).toBeUndefined();
  });

  it('require basic auth when credentials are set', async () => {
    const credentials = { username: 'docs', password: 'a-long-docs-password' };
    const router = await productionApp(credentials);
    if (!router) throw new Error('expected a docs router');
    const { default: express } = await import('express');
    const app = express().use('/api/docs', router);

    const anonymous = await request(app).get('/api/docs/openapi.json');
    const signedIn = await request(app)
      .get('/api/docs/openapi.json')
      .auth(credentials.username, credentials.password);

    expect(anonymous.status).toBe(401);
    expect(anonymous.headers['www-authenticate']).toContain('Basic');
    expect(signedIn.status).toBe(200);
  });
});
