export type DosGame = {
  id: string;
  title: string;
  year: number;
  file: string;
  /** Ordner unter C:\GAMES, in den das Archiv entpackt wird. */
  dir: string;
  exe: string;
  /** Name der Startdatei C:\GAMES\<command>.BAT im MS-DOS-Modus. */
  command: string;
  /** Feste DOSBox-Zyklen für Spiele, deren Tempo an der CPU hängt. Ohne Angabe gilt cycles=auto. */
  cycles?: number;
  license: string;
};

/** Nur Spiele, deren Rechteinhaber die kostenlose Weitergabe erlaubt haben. Dateien in den Archiven unverändert lassen. */
export const dosGames: DosGame[] = [
  {
    id: 'keen1',
    title: 'Commander Keen 1: Marooned on Mars',
    year: 1990,
    file: '/dos/games/keen1.zip',
    dir: 'KEEN1',
    exe: 'KEEN1.EXE',
    command: 'KEEN',
    license: 'Shareware-Episode von id Software/Apogee, Weitergabe laut LICENSE.DOC erlaubt',
  },
  {
    id: 'doom1',
    title: 'Doom (Shareware)',
    year: 1993,
    file: '/dos/games/doom1.zip',
    dir: 'DOOM',
    exe: 'DOOM.EXE',
    command: 'DOOM',
    license: 'Shareware-Episode von id Software, frei weitergebbar',
  },
  {
    id: 'omf2097',
    title: 'One Must Fall: 2097',
    year: 1994,
    file: '/dos/games/omf2097.zip',
    dir: 'OMF',
    exe: 'OMF.EXE',
    command: 'OMF',
    cycles: 20000,
    license: 'Seit 1999 Freeware von Diversions Entertainment',
  },
  {
    id: 'tyrian2k',
    title: 'Tyrian 2000',
    year: 1999,
    file: '/dos/games/tyrian2k.zip',
    dir: 'TYRIAN',
    exe: 'TYRIAN2K.EXE',
    command: 'TYRIAN',
    license: 'Seit 2004 Freeware von Jason Emery',
  },
];
