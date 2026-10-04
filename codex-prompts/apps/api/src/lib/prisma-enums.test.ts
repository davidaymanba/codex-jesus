import { describe, expect, it } from 'vitest';

import * as shared from '@codex/shared';

import * as db from '@/generated/prisma/enums.js';

/** Prisma enums and shared enums must never drift: the API trusts both. */
const PAIRS: [string, Record<string, string>, readonly string[]][] = [
  ['Role', db.Role, Object.values(shared.Role)],
  ['ContentStatus', db.ContentStatus, Object.values(shared.ContentStatus)],
  ['ServiceCategory', db.ServiceCategory, Object.values(shared.ServiceCategory)],
  ['CategoryType', db.CategoryType, Object.values(shared.CategoryType)],
  ['Team', db.Team, Object.values(shared.Team)],
  ['LeadStatus', db.LeadStatus, Object.values(shared.LeadStatus)],
  ['ContactStatus', db.ContactStatus, Object.values(shared.ContactStatus)],
  ['Locale', db.Locale, shared.LOCALES],
  ['ServiceOffering', db.ServiceOffering, Object.values(shared.ServiceOffering)],
  ['BudgetRange', db.BudgetRange, Object.values(shared.BudgetRange)],
  ['ProjectTimeline', db.ProjectTimeline, Object.values(shared.ProjectTimeline)],
  ['AuditAction', db.AuditAction, Object.values(shared.AuditAction)],
  ['AuditEntity', db.AuditEntity, Object.values(shared.AuditEntity)],
];

describe('Prisma enums match @codex/shared', () => {
  it.each(PAIRS)('%s', (_name, prismaEnum, sharedValues) => {
    expect(Object.values(prismaEnum).sort()).toEqual([...sharedValues].sort());
  });
});
