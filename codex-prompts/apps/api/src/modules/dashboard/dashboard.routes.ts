import { Router } from 'express';

import { Permission } from '@codex/shared';

import { permitted } from '@/modules/auth/permitted.js';

import { getStats } from './dashboard.controller.js';

export const dashboardRouter: Router = Router();

// Both roles see the dashboard; its numbers are lead and content counts.
dashboardRouter.get('/admin/dashboard/stats', permitted(Permission.LEADS_READ), getStats);
