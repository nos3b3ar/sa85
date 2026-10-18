export type WebPage = {
  title: string;
  /** Adresse, wie sie in der Adressleiste steht. */
  url: string;
  /** Tatsächlich geladene Quelle (Wayback-Snapshot oder einbettbare Live-Seite). */
  src: string;
};

const wayback = (timestamp: string, url: string) => `https://web.archive.org/web/${timestamp}if_/${url}`;

export const homePages = {
  ie: {
    title: 'Microsoft Corporation',
    url: 'http://www.microsoft.com/',
    src: wayback('19981205060735', 'http://microsoft.com/'),
  },
  netscape: {
    title: 'Netscape Netcenter',
    url: 'http://home.netscape.com/',
    src: wayback('19981203074735', 'http://home.netscape.com/'),
  },
} satisfies Record<string, WebPage>;

export const bookmarks: WebPage[] = [
  { title: 'Google (1998)', url: 'http://www.google.com/', src: wayback('19981111184551', 'http://google.com/') },
  { title: 'Yahoo! (1996)', url: 'http://www.yahoo.com/', src: wayback('19961228024612', 'http://www4.yahoo.com/') },
  { title: 'Apple (1997)', url: 'http://www.apple.com/', src: wayback('19971015112557', 'http://www2.apple.com/') },
  { title: 'heise online (1997)', url: 'http://www.heise.de/', src: wayback('19971212003106', 'http://www.heise.de/') },
  { title: 'SPIEGEL ONLINE (1998)', url: 'http://www.spiegel.de/', src: wayback('19981212032947', 'http://www.spiegel.de/') },
  { title: 'GeoCities (1998)', url: 'http://www.geocities.com/', src: wayback('19981212034415', 'http://www9.geocities.com/') },
  {
    title: 'Space Jam (1996)',
    url: 'http://www.spacejam.com/',
    src: wayback('20031127032218', 'http://www2.warnerbros.com/spacejam/movie/jam.htm'),
  },
  { title: "Cameron's World", url: 'https://www.cameronsworld.net/', src: 'https://www.cameronsworld.net/' },
  { title: 'Zombo.com', url: 'https://www.zombo.com/', src: 'https://www.zombo.com/' },
  { title: 'Windows 93', url: 'https://www.windows93.net/', src: 'https://www.windows93.net/' },
  { title: 'The Old Net', url: 'https://theoldnet.com/', src: 'https://theoldnet.com/' },
  { title: 'Toasty Tech GUI Gallery', url: 'https://www.toastytech.com/guis/', src: 'https://www.toastytech.com/guis/' },
  { title: 'WinHistory.de', url: 'https://www.winhistory.de/', src: 'https://www.winhistory.de/' },
];

/** Ohne „www.“ eintragen und frame-src in netlify.toml mitpflegen (Host mit und ohne www). */
const embeddableHosts = [
  'web.archive.org',
  'cameronsworld.net',
  'zombo.com',
  'windows93.net',
  'theoldnet.com',
  'toastytech.com',
  'winhistory.de',
  'arngren.net',
];

/** Eingetippte Adressen ohne Einbett-Erlaubnis laufen über die Wayback Machine von 1999. */
export function resolveAddress(input: string): WebPage | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const known = [homePages.ie, homePages.netscape, ...bookmarks].find(
    (page) => normalize(page.url) === normalize(trimmed),
  );
  if (known) return known;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, '');
  const live = embeddableHosts.includes(host);
  return {
    title: parsed.hostname,
    url: parsed.href,
    src: live ? parsed.href.replace(/^http:/, 'https:') : wayback('1999', parsed.href),
  };
}

function normalize(url: string) {
  return url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}
