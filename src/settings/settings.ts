import { useSyncExternalStore } from 'react';

export type SaverId =
  | 'none'
  | 'pipes'
  | 'starfield'
  | 'text3d'
  | 'bezier'
  | 'marquee'
  | 'mystify'
  | 'buckett'
  | 'flyingWindows'
  | 'maze'
  | 'objects3d';

export type Settings = {
  volume: number;
  muted: boolean;
  desktopColor: string;
  saver: SaverId;
  saverWaitSeconds: number;
  saverText3d: string;
  saverMarqueeText: string;
};

const storageKey = 'sa85-settings';

export const defaultSettings: Settings = {
  volume: 0.8,
  muted: false,
  desktopColor: '#008080',
  saver: 'pipes',
  saverWaitSeconds: 30,
  saverText3d: 'Andernach85',
  saverMarqueeText: 'Willkommen auf dem Schreibtisch von Stefan Andernach!',
};

let current: Settings = load();
const listeners = new Set<() => void>();

function load(): Settings {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? { ...defaultSettings, ...(JSON.parse(raw) as Partial<Settings>) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function getSettings() {
  return current;
}

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(current));
  } catch {
    // Privater Modus: Einstellungen gelten nur für diese Sitzung.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSettings() {
  return useSyncExternalStore(subscribe, getSettings);
}

export function effectiveVolume() {
  return current.muted ? 0 : current.volume;
}

export function onSettingsChange(listener: () => void) {
  return subscribe(listener);
}
