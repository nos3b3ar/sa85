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

export type AssistantId = 'clippy' | 'merlin';

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
  /** Ausgewählter Office-Assistent auf dem Desktop. */
  assistant: AssistantId;
  /** Ob der Assistent auf dem Desktop sichtbar ist. */
  assistantEnabled: boolean;
  /** Ob der Einrichtungs-Assistent bereits abgeschlossen wurde. */
  assistantSetupDone: boolean;
  /** Ob der Assistent seine eigenen Soundeffekte abspielt. */
  assistantSounds: boolean;
  /** Ob der Assistent subtile Entdecker-Tipps zur Website gibt. */
  assistantTips: boolean;
  /** Position des Assistenten auf dem Desktop. */
  assistantPosition: { x: number; y: number } | null;
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
  assistant: 'merlin',
  assistantEnabled: true,
  assistantSetupDone: false,
  assistantSounds: true,
  assistantTips: true,
  assistantPosition: null,
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

function readPoint(value: unknown): { x: number; y: number } | null {
  if (!value || typeof value !== 'object') return null;
  const { x, y } = value as { x?: unknown; y?: unknown };
  if (typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y)) {
    return { x, y };
  }
  return null;
}

function load(): Settings {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultSettings;
    const stored = JSON.parse(raw) as Partial<Settings>;
    if (stored.saverText3d === 'Andernach85') stored.saverText3d = 'sa85';
    if (stored.look !== '95' && stored.look !== '98') delete stored.look;
    if (stored.assistant !== 'clippy' && stored.assistant !== 'merlin') delete stored.assistant;
    return {
      ...defaultSettings,
      ...stored,
      iconPositions: readIconPositions(stored.iconPositions),
      assistantPosition: readPoint(stored.assistantPosition),
    };
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
