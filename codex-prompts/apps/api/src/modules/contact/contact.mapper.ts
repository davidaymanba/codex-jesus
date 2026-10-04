import type { ContactMessageDto } from '@codex/shared';

import type { ContactRow } from './contact.repository.js';

export function toContactMessageDto(row: ContactRow): ContactMessageDto {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

export const CONTACT_CSV_HEADER = [
  'id',
  'createdAt',
  'status',
  'name',
  'email',
  'phone',
  'locale',
  'message',
] as const;

export function toContactCsvCells(row: ContactRow) {
  return [
    row.id,
    row.createdAt.toISOString(),
    row.status,
    row.name,
    row.email,
    row.phone,
    row.locale,
    row.message,
  ];
}
