import 'server-only';

type Level = 'warn' | 'error';

/** Error fields worth logging; never the request or response bodies (they may carry PII). */
function describeError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) return { error: String(error) };
  return { error: error.name, message: error.message, stack: error.stack };
}

function write(level: Level, message: string, context: Record<string, unknown>): void {
  const entry = { level, time: new Date().toISOString(), message, ...context };
  process.stderr.write(`${JSON.stringify(entry)}\n`);
}

/** Minimal JSON-lines logger for the web server (the hosting platform collects stderr). */
export const logger = {
  warn(message: string, context: Record<string, unknown> = {}): void {
    write('warn', message, context);
  },
  error(message: string, error: unknown, context: Record<string, unknown> = {}): void {
    write('error', message, { ...context, ...describeError(error) });
  },
};
