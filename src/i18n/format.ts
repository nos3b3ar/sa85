import type { Locale } from '../settings/settings';

export const currencies: Record<Locale, string> = {
  de: 'EUR',
  en: 'USD',
  fr: 'EUR',
  es: 'EUR',
  ja: 'JPY',
  th: 'THB',
};

/** 1 = Montag, 7 = Sonntag. Intl.Locale#weekInfo gibt es noch nicht in allen Browsern. */
export const firstDayOfWeek: Record<Locale, 1 | 7> = {
  de: 1,
  en: 7,
  fr: 1,
  es: 1,
  ja: 7,
  th: 7,
};

const part = (parts: Intl.NumberFormatPart[] | Intl.DateTimeFormatPart[], type: string) =>
  (parts as { type: string; value: string }[]).find((item) => item.type === type)?.value ?? '';

export function numberInfo(tag: string) {
  const parts = new Intl.NumberFormat(tag, { minimumFractionDigits: 2 }).formatToParts(-1234567.89);
  const integers = parts.filter((item) => item.type === 'integer');
  return {
    positive: new Intl.NumberFormat(tag, { minimumFractionDigits: 2 }).format(123456789),
    negative: new Intl.NumberFormat(tag, { minimumFractionDigits: 2 }).format(-123456789),
    decimal: part(parts, 'decimal'),
    group: part(parts, 'group'),
    groupSize: integers.length > 1 ? integers[integers.length - 1].value.length : 3,
    minus: part(parts, 'minusSign'),
    leadingZero: new Intl.NumberFormat(tag, { minimumFractionDigits: 1 }).format(0.7),
  };
}

export function currencyInfo(tag: string, currency: string) {
  const format = new Intl.NumberFormat(tag, { style: 'currency', currency });
  const parts = format.formatToParts(-123456789.25);
  return {
    positive: format.format(123456789.25),
    negative: format.format(-123456789.25),
    symbol: part(parts, 'currency'),
    decimals: format.resolvedOptions().maximumFractionDigits ?? 2,
  };
}

const timePattern: Record<string, (value: string) => string> = {
  hour: (value) => (value.length > 1 ? 'HH' : 'H'),
  minute: () => 'mm',
  second: () => 'ss',
  dayPeriod: () => 'tt',
};

const datePattern: Record<string, (value: string) => string> = {
  day: (value) => (value.length > 1 ? 'dd' : 'd'),
  month: (value) => (/^\d+$/.test(value) ? (value.length > 1 ? 'MM' : 'M') : 'MMMM'),
  year: (value) => (value.length > 2 ? 'yyyy' : 'yy'),
  weekday: () => 'dddd',
  era: () => 'gg',
  relatedYear: () => 'yyyy',
};

function pattern(parts: Intl.DateTimeFormatPart[], map: Record<string, (value: string) => string>) {
  return parts.map((item) => map[item.type]?.(item.value) ?? item.value).join('');
}

export function timeInfo(tag: string, date: Date) {
  const format = new Intl.DateTimeFormat(tag, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  const parts = format.formatToParts(date);
  const hourIndex = parts.findIndex((item) => item.type === 'hour');
  const separator = parts[hourIndex + 1]?.type === 'literal' ? parts[hourIndex + 1].value : ':';
  const period = (hour: number) => part(
    new Intl.DateTimeFormat(tag, { hour: 'numeric', hour12: true }).formatToParts(new Date(2000, 0, 1, hour)),
    'dayPeriod',
  );
  const cycle = (format.resolvedOptions() as { hourCycle?: string }).hourCycle;
  return {
    example: format.format(date),
    pattern: pattern(parts, timePattern).replace(/^H/, cycle === 'h12' || cycle === 'h11' ? 'h' : 'H'),
    separator,
    am: period(9) || 'AM',
    pm: period(21) || 'PM',
    is24h: cycle === 'h23' || cycle === 'h24',
  };
}

export function dateInfo(tag: string, date: Date) {
  const short = new Intl.DateTimeFormat(tag, { dateStyle: 'short' });
  const long = new Intl.DateTimeFormat(tag, { dateStyle: 'full' });
  const shortParts = short.formatToParts(date);
  return {
    short: short.format(date),
    long: long.format(date),
    shortPattern: pattern(shortParts, datePattern),
    longPattern: pattern(long.formatToParts(date), datePattern),
    separator: shortParts.find((item) => item.type === 'literal')?.value ?? '.',
    calendar: short.resolvedOptions().calendar,
  };
}

export function weekdayName(tag: string, day: 1 | 7) {
  // 2001-01-01 war ein Montag, 2001-01-07 ein Sonntag.
  return new Intl.DateTimeFormat(tag, { weekday: 'long' }).format(new Date(2001, 0, day));
}
