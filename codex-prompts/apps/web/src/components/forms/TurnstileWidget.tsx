'use client';

import { useEffect, useImperativeHandle, useRef, useState, type Ref, type RefObject } from 'react';

import type { Locale } from '@codex/shared/constants';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
// Start loading a little before the form scrolls into view.
const PRELOAD_MARGIN = '300px';

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | undefined;

/**
 * Loads Cloudflare's script once. Under the nonce CSP with 'strict-dynamic', a script added
 * by our own (nonce-trusted) code is allowed, so no nonce has to be passed down.
 */
function loadTurnstile(): Promise<TurnstileApi> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('Turnstile did not initialise'));
    };
    script.onerror = () => {
      scriptPromise = undefined;
      reject(new Error('Turnstile failed to load'));
    };
    document.head.append(script);
  });
  return scriptPromise;
}

export interface TurnstileHandle {
  /** A token is single-use: get a fresh one after each submission attempt. */
  reset: () => void;
}

interface TurnstileWidgetProps {
  siteKey: string;
  locale: Locale;
  /** The current token, or `null` while there is none (expired, failed, not solved yet). */
  onToken: (token: string | null) => void;
  /** Shown when the challenge cannot load (network, blocker). */
  failedLabel: string;
  /** Load once this element (the whole form) nears the viewport; the widget itself otherwise. */
  triggerRef?: RefObject<HTMLElement | null>;
  ref?: Ref<TurnstileHandle>;
}

/** Cloudflare Turnstile, loaded only when the form is about to be seen. */
export function TurnstileWidget({
  siteKey,
  locale,
  onToken,
  failedLabel,
  triggerRef,
  ref,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      onTokenRef.current(null);
      if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let isActive = true;
    const render = (api: TurnstileApi) => {
      if (!isActive || widgetIdRef.current) return;
      widgetIdRef.current = api.render(container, {
        sitekey: siteKey,
        language: locale,
        theme: 'light',
        size: 'flexible',
        callback: (token: string) => {
          onTokenRef.current(token);
        },
        'expired-callback': () => {
          onTokenRef.current(null);
        },
        'error-callback': () => {
          onTokenRef.current(null);
        },
      });
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        loadTurnstile().then(render, () => {
          if (isActive) setHasFailed(true);
        });
      },
      { rootMargin: PRELOAD_MARGIN },
    );
    observer.observe(triggerRef?.current ?? container);
    return () => {
      isActive = false;
      observer.disconnect();
      if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [locale, siteKey, triggerRef]);

  return (
    <div>
      <div ref={containerRef} className="min-h-[65px]" />
      {hasFailed ? (
        <p role="alert" className="text-sm font-medium">
          {failedLabel}
        </p>
      ) : null}
    </div>
  );
}
