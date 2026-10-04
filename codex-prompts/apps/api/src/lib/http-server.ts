import type { Server } from 'node:http';

import type { Express } from 'express';

/**
 * Starts listening and resolves once the port is bound.
 * Express 5 reports bind errors (e.g. `EADDRINUSE`) through the listen callback,
 * so ignoring them would log success for a server that never started.
 */
export function startServer(app: Express, port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(server);
    });
  });
}
