import type { FieldValues, Resolver } from 'react-hook-form';

/**
 * A react-hook-form resolver whose code (zod and the shared schemas, ~100 KB gzipped) is
 * downloaded on first use instead of with the page. `preload()` starts the download early,
 * e.g. when a field is first focused, so validation is ready before the first blur.
 */
export function lazyResolver<TInput extends FieldValues, TOutput>(
  load: () => Promise<Resolver<TInput, unknown, TOutput>>,
): { resolver: Resolver<TInput, unknown, TOutput>; preload: () => void } {
  let loading: Promise<Resolver<TInput, unknown, TOutput>> | undefined;
  const get = () => (loading ??= load());
  return {
    resolver: async (values, context, options) => (await get())(values, context, options),
    preload: () => {
      void get();
    },
  };
}
