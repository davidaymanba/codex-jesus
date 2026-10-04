import type { ContactFormInput, QuoteFormInput } from '@codex/shared';

import { BaseRepository } from '@/lib/base-repository.js';

/** Where a submission came from; raw IPs are never stored. */
export interface SubmissionOrigin {
  ipHash: string;
  userAgent: string | null;
}

export class FormsRepository extends BaseRepository {
  async createQuoteRequest(input: QuoteFormInput, origin: SubmissionOrigin): Promise<string> {
    const { id } = await this.db.quoteRequest.create({
      data: { ...input, phone: input.phone ?? null, company: input.company ?? null, ...origin },
      select: { id: true },
    });
    return id;
  }

  async createContactMessage(input: ContactFormInput, ipHash: string): Promise<string> {
    const { id } = await this.db.contactMessage.create({
      data: { ...input, phone: input.phone ?? null, ipHash },
      select: { id: true },
    });
    return id;
  }
}
