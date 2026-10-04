/** Pagination limits shared by the API and every list UI. */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 50,
  /** Deep OFFSET scans get slow and nobody pages this far; filters or search do the job. */
  MAX_PAGE: 1000,
} as const;
