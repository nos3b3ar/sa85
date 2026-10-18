export type BerlinDate = {
  year: number;
  month: number;
  day: number;
};

export type DstNotice = {
  key: string;
  transition: BerlinDate;
};

const storagePrefix = 'sa85-';

export function berlinToday(now = new Date()): BerlinDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read('year'), month: read('month'), day: read('day') };
}

export function lastSunday(year: number, month: number): BerlinDate {
  const last = new Date(Date.UTC(year, month, 0));
  return { year, month, day: last.getUTCDate() - last.getUTCDay() };
}

function dayNumber(date: BerlinDate) {
  return Math.floor(Date.UTC(date.year, date.month - 1, date.day) / 86_400_000);
}

export function currentDstNotice(now = new Date()): DstNotice | null {
  const today = berlinToday(now);
  const transitions = [lastSunday(today.year, 3), lastSunday(today.year, 10)];
  for (const transition of transitions) {
    const delta = dayNumber(today) - dayNumber(transition);
    if (delta >= 0 && delta < 30) {
      const month = String(transition.month).padStart(2, '0');
      return { key: `dst-${transition.year}-${month}`, transition };
    }
  }
  return null;
}

export function shouldShowDstDialog(now = new Date()): DstNotice | null {
  const forced = new URLSearchParams(window.location.search).has('dst');
  const notice = currentDstNotice(now) ?? (forced ? { key: 'dst-preview', transition: berlinToday(now) } : null);
  if (!notice || forced) return notice;
  try {
    if (localStorage.getItem(storagePrefix + notice.key) === 'seen') return null;
  } catch {
    return notice;
  }
  return notice;
}

export function markDstSeen(key: string) {
  try {
    localStorage.setItem(storagePrefix + key, 'seen');
  } catch {
    // Privater Modus ohne Storage bleibt still.
  }
}
