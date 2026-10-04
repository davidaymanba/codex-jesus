import { Router } from 'express';

import { getLiveness, getReadinessStatus } from './health.controller.js';

export const healthRouter: Router = Router();

healthRouter.get('/', getLiveness);
healthRouter.get('/ready', getReadinessStatus);
