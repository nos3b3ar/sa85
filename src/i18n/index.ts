import { useEffect, useSyncExternalStore } from 'react';
import { getSettings, useSettings, type Locale } from '../settings/settings';
import { de, type Messages } from './de';

export type { Messages };

/** Deutsch ist immer im Bundle, alle anderen Sprachen werden erst bei Bedarf geladen. */
const loaders: Record<Locale, () => Promise<Messages>> = {
  de: () => Promise.resolve(de),
  en: () => import('./en').then((module) => module.en),
  fr: () => import('./fr').then((module) => module.fr),
  es: () => import('./es').then((module) => module.es),
  ja: () => import('./ja').then((module) => module.ja),
  th: () => import('./th').then((module) => module.th),
};

const loaded: Partial<Record<Locale, Messages>> = { de };
const listeners = new Set<() => void>();

export async function loadMessages(locale: Locale) {
  if (loaded[locale]) return;
  loaded[locale] = await loaders[locale]();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Format für Zahlen, Datum und Uhrzeit je Sprache. */
export const localeTags: Record<Locale, string> = {
  de: 'de-DE',
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  ja: 'ja-JP',
  th: 'th-TH',
};

/** Sprachnamen erscheinen immer in der jeweiligen Sprache selbst. */
export const languageNames: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  ja: '日本語',
  th: 'ไทย',
};

export function useT() {
  const { locale } = useSettings();
  const t = useSyncExternalStore(subscribe, () => loaded[locale]);
  useEffect(() => {
    void loadMessages(locale);
  }, [locale]);
  return t ?? de;
}

export function useLocaleTag() {
  return localeTags[useSettings().locale];
}

export function getT() {
  return loaded[getSettings().locale] ?? de;
}

/** Übersetzter Titel für Systemfenster, sonst der deutsche Titel aus der Registry. */
export function appTitle(t: Messages, app: { id: string; title: string }) {
  return (t.apps as Record<string, string | undefined>)[app.id] ?? app.title;
}

export function windowTitle(t: Messages, app: { id: string; title: string; windowTitle?: string } | undefined, own?: string) {
  if (own) return own;
  if (!app) return '';
  return app.windowTitle ?? appTitle(t, app);
}
