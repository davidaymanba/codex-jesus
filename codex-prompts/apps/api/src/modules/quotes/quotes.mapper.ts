import type { QuoteRequestDto } from '@codex/shared';

import type { QuoteRow } from './quotes.repository.js';

export function toQuoteRequestDto(row: QuoteRow): QuoteRequestDto {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** CSV columns, in order (headers stay English: the file is for spreadsheets, not the UI). */
export const QUOTE_CSV_HEADER = [
  'id',
  'createdAt',
  'status',
  'name',
  'email',
  'phone',
  'company',
  'services',
  'budgetRange',
  'timeline',
  'locale',
  'assignedTo',
  'projectDetails',
  'internalNotes',
] as const;

export function toQuoteCsvCells(row: QuoteRow) {
  return [
    row.id,
    row.createdAt.toISOString(),
    row.status,
    row.name,
    row.email,
    row.phone,
    row.company,
    row.services.join(' '),
    row.budgetRange,
    row.timeline,
    row.locale,
    row.assignedTo?.name,
    row.projectDetails,
    row.internalNotes,
  ];
}
