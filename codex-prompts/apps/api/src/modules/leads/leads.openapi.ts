import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  contactMessageDtoSchema,
  contactMessageExportQuerySchema,
  contactMessageQuerySchema,
  idParamsSchema,
  Permission,
  quoteRequestDtoSchema,
  quoteRequestExportQuerySchema,
  quoteRequestQuerySchema,
  updateContactMessageSchema,
  updateQuoteRequestSchema,
} from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import { ADMIN_ERRORS, adminRead, adminWrite } from '@/modules/docs/crud-openapi.js';
import { errorResponse, jsonBody, successResponse } from '@/modules/docs/openapi-helpers.js';

interface LeadDocs {
  tag: string;
  path: string;
  item: z.ZodType;
  listQuery: z.ZodType<unknown, Record<string, unknown>>;
  exportQuery: z.ZodType<unknown, Record<string, unknown>>;
  update: z.ZodType;
}

const CSV_DESCRIPTION =
  'Streams every match as UTF-8 CSV (with BOM). Cells starting with = + - @, tab or CR are ' +
  "prefixed with `'` against spreadsheet formula injection. Each export is audited.";

function leadPaths({
  tag,
  path,
  item,
  listQuery,
  exportQuery,
  update,
}: LeadDocs): ZodOpenApiPathsObject {
  const base = `${API_PREFIX}${path}`;
  const byId = { path: idParamsSchema };
  return {
    [base]: {
      get: adminRead(tag, Permission.LEADS_READ, {
        summary: `List ${tag.toLowerCase()}`,
        requestParams: { query: listQuery },
        responses: { '200': successResponse('A page of items', z.array(item)), ...ADMIN_ERRORS },
      }),
    },
    [`${base}/export.csv`]: {
      get: adminRead(tag, Permission.LEADS_READ, {
        summary: `Export ${tag.toLowerCase()} as CSV`,
        description: CSV_DESCRIPTION,
        requestParams: { query: exportQuery },
        responses: {
          '200': { description: 'CSV file', content: { 'text/csv': { schema: z.string() } } },
          ...ADMIN_ERRORS,
        },
      }),
    },
    [`${base}/{id}`]: {
      get: adminRead(tag, Permission.LEADS_READ, {
        summary: 'Details',
        requestParams: byId,
        responses: {
          '200': successResponse('The item', item),
          '404': errorResponse('Not found'),
          ...ADMIN_ERRORS,
        },
      }),
      patch: adminWrite(tag, Permission.LEADS_UPDATE, {
        summary: 'Update the status (and, for quotes, assignee and internal notes)',
        requestParams: byId,
        requestBody: jsonBody(update),
        responses: {
          '200': successResponse('Updated', item),
          '400': errorResponse('Invalid input or inactive assignee'),
          '404': errorResponse('Not found'),
          ...ADMIN_ERRORS,
        },
      }),
    },
  };
}

export const leadPathsDocs: ZodOpenApiPathsObject = {
  ...leadPaths({
    tag: 'Quotes',
    path: '/admin/quotes',
    item: quoteRequestDtoSchema,
    listQuery: quoteRequestQuerySchema,
    exportQuery: quoteRequestExportQuerySchema,
    update: updateQuoteRequestSchema,
  }),
  ...leadPaths({
    tag: 'Contact messages',
    path: '/admin/messages',
    item: contactMessageDtoSchema,
    listQuery: contactMessageQuerySchema,
    exportQuery: contactMessageExportQuerySchema,
    update: updateContactMessageSchema,
  }),
};
