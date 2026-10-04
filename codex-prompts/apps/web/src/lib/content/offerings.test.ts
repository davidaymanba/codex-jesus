import { describe, expect, it } from 'vitest';

import { ServiceCategory, ServiceOffering } from '@codex/shared';

import { OFFERINGS_BY_PILLAR, PILLARS } from './offerings';

describe('OFFERINGS_BY_PILLAR', () => {
  it('lists every offering exactly once', () => {
    const listed = Object.values(OFFERINGS_BY_PILLAR).flat();
    expect([...listed].sort()).toEqual(Object.values(ServiceOffering).sort());
  });

  it('has a group for every pillar', () => {
    expect([...PILLARS].sort()).toEqual(Object.values(ServiceCategory).sort());
  });
});
