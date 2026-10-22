export type FriendStatus = 'online' | 'away' | 'na' | 'offline';

export type Friend = {
  id: string;
  nick: string;
  uin: string;
  status: FriendStatus;
  statusText: string;
};

export const myNick = 'sa85';
export const myUin = '851998';

/** Erfundene ICQ-Nicknames. Keine echten Personen. */
export const friends: Friend[] = [
  { id: 'philipp', nick: 'Philipp', uin: '7741203', status: 'online', statusText: 'bin da :)' },
  { id: 'svenny', nick: 'Svenny', uin: '2201984', status: 'online', statusText: 'wer zockt C&C?' },
  { id: 'marco98', nick: 'Marco98', uin: '3391200', status: 'away', statusText: 'BRB, Pizza' },
  { id: 'kevinski', nick: 'Kevinski', uin: '4412988', status: 'na', statusText: 'Mathe. Ernsthaft.' },
  { id: 'bastibombe', nick: 'BastiBombe', uin: '1099231', status: 'offline', statusText: 'seit Dienstag weg' },
];

export const statusLabel: Record<FriendStatus, string> = {
  online: 'Online',
  away: 'Abwesend',
  na: 'Beschäftigt',
  offline: 'Offline',
};

export const bootLines = [
  'ICQ 99b wird gestartet …',
  'Winsock: Einwahl „sa85-modem“',
  'Verbinde mit dem Blumen-Server',
  'Lade 5 Kontakte',
  'Bereit.',
];

const sharedReplies = [
  'lol',
  'hä?',
  'moment, mutti ist im zimmer',
  'brb, das modem wählt neu',
  'hast du icq 99 oder noch die blume von 98?',
  'kk',
  'rofl',
  'mein bruder will auch mitlesen',
  'ich hab nur 56k, schreib kurz',
  'haha nice',
  'boah nee',
  'wer bist du nochmal? hab 400 kontakte',
  'icq schlägt aim. oder?',
  '*g*',
  'ok muss gleich offline, die telekom klingelt',
  'schreib nochmal, ich lagge',
  'xD',
  'jo',
  'ne du',
  'hab grade command & conquer installiert',
  'psst, vater telefoniert auf derselben leitung',
  'uuh geheim',
  'asg',
  'komm in den channel',
  'schick kein bild, das dauert vier minuten',
  'hihi',
  'das hab ich schon 1997 gehört',
  'wenn du das liest, pfeift das modem noch',
  'counter ist besser als icq. oder andersrum. egal',
  'hab chips auf der tastatur',
  'jaja',
  'echt jetzt?',
  'such schon mal netscape, ich schick gleich eine url',
];

const statusReplies: Record<FriendStatus, string[]> = {
  online: ['ich sitz direkt am rechner, ehrlich', 'endlich mal jemand, der schreibt'],
  away: ['bin weg, tippe aus der küche', 'pizza klebt an der taste, warte'],
  na: ['beschäftigt!! … na gut, was gibt’s', 'matheheft zu, icq auf. klassiker'],
  offline: [
    'ich bin offline. das hier tippt ein geist im kabel',
    'rechner ist aus. keine ahnung, wer antwortet',
    'die nachricht sollte im nirwana liegen. tja',
  ],
};

export function pickReply(status: FriendStatus, previous?: string) {
  const pool = sharedReplies.concat(statusReplies[status]);
  const open = pool.filter((line) => line !== previous);
  const source = open.length > 0 ? open : pool;
  return source[Math.floor(Math.random() * source.length)];
}

export function replyDelay(status: FriendStatus) {
  const base = status === 'offline' ? 1400 : status === 'na' ? 1100 : status === 'away' ? 900 : 600;
  return base + Math.random() * 900;
}
