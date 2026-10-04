import type { Server } from 'node:http';

import request, { type Response } from 'supertest';
import type { z } from 'zod';

import { CSRF_HEADER } from '@codex/shared';

import { createApp } from '@/app.js';

export const ORIGIN = 'http://localhost:3000';

/** A browser-like cookie jar: keeps the latest value per cookie name, drops cleared ones. */
export class CookieJar {
  private readonly cookies = new Map<string, string>();

  store(response: Response): this {
    const header = response.headers['set-cookie'];
    const lines: string[] = Array.isArray(header) ? header : header ? [header] : [];
    for (const line of lines) {
      const [pair = ''] = line.split(';');
      const [name = '', value = ''] = pair.split('=');
      if (value === '' || /expires=Thu, 01 Jan 1970/i.test(line)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    return this;
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }

  header(): string {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  clone(): CookieJar {
    const copy = new CookieJar();
    for (const [name, value] of this.cookies) copy.cookies.set(name, value);
    return copy;
  }
}

/** Raw Set-Cookie line for `name` (to assert flags). */
export function setCookieLine(response: Response, name: string): string | undefined {
  const header = response.headers['set-cookie'];
  const lines: string[] = Array.isArray(header) ? header : header ? [header] : [];
  return lines.find((line) => line.startsWith(`${name}=`));
}

/**
 * One listening server per test file: `request(app)` on a bare Express app would start and
 * stop a server for every request, and that ephemeral-port churn occasionally made a
 * response unparsable ("Expected HTTP/") under load.
 */
export const app: Server = createApp().listen(0, '127.0.0.1');

/** A state-changing request as the admin UI sends it: Origin, cookies and the CSRF header. */
export function post(path: string, jar: CookieJar, csrf = jar.get('codex_csrf')) {
  const call = request(app).post(path).set('Origin', ORIGIN).set('Cookie', jar.header());
  return csrf ? call.set(CSRF_HEADER, csrf) : call;
}

export async function login(email: string, password: string, jar = new CookieJar()) {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .set('Origin', ORIGIN)
    .send({ email, password });
  jar.store(response);
  return { response, jar };
}

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

/** An admin API call as the admin UI makes it: session cookies, Origin and CSRF header. */
export function adminCall(method: Method, path: string, jar: CookieJar) {
  const call = request(app)
    [method](`/api/v1${path}`)
    .set('Origin', ORIGIN)
    .set('Cookie', jar.header());
  const csrf = jar.get('codex_csrf');
  return csrf ? call.set(CSRF_HEADER, csrf) : call;
}

/** Signs in a fresh user with `role` and returns its cookie jar. */
export async function signInAs(role: 'ADMIN' | 'EDITOR' = 'ADMIN'): Promise<CookieJar> {
  const { createUser } = await import('./database.js');
  const user = await createUser({
    role,
    email: `${role.toLowerCase()}-${Date.now()}@codex.example`,
  });
  const { jar } = await login(user.email, user.password);
  return jar;
}

/** The `data` of a success envelope, checked against the documented response schema. */
export function dataOf<TSchema extends z.ZodType>(
  response: Response,
  schema: TSchema,
): z.output<TSchema> {
  const body = response.body as { success?: unknown; data?: unknown };
  if (body.success !== true) throw new Error(`Expected a success envelope, got ${response.status}`);
  return schema.parse(body.data);
}
