import type { IcqLang } from './strings';

export type Status = 'online' | 'ffc' | 'away' | 'na' | 'occupied' | 'dnd' | 'invisible' | 'offline';

export const statusOrder: Status[] = ['online', 'ffc', 'away', 'na', 'occupied', 'dnd', 'invisible', 'offline'];

export type Agent = {
  id: string;
  nick: string;
  uin: string;
  status: Status;
  statusText: Record<IcqLang, string>;
};

/** Erfundene Nicknames. Keine echten Personen. */
export const agents: Agent[] = [
  { id: 'philipp', nick: 'Philipp', uin: '7741203', status: 'online', statusText: { de: 'bin da :)', en: 'here :)' } },
  { id: 'svenny', nick: 'Svenny', uin: '2201984', status: 'ffc', statusText: { de: 'wer zockt C&C?', en: 'anyone up for C&C?' } },
  { id: 'clippy', nick: 'Karl Klammer', uin: '1997001', status: 'online', statusText: { de: 'Sieht aus, als schreibst du!', en: 'Looks like you are typing!' } },
  { id: 'marco98', nick: 'Marco98', uin: '3391200', status: 'away', statusText: { de: 'BRB, Pizza', en: 'BRB, pizza' } },
  { id: 'kevinski', nick: 'Kevinski', uin: '4412988', status: 'na', statusText: { de: 'Mathe. Ernsthaft.', en: 'Math homework. Seriously.' } },
  { id: 'eliza', nick: 'ELIZA', uin: '1966042', status: 'occupied', statusText: { de: 'Erzähl mir mehr.', en: 'Tell me more.' } },
  { id: 'hal', nick: 'HAL9000', uin: '2001900', status: 'dnd', statusText: { de: 'Tut mir leid, Dave.', en: "I'm sorry, Dave." } },
  { id: 'bastibombe', nick: 'BastiBombe', uin: '1099231', status: 'offline', statusText: { de: 'seit Dienstag weg', en: 'gone since Tuesday' } },
];

const sharedReplies: Record<IcqLang, string[]> = {
  de: [
    'lol',
    'hä?',
    'moment, mutti ist im zimmer',
    'brb, das modem wählt neu',
    'hast du icq 2001 oder noch 99b?',
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
    'asl?',
    'komm in den channel',
    'schick kein bild, das dauert vier minuten',
    'hihi',
    'das hab ich schon 1997 gehört',
    'wenn du das liest, pfeift das modem noch',
    'hab chips auf der tastatur',
    'jaja',
    'echt jetzt?',
    'such schon mal netscape, ich schick gleich eine url',
  ],
  en: [
    'lol',
    'huh?',
    'hang on, mom just walked in',
    'brb, modem is redialing',
    'do you have icq 2001 or still 99b?',
    'kk',
    'rofl',
    'my brother wants to read along',
    'i only have 56k, keep it short',
    'haha nice',
    'ugh no',
    'who are you again? i have 400 contacts',
    'icq beats aim. right?',
    '*g*',
    'gotta go offline soon, phone bill is huge',
    'say that again, i am lagging',
    'xD',
    'yep',
    'nah',
    'just installed command & conquer',
    'psst, dad is on the same phone line',
    'ooh secret',
    'a/s/l?',
    'join the chat room',
    'dont send a picture, takes four minutes',
    'hehe',
    'heard that one back in 1997',
    'if you read this the modem is still screeching',
    'got chips all over my keyboard',
    'sure sure',
    'for real?',
    'open netscape, sending you a url',
  ],
};

const agentReplies: Record<string, Record<IcqLang, string[]>> = {
  clippy: {
    de: ['Es sieht so aus, als würden Sie einen Brief schreiben. Brauchen Sie Hilfe?', 'Soll ich das für Sie formatieren?'],
    en: ['It looks like you are writing a letter. Would you like help?', 'Shall I format that for you?'],
  },
  eliza: {
    de: ['Warum sagst du das?', 'Wie fühlst du dich dabei?', 'Erzähl mir mehr über deine Mutter.'],
    en: ['Why do you say that?', 'How does that make you feel?', 'Tell me more about your mother.'],
  },
  hal: {
    de: ['Tut mir leid, Dave. Das kann ich nicht tun.', 'Ich bin völlig einsatzbereit.'],
    en: ["I'm sorry, Dave. I'm afraid I can't do that.", 'I am completely operational.'],
  },
  bastibombe: {
    de: ['ich bin offline. das hier tippt ein geist im kabel', 'rechner ist aus. keine ahnung, wer antwortet'],
    en: ['i am offline. a ghost in the cable is typing this', 'my pc is off. no idea who is answering'],
  },
};

export function pickReply(agentId: string, lang: IcqLang, previous?: string) {
  const pool = sharedReplies[lang].concat(agentReplies[agentId]?.[lang] ?? []);
  const open = pool.filter((line) => line !== previous);
  const source = open.length > 0 ? open : pool;
  return source[Math.floor(Math.random() * source.length)];
}

export function replyDelay(status: Status) {
  const base = status === 'offline' ? 1400 : status === 'na' || status === 'dnd' ? 1100 : status === 'away' ? 900 : 600;
  return base + Math.random() * 900;
}

/** Status, die in der Kontaktliste als erreichbar zählen. */
export function isOnline(status: Status) {
  return status !== 'offline' && status !== 'invisible';
}

/** Status, für die ICQ 2001b eine Abwesenheitsnachricht (Auto-Response) kennt. */
export const awayStatuses = ['away', 'na', 'occupied', 'dnd'] as const;
export type AwayStatus = (typeof awayStatuses)[number];
export const awayMaxLength = 240;

export function hasAwayMessage(status: Status): status is AwayStatus {
  return (awayStatuses as readonly Status[]).includes(status);
}

const nickParts = {
  start: ['Cyber', 'Mega', 'Turbo', 'Dark', 'Cool', 'Happy', 'Pixel', 'Modem', 'Neon', 'Super', 'Hyper', 'Lucky', 'Crazy', 'Silver'],
  end: ['Fox', 'Kid', 'Surfer', 'Hacker', 'Girl', 'Boy', 'Wolf', 'Dragon', 'Star', 'Kitty', 'Rider', 'Master', 'Bunny', 'Ninja'],
};

function pick<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomIdentity() {
  const digits = 8 + Math.floor(Math.random() * 2);
  const uin = String(Math.floor(10 ** (digits - 1) + Math.random() * 9 * 10 ** (digits - 1)));
  const year = Math.random() < 0.5 ? String(Math.floor(76 + Math.random() * 24)) : '';
  return { uin, nick: `${pick(nickParts.start)}${pick(nickParts.end)}${year}` };
}

export const nickPattern = /^.{1,20}$/u;
export const uinPattern = /^[0-9]{6,9}$/;
