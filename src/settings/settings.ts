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

export type Look = '95' | '98';

export type Settings = {
  /** Oberfläche im Stil von Windows 95 oder Windows 98. */
  look: Look;
  volume: number;
  muted: boolean;
  desktopColor: string;
  saver: SaverId;
  saverWaitSeconds: number;
  saverText3d: string;
  saverMarqueeText: string;
  /** Einwahl-Dialog des Retro-Browsers nicht erneut zeigen. */
  autoConnect: boolean;
  iconPositions: Record<string, { x: number; y: number }>;
};

const storageKey = 'sa85-settings';

export const defaultSettings: Settings = {
  look: '98',
  volume: 0.8,
  muted: false,
  desktopColor: '#008080',
  saver: 'pipes',
  saverWaitSeconds: 30,
  saverText3d: 'sa85',
  saverMarqueeText: 'Willkommen auf dem Schreibtisch von Stefan Andernach!',
  autoConnect: false,
  iconPositions: {},
};

let current: Settings = load();
const listeners = new Set<() => void>();

function readIconPositions(value: unknown): Settings['iconPositions'] {
  if (!value || typeof value !== 'object') return {};
  const positions: Settings['iconPositions'] = {};
  for (const [id, point] of Object.entries(value)) {
    if (!point || typeof point !== 'object') continue;
    const { x, y } = point as { x?: unknown; y?: unknown };
    if (typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y)) {
      positions[id] = { x, y };
    }
  }
  return positions;
}

function load(): Settings {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultSettings;
    const stored = JSON.parse(raw) as Partial<Settings>;
    if (stored.saverText3d === 'Andernach85') stored.saverText3d = 'sa85';
    if (stored.look !== '95' && stored.look !== '98') delete stored.look;
    return { ...defaultSettings, ...stored, iconPositions: readIconPositions(stored.iconPositions) };
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
