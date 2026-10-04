/**
 * Name of the hidden honeypot input on public forms. Humans never see or fill it; a value
 * means a bot, so the submission is accepted (201) but silently discarded.
 */
export const HONEYPOT_FIELD = 'website';

/** Public form submissions allowed per client IP per hour (CLAUDE.md §8: strict limits). */
export const FORM_RATE_LIMIT = { POINTS: 5, DURATION_SECONDS: 60 * 60 } as const;
