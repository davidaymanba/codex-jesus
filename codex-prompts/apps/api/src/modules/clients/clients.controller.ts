import type { Response } from 'express';

import type {
  CreateClientInput,
  IdParams,
  Pagination,
  ReorderInput,
  ClientQuery,
  UpdateClientInput,
} from '@codex/shared';

import type { BodyRequest, QueryRequest, ValidRequest } from '@/middleware/validate.js';
import { actorOf } from '@/modules/auth/actor.js';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/response.js';

import {
  createClient,
  deleteClient,
  getClient,
  listClients,
  listPublicClients,
  reorderClients,
  updateClient,
} from './clients.service.js';

export async function getPublicClients(
  req: QueryRequest<Pagination>,
  res: Response,
): Promise<void> {
  const { items, meta } = await listPublicClients(req.query);
  sendSuccess(res, items, meta);
}

export async function getClients(req: QueryRequest<ClientQuery>, res: Response): Promise<void> {
  const { items, meta } = await listClients(req.query);
  sendSuccess(res, items, meta);
}

export async function getClientById(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  sendSuccess(res, await getClient(req.params.id));
}

export async function postClient(
  req: BodyRequest<CreateClientInput>,
  res: Response,
): Promise<void> {
  sendCreated(res, await createClient(req.body, actorOf(req)));
}

export async function patchClient(
  req: ValidRequest<IdParams, UpdateClientInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await updateClient(req.params.id, req.body, actorOf(req)));
}

export async function removeClient(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  await deleteClient(req.params.id, actorOf(req));
  sendNoContent(res);
}

export async function putClientOrder(req: BodyRequest<ReorderInput>, res: Response): Promise<void> {
  sendSuccess(res, { updated: await reorderClients(req.body.ids, actorOf(req)) });
}
