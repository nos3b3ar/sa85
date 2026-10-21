import { getSettings, useSettings, type Locale } from '../settings/settings';
import { de, type Messages } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { ja } from './ja';
import { th } from './th';

export type { Messages };

export const messages: Record<Locale, Messages> = { de, en, fr, es, ja, th };

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
  return messages[useSettings().locale];
}

export function useLocaleTag() {
  return localeTags[useSettings().locale];
}

export function getT() {
  return messages[getSettings().locale];
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
