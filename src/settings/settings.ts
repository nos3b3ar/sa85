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

export const locales = ['de', 'en', 'fr', 'es', 'ja', 'th'] as const;
export type Locale = (typeof locales)[number];

export const cursorSchemes = ['standard', 'large', '3d', 'animated', 'black', 'inverted'] as const;
export type CursorScheme = (typeof cursorSchemes)[number];

export const cursorRoles = [
  'normal',
  'help',
  'background',
  'busy',
  'precision',
  'text',
  'unavailable',
  'resizeNS',
  'resizeEW',
  'resizeNWSE',
  'resizeNESW',
  'move',
  'link',
] as const;
export type CursorRole = (typeof cursorRoles)[number];

/** Hochgeladenes Bild, bereits auf 32x32 normalisiert. */
export type CustomCursor = { url: string; x: number; y: number };

export type MouseSettings = {
  scheme: CursorScheme;
  custom: Partial<Record<CursorRole, CustomCursor>>;
  /** Höchster Abstand zweier Klicks in Millisekunden, der noch als Doppelklick gilt. */
  doubleClickMs: number;
  leftHanded: boolean;
  /** 1 bis 11 wie der Regler in Windows 98. Browser erlauben keine echte Änderung. */
  speed: number;
  trail: boolean;
  trailLength: number;
};

export type UserAccount = {
  name: string;
  /** Kennwörter werden nicht gespeichert, nur ob eines festgelegt wurde. */
  hasPassword: boolean;
  personal: PersonalItem[];
};

export const personalItems = ['desktop', 'startMenu', 'favorites', 'webPages', 'documents'] as const;
export type PersonalItem = (typeof personalItems)[number];

export const powerSchemes = ['desktop', 'portable', 'alwaysOn'] as const;
export type PowerScheme = (typeof powerSchemes)[number];

/** Minuten, 0 bedeutet "Nie". */
export type PowerTimeouts = { monitor: number; disk: number };

export type NetworkIdentity = {
  computerName: string;
  workgroup: string;
  description: string;
  accessControl: 'share' | 'user';
};

export const administrator = 'Administrator';

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
  /** Sprache der Windows-Oberfläche und Format für Zahlen, Datum und Uhrzeit. */
  locale: Locale;
  mouse: MouseSettings;
  users: UserAccount[];
  powerScheme: PowerScheme;
  powerTimeouts: Record<PowerScheme, PowerTimeouts>;
  showPowerMeter: boolean;
  network: NetworkIdentity;
};

const storageKey = 'sa85-settings';

export const defaultMouse: MouseSettings = {
  scheme: 'standard',
  custom: {},
  doubleClickMs: 500,
  leftHanded: false,
  speed: 6,
  trail: false,
  trailLength: 4,
};

export const defaultPowerTimeouts: Record<PowerScheme, PowerTimeouts> = {
  desktop: { monitor: 15, disk: 30 },
  portable: { monitor: 15, disk: 30 },
  alwaysOn: { monitor: 15, disk: 0 },
};

export const defaultUsers: UserAccount[] = [
  { name: administrator, hasPassword: false, personal: [...personalItems] },
];

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
  assistantSetupDone: true,
  assistantSounds: true,
  assistantTips: true,
  assistantPosition: null,
  locale: 'de',
  mouse: defaultMouse,
  users: defaultUsers,
  powerScheme: 'desktop',
  powerTimeouts: defaultPowerTimeouts,
  showPowerMeter: false,
  network: {
    computerName: 'SA85',
    workgroup: 'ARBEITSGRUPPE',
    description: 'Stefans Rechner',
    accessControl: 'share',
  },
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function oneOf<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return list.includes(value as T) ? (value as T) : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function readMouse(value: unknown): MouseSettings {
  if (!isRecord(value)) return defaultMouse;
  const custom: MouseSettings['custom'] = {};
  if (isRecord(value.custom)) {
    for (const role of cursorRoles) {
      const entry = value.custom[role];
      if (!isRecord(entry) || typeof entry.url !== 'string' || !entry.url.startsWith('data:image/')) continue;
      custom[role] = { url: entry.url, x: clampNumber(entry.x, 0, 31, 0), y: clampNumber(entry.y, 0, 31, 0) };
    }
  }
  return {
    scheme: oneOf(cursorSchemes, value.scheme, defaultMouse.scheme),
    custom,
    doubleClickMs: clampNumber(value.doubleClickMs, 150, 900, defaultMouse.doubleClickMs),
    leftHanded: value.leftHanded === true,
    speed: Math.round(clampNumber(value.speed, 1, 11, defaultMouse.speed)),
    trail: value.trail === true,
    trailLength: Math.round(clampNumber(value.trailLength, 1, 7, defaultMouse.trailLength)),
  };
}

function readUsers(value: unknown): UserAccount[] {
  const users: UserAccount[] = [];
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (!isRecord(entry) || typeof entry.name !== 'string') continue;
      const name = entry.name.trim().slice(0, 32);
      if (!name || users.some((user) => user.name.toLowerCase() === name.toLowerCase())) continue;
      const personal = Array.isArray(entry.personal)
        ? personalItems.filter((item) => (entry.personal as unknown[]).includes(item))
        : [];
      users.push({ name, hasPassword: entry.hasPassword === true, personal });
    }
  }
  if (!users.some((user) => user.name === administrator)) users.unshift(defaultUsers[0]);
  return users;
}

function readPowerTimeouts(value: unknown): Settings['powerTimeouts'] {
  const result = { ...defaultPowerTimeouts };
  if (!isRecord(value)) return result;
  for (const scheme of powerSchemes) {
    const entry = value[scheme];
    if (!isRecord(entry)) continue;
    result[scheme] = {
      monitor: Math.round(clampNumber(entry.monitor, 0, 300, defaultPowerTimeouts[scheme].monitor)),
      disk: Math.round(clampNumber(entry.disk, 0, 300, defaultPowerTimeouts[scheme].disk)),
    };
  }
  return result;
}

function readNetwork(value: unknown): NetworkIdentity {
  const fallback = defaultSettings.network;
  if (!isRecord(value)) return fallback;
  const text = (input: unknown, max: number, empty: string) =>
    typeof input === 'string' && input.trim() ? input.slice(0, max) : empty;
  return {
    computerName: text(value.computerName, 15, fallback.computerName),
    workgroup: text(value.workgroup, 15, fallback.workgroup),
    description: typeof value.description === 'string' ? value.description.slice(0, 48) : fallback.description,
    accessControl: value.accessControl === 'user' ? 'user' : 'share',
  };
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
      locale: oneOf(locales, stored.locale, defaultSettings.locale),
      mouse: readMouse(stored.mouse),
      users: readUsers(stored.users),
      powerScheme: oneOf(powerSchemes, stored.powerScheme, defaultSettings.powerScheme),
      powerTimeouts: readPowerTimeouts(stored.powerTimeouts),
      showPowerMeter: stored.showPowerMeter === true,
      network: readNetwork(stored.network),
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
