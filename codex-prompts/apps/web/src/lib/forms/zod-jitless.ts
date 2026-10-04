import { z } from 'zod';

// zod probes `new Function` to compile fast parsers; the nonce CSP (no 'unsafe-eval') reports
// that as a violation. Jitless mode skips the probe. This module must be evaluated before any
// schema module: src/lib/forms/schemas.ts imports it first.
z.config({ jitless: true });
