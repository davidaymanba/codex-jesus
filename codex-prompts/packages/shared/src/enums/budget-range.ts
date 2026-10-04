import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../constants/validation-messages.js';

/** Quote budget brackets. Currency-neutral; the UI labels them per market. */
export const BudgetRange = {
  UNDER_5K: 'UNDER_5K',
  FROM_5K_TO_15K: 'FROM_5K_TO_15K',
  FROM_15K_TO_50K: 'FROM_15K_TO_50K',
  ABOVE_50K: 'ABOVE_50K',
  NOT_SURE: 'NOT_SURE',
} as const;

export type BudgetRange = (typeof BudgetRange)[keyof typeof BudgetRange];

export const budgetRangeSchema = z.enum(BudgetRange, { error: VALIDATION_MESSAGES.INVALID_OPTION });
