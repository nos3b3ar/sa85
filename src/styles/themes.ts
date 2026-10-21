import original from 'react95/dist/themes/original';
import type { Look } from '../settings/settings';

const win98 = {
  ...original,
  name: 'win98',
  headerBackground: 'linear-gradient(to right, #000080, #1084d0)',
  headerNotActiveBackground: 'linear-gradient(to right, #808080, #b5b5b5)',
  headerNotActiveText: '#d4d0c8',
};

export const themes: Record<Look, typeof original> = { '95': original, '98': win98 };

/** Texte, die sich zwischen Windows 95 und 98 unterscheiden. */
export const lookInfo: Record<Look, { name: string; edition: string | null; build: string; dosVersion: string }> = {
  '95': { name: 'Microsoft Windows 95', edition: null, build: '4.00.950 B', dosVersion: '4.00.950' },
  '98': { name: 'Microsoft Windows 98', edition: 'Zweite Ausgabe', build: '4.10.2222 A', dosVersion: '4.10.1998' },
};
