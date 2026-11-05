import { awayMaxLength, awayStatuses, type AwayStatus } from './data';

const key = 'sa85.icq';

export type FriendRef = { key: string; nick: string; uin: string };

type Stored = {
  uin?: string;
  nick?: string;
  optIn?: boolean;
  friends?: FriendRef[];
  /** Aufgeklappte Gruppen als „online:friends“, „offline:agents“ usw. */
  open?: string[];
  /** Zeitpunkt der zuletzt gelesenen Besucher-Nachricht, ISO-String. */
  readUntil?: string;
  awayMessages?: Partial<Record<AwayStatus, string>>;
};

function readAwayMessages(value: unknown) {
  const result: Partial<Record<AwayStatus, string>> = {};
  if (!value || typeof value !== 'object') return result;
  for (const status of awayStatuses) {
    const message = (value as Record<string, unknown>)[status];
    if (typeof message === 'string') result[status] = message.slice(0, awayMaxLength);
  }
  return result;
}

function read(): Stored {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '{}');
    return value && typeof value === 'object' ? (value as Stored) : {};
  } catch {
    return {};
  }
}

export function loadIcq() {
  const stored = read();
  return {
    uin: typeof stored.uin === 'string' ? stored.uin : undefined,
    nick: typeof stored.nick === 'string' ? stored.nick : undefined,
    optIn: stored.optIn === true,
    friends: Array.isArray(stored.friends) ? stored.friends.filter((item) => typeof item?.key === 'string') : [],
    open: Array.isArray(stored.open)
      ? stored.open.filter((item): item is string => typeof item === 'string')
      : ['online:friends', 'online:visitors', 'online:agents'],
    readUntil: typeof stored.readUntil === 'string' ? stored.readUntil : undefined,
    awayMessages: readAwayMessages(stored.awayMessages),
  };
}

export function saveIcq(patch: Stored) {
  try {
    localStorage.setItem(key, JSON.stringify({ ...read(), ...patch }));
  } catch {
    /* privater Modus oder voller Speicher: dann eben ohne Merken */
  }
}
