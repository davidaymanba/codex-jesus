import { AuditAction, VALIDATION_MESSAGES as MSG, type AuditEntity } from '@codex/shared';

import { withTransaction } from '@/lib/base-repository.js';
import { ValidationError } from '@/lib/errors.js';
import type { Actor } from '@/modules/auth/actor.js';

import { auditWrite } from './audit.js';
import { publishChanges } from './publish-changes.js';
import { ReorderRepository, type OrderedTable } from './reorder.repository.js';

const UNKNOWN_ID_ISSUE = { path: 'ids', message: MSG.INVALID_ID };

/**
 * Saves the order an admin arranged (the full list, first to last) atomically; unknown ids
 * roll everything back with a 400. Returns how many rows were reordered.
 */
export async function reorderRows(
  table: OrderedTable,
  entity: AuditEntity,
  ids: readonly string[],
  actor: Actor,
  tags: readonly string[],
): Promise<number> {
  const updated = await withTransaction(async (tx) => {
    const count = await new ReorderRepository(tx).reorder(table, ids);
    if (count !== ids.length) throw new ValidationError([UNKNOWN_ID_ISSUE]);
    await auditWrite(tx, actor, {
      action: AuditAction.REORDER,
      entity,
      entityId: table,
      changes: { ids },
    });
    return count;
  });
  await publishChanges(tags);
  return updated;
}
