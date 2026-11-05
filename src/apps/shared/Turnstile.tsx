import { useEffect, useRef } from 'react';
import { turnstileSiteKey } from '../icq/config';

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      theme?: 'light' | 'dark' | 'auto';
      size?: 'normal' | 'compact' | 'flexible';
      language?: string;
      callback: (token: string) => void;
      'error-callback': () => void;
      'expired-callback': () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const scriptSrc = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile() {
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing')));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('turnstile blocked'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

type TurnstileProps = {
  language: string;
  onToken: (token: string | null) => void;
  onError: () => void;
  size?: 'normal' | 'compact' | 'flexible';
  className?: string;
};

export function Turnstile({ language, onToken, onError, size = 'compact', className = 'icq-captcha' }: TurnstileProps) {
  const host = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onToken, onError });
  handlers.current = { onToken, onError };

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !host.current) return;
        widgetId = api.render(host.current, {
          sitekey: turnstileSiteKey,
          theme: 'light',
          size,
          language,
          callback: (token) => handlers.current.onToken(token),
          'error-callback': () => handlers.current.onError(),
          'expired-callback': () => handlers.current.onToken(null),
        });
      })
      .catch(() => handlers.current.onError());
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [language, size]);

  return <div ref={host} className={className} />;
}
