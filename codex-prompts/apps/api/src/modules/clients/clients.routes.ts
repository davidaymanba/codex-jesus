import { Router } from 'express';

import {
  createClientSchema,
  idParamsSchema,
  Permission,
  paginationSchema,
  reorderSchema,
  clientQuerySchema,
  updateClientSchema,
} from '@codex/shared';

import { validate } from '@/middleware/validate.js';
import { permitted } from '@/modules/auth/permitted.js';

import {
  getClientById,
  getClients,
  getPublicClients,
  patchClient,
  postClient,
  putClientOrder,
  removeClient,
} from './clients.controller.js';

const MANAGE = Permission.CONTENT_MANAGE;
const byId = { params: idParamsSchema };

export const clientsRouter: Router = Router();

clientsRouter.get('/public/clients', validate({ query: paginationSchema }), getPublicClients);
clientsRouter.get('/admin/clients', permitted(MANAGE, { query: clientQuerySchema }), getClients);
clientsRouter.post('/admin/clients', permitted(MANAGE, { body: createClientSchema }), postClient);
clientsRouter.put(
  '/admin/clients/reorder',
  permitted(MANAGE, { body: reorderSchema }),
  putClientOrder,
);
clientsRouter.get('/admin/clients/:id', permitted(MANAGE, byId), getClientById);
clientsRouter.patch(
  '/admin/clients/:id',
  permitted(MANAGE, { ...byId, body: updateClientSchema }),
  patchClient,
);
clientsRouter.delete('/admin/clients/:id', permitted(MANAGE, byId), removeClient);
