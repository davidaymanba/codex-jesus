import type { Request, RequestHandler } from 'express';
import type { z } from 'zod';

/** A request whose body was parsed by `validate({ body })`. */
export type BodyRequest<TBody> = Request<Request['params'], unknown, TBody>;

/** A request whose query was parsed by `validate({ query })`. */
export type QueryRequest<TQuery> = Request<Request['params'], unknown, unknown, TQuery>;

/** A request whose parts were parsed by `validate(…)`; unvalidated parts keep Express types. */
export type ValidRequest<
  TParams = Request['params'],
  TBody = unknown,
  TQuery = Request['query'],
> = Request<TParams, unknown, TBody, TQuery>;

export interface RequestSchemas {
  params?: z.ZodType;
  body?: z.ZodType;
  query?: z.ZodType;
}

type Parsed<TSchema, TFallback> = TSchema extends z.ZodType ? z.output<TSchema> : TFallback;

export type ValidatedHandler<TSchemas extends RequestSchemas> = RequestHandler<
  Parsed<TSchemas['params'], Request['params']>,
  unknown,
  Parsed<TSchemas['body'], unknown>,
  Parsed<TSchemas['query'], Request['query']>
>;

/**
 * Validates `params`, `body` and `query` with shared zod schemas and replaces them with the
 * parsed values (unknown fields stripped, defaults applied). Failures reach the error handler
 * as a ZodError → 400 with i18n keys per field. Handlers after it see the parsed types.
 */
export function validate<TSchemas extends RequestSchemas>(
  schemas: TSchemas,
): ValidatedHandler<TSchemas> {
  return (req, _res, next) => {
    // The parsed output is exactly `Parsed<…>`; TypeScript cannot relate it to the generic.
    if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
    if (schemas.body) req.body = schemas.body.parse(req.body) as typeof req.body;
    if (schemas.query) {
      // Express 5 exposes `req.query` as a getter; redefine it to hold the parsed value.
      Object.defineProperty(req, 'query', {
        value: schemas.query.parse(req.query),
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    next();
  };
}
