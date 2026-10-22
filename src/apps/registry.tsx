import { Computer } from '@react95/icons/Computer';
import { Controls3000 } from '@react95/icons/Controls3000';
import { Desk100 } from '@react95/icons/Desk100';
import { Folder } from '@react95/icons/Folder';
import { Globe } from '@react95/icons/Globe';
import { Ie } from '@react95/icons/Ie';
import { Intl101 } from '@react95/icons/Intl101';
import { Joy102 } from '@react95/icons/Joy102';
import { Mail } from '@react95/icons/Mail';
import { Network2 } from '@react95/icons/Network2';
import { Notepad } from '@react95/icons/Notepad';
import { PowerOn } from '@react95/icons/PowerOn';
import { RecycleEmpty } from '@react95/icons/RecycleEmpty';
import { Sol1 } from '@react95/icons/Sol1';
import { Winmine1 } from '@react95/icons/Winmine1';
import { Timedate } from '@react95/icons/Timedate';
import { Unmute } from '@react95/icons/Unmute';
import { User } from '@react95/icons/User';
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { profile } from '../content/profile';
import { AssistantIcon } from './AssistantIcon';
import { MsDosIcon } from './MsDosIcon';
import { NetscapeIcon, NetscapeWindowIcon } from './NetscapeIcon';
import { SaForceIcon } from './SaForceIcon';
import { MouseIcon, UsersIcon } from './systemIcons';
import { IcqIcon } from './IcqIcon';
import { WinampIcon } from './WinampIcon';
import type { Look } from '../settings/settings';
import type { AppProps } from './types';

export type IconVariant = '32x32_4' | '16x16_4';

export type DesktopIconComponent = ComponentType<{ variant?: IconVariant }>;

type AppBase = {
  id: string;
  title: string;
  icon: DesktopIconComponent;
  showOnDesktop?: boolean;
  showInStartMenu?: boolean;
  startMenuGroup?: 'games';
  /** Titelleiste und Taskleiste, falls abweichend vom Startmenü. */
  windowTitle?: string;
  windowIcon?: DesktopIconComponent;
};

type WindowApp = AppBase & {
  kind: 'window';
  component: LazyExoticComponent<ComponentType<AppProps>>;
  /** Bei sizing 'content' oder chrome 'skinned' nur Schätzwert fürs Zentrieren. */
  defaultSize?: { width: number; height: number };
  /** Überschreibt defaultSize für einen Look. */
  lookSize?: Partial<Record<Look, { width: number; height: number }>>;
  /** 'content': feste Größe nach Inhalt, nicht skalierbar, Maximieren gesperrt. */
  sizing?: 'content';
  /** 'skinned': Die App zeichnet Titelleiste und Rahmen selbst. */
  chrome?: 'skinned';
};

type LinkApp = AppBase & {
  kind: 'link';
  url: string;
};

export type DesktopApp = WindowApp | LinkApp;

function lazyNamed<K extends string, M extends Record<K, ComponentType<AppProps>>>(loader: () => Promise<M>, name: K) {
  return lazy(() => loader().then((mod) => ({ default: mod[name] })));
}

/**
 * Neue Fenster oder externe Links werden hier ergänzt.
 * Ein Spiel ist ein weiterer kind: 'window' mit lazy()-Import,
 * ein Webprojekt ein kind: 'link'. Beides erscheint auf dem Desktop
 * und im Startmenü, solange showOnDesktop/showInStartMenu nicht false sind.
 */
export const desktopApps: DesktopApp[] = [
  {
    id: 'about',
    title: 'Über mich',
    icon: User,
    kind: 'window',
    component: lazyNamed(() => import('./AboutApp'), 'AboutApp'),
    defaultSize: { width: 560, height: 430 },
  },
  {
    id: 'skills',
    title: 'Skills',
    icon: Notepad,
    kind: 'window',
    component: lazyNamed(() => import('./SkillsApp'), 'SkillsApp'),
    defaultSize: { width: 360, height: 248 },
  },
  {
    id: 'portfolio',
    title: 'Portfolio',
    icon: Folder,
    kind: 'window',
    component: lazyNamed(() => import('./PortfolioApp'), 'PortfolioApp'),
    defaultSize: { width: 480, height: 340 },
  },
  {
    id: 'linkedin',
    title: 'LinkedIn',
    icon: Globe,
    kind: 'link',
    url: profile.linkedinUrl,
  },
  {
    id: 'contact',
    title: 'Kontakt',
    icon: Mail,
    kind: 'window',
    component: lazyNamed(() => import('./ContactApp'), 'ContactApp'),
    defaultSize: { width: 500, height: 440 },
  },
  {
    id: 'icq',
    title: 'ICQ',
    windowTitle: 'WinMP Handy',
    icon: IcqIcon,
    kind: 'window',
    component: lazyNamed(() => import('./IcqApp'), 'IcqApp'),
    defaultSize: { width: 320, height: 560 },
    sizing: 'content',
  },
  {
    id: 'ie',
    title: 'Internet Explorer',
    icon: Ie,
    kind: 'window',
    component: lazyNamed(() => import('./BrowserApp'), 'InternetExplorerApp'),
    defaultSize: { width: 800, height: 560 },
  },
  {
    id: 'netscape',
    title: 'Netscape Navigator',
    windowTitle: 'Version 4.85 [en]-sa85 - Netscape',
    icon: NetscapeIcon,
    windowIcon: NetscapeWindowIcon,
    showOnDesktop: false,
    kind: 'window',
    component: lazyNamed(() => import('./BrowserApp'), 'NetscapeApp'),
    defaultSize: { width: 880, height: 640 },
  },
  {
    id: 'winamp',
    title: 'Winamp',
    icon: WinampIcon,
    kind: 'window',
    component: lazyNamed(() => import('./WinampApp'), 'WinampApp'),
    defaultSize: { width: 413, height: 522 },
    chrome: 'skinned',
  },
  {
    id: 'msdos',
    title: 'MS DOS',
    icon: MsDosIcon,
    kind: 'window',
    component: lazyNamed(() => import('./DosApp'), 'DosApp'),
    defaultSize: { width: 664, height: 520 },
  },
  {
    id: 'saforce',
    title: 'Alien Force',
    icon: SaForceIcon,
    showOnDesktop: false,
    startMenuGroup: 'games',
    kind: 'link',
    url: 'https://saforce.game.sa85.de/',
  },
  {
    id: 'games',
    title: 'Spiele',
    icon: Folder,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./explorer/Explorer'), 'GamesApp'),
    defaultSize: { width: 560, height: 360 },
  },
  {
    id: 'solitaire',
    title: 'Solitär',
    icon: Sol1,
    showOnDesktop: false,
    startMenuGroup: 'games',
    kind: 'window',
    component: lazyNamed(() => import('./solitaire/SolitaireApp'), 'SolitaireApp'),
    defaultSize: { width: 640, height: 500 },
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    icon: Winmine1,
    showOnDesktop: false,
    startMenuGroup: 'games',
    kind: 'window',
    component: lazyNamed(() => import('./minesweeper/MinesweeperApp'), 'MinesweeperApp'),
    defaultSize: { width: 172, height: 258 },
    sizing: 'content',
  },
  {
    id: 'computer',
    title: 'Arbeitsplatz',
    icon: Computer,
    kind: 'window',
    component: lazyNamed(() => import('./explorer/Explorer'), 'MyComputerApp'),
    defaultSize: { width: 620, height: 420 },
  },
  {
    id: 'control',
    title: 'Systemsteuerung',
    icon: Controls3000,
    showOnDesktop: false,
    kind: 'window',
    component: lazyNamed(() => import('./explorer/Explorer'), 'ControlPanelApp'),
    defaultSize: { width: 640, height: 440 },
    lookSize: { '98': { width: 780, height: 540 } },
  },
  {
    id: 'assistant',
    title: 'Office-Assistent',
    icon: AssistantIcon,
    showOnDesktop: false,
    kind: 'window',
    component: lazyNamed(() => import('./AssistantApp'), 'AssistantApp'),
    defaultSize: { width: 472, height: 390 },
  },
  {
    id: 'impressum',
    title: 'Impressum',
    icon: Notepad,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./LegalApp'), 'ImpressumApp'),
    defaultSize: { width: 480, height: 420 },
  },
  {
    id: 'datenschutz',
    title: 'Datenschutz',
    icon: Notepad,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./LegalApp'), 'DatenschutzApp'),
    defaultSize: { width: 520, height: 480 },
  },
  {
    id: 'recycle',
    title: 'Papierkorb',
    icon: RecycleEmpty,
    kind: 'window',
    component: lazyNamed(() => import('./explorer/Explorer'), 'RecycleBinApp'),
    defaultSize: { width: 520, height: 340 },
  },
  {
    id: 'display',
    title: 'Eigenschaften von Anzeige',
    icon: Desk100,
    showOnDesktop: false,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./DisplayApp'), 'DisplayApp'),
    defaultSize: { width: 540, height: 720 },
  },
  {
    id: 'system',
    title: 'Eigenschaften von System',
    icon: Computer,
    showOnDesktop: false,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./SystemApp'), 'SystemApp'),
    defaultSize: { width: 680, height: 560 },
  },
  {
    id: 'datetime',
    title: 'Eigenschaften von Datum/Uhrzeit',
    icon: Timedate,
    showOnDesktop: false,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./DateTimeApp'), 'DateTimeApp'),
    defaultSize: { width: 580, height: 480 },
  },
  {
    id: 'volume',
    title: 'Lautstärkeregelung',
    icon: Unmute,
    showOnDesktop: false,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./VolumeApp'), 'VolumeApp'),
    defaultSize: { width: 300, height: 290 },
  },
  {
    id: 'mouse',
    title: 'Eigenschaften von Maus',
    icon: MouseIcon,
    showOnDesktop: false,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./MouseApp'), 'MouseApp'),
    defaultSize: { width: 460, height: 540 },
  },
  {
    id: 'regional',
    title: 'Eigenschaften von Ländereinstellungen',
    icon: Intl101,
    showOnDesktop: false,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./RegionalApp'), 'RegionalApp'),
    defaultSize: { width: 500, height: 560 },
  },
  {
    id: 'users',
    title: 'Benutzereinstellungen',
    icon: UsersIcon,
    showOnDesktop: false,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./UsersApp'), 'UsersApp'),
    defaultSize: { width: 480, height: 500 },
  },
  {
    id: 'network',
    title: 'Netzwerk',
    icon: Network2,
    showOnDesktop: false,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./NetworkApp'), 'NetworkApp'),
    defaultSize: { width: 540, height: 580 },
  },
  {
    id: 'power',
    title: 'Eigenschaften von Energieverwaltung',
    icon: PowerOn,
    showOnDesktop: false,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./PowerApp'), 'PowerApp'),
    defaultSize: { width: 460, height: 580 },
  },
  {
    id: 'gamepad',
    title: 'Gamecontroller',
    icon: Joy102,
    showOnDesktop: false,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./GameControllerApp'), 'GameControllerApp'),
    defaultSize: { width: 480, height: 560 },
  },
];

export function getApp(id: string) {
  return desktopApps.find((app) => app.id === id);
}
