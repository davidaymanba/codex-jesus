import { createServer, type AddressInfo, type Server } from 'node:net';

import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '@/app.js';

import { startServer } from './http-server.js';

const openServers: { close: () => unknown }[] = [];

function listenOnRandomPort(): Promise<Server> {
  return new Promise((resolve) => {
    const blocker = createServer();
    blocker.listen(0, () => {
      resolve(blocker);
    });
  });
}

afterEach(() => {
  for (const server of openServers.splice(0)) server.close();
});

describe('startServer', () => {
  it('resolves with a listening server', async () => {
    const server = await startServer(createApp(), 0);
    openServers.push(server);

    expect(server.listening).toBe(true);
  });

  it('rejects when the port is already in use', async () => {
    const blocker = await listenOnRandomPort();
    openServers.push(blocker);
    const { port } = blocker.address() as AddressInfo;

    await expect(startServer(createApp(), port)).rejects.toMatchObject({ code: 'EADDRINUSE' });
  });
});
