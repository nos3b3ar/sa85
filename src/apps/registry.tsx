import { Computer } from '@react95/icons/Computer';
import { Controls3000 } from '@react95/icons/Controls3000';
import { Desk100 } from '@react95/icons/Desk100';
import { Folder } from '@react95/icons/Folder';
import { Globe } from '@react95/icons/Globe';
import { Ie } from '@react95/icons/Ie';
import { Mail } from '@react95/icons/Mail';
import { Notepad } from '@react95/icons/Notepad';
import { RecycleEmpty } from '@react95/icons/RecycleEmpty';
import { Sol1 } from '@react95/icons/Sol1';
import { Winmine1 } from '@react95/icons/Winmine1';
import { Timedate } from '@react95/icons/Timedate';
import { Unmute } from '@react95/icons/Unmute';
import { User } from '@react95/icons/User';
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { profile } from '../content/profile';
import { NetscapeIcon } from './NetscapeIcon';
import { WinampIcon } from './WinampIcon';
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
};

type WindowApp = AppBase & {
  kind: 'window';
  component: LazyExoticComponent<ComponentType<AppProps>>;
  /** Bei sizing 'content' oder chrome 'skinned' nur Schätzwert fürs Zentrieren. */
  defaultSize?: { width: number; height: number };
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

function lazyNamed(loader: () => Promise<Record<string, ComponentType<AppProps>>>, name: string) {
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
    icon: NetscapeIcon,
    showOnDesktop: false,
    kind: 'window',
    component: lazyNamed(() => import('./BrowserApp'), 'NetscapeApp'),
    defaultSize: { width: 800, height: 560 },
  },
  {
    id: 'winamp',
    title: 'Winamp',
    icon: WinampIcon,
    showOnDesktop: false,
    kind: 'window',
    component: lazyNamed(() => import('./WinampApp'), 'WinampApp'),
    defaultSize: { width: 413, height: 522 },
    chrome: 'skinned',
  },
  {
    id: 'solitaire',
    title: 'Solitär',
    icon: Sol1,
    startMenuGroup: 'games',
    kind: 'window',
    component: lazyNamed(() => import('./solitaire/SolitaireApp'), 'SolitaireApp'),
    defaultSize: { width: 640, height: 500 },
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    icon: Winmine1,
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
    component: lazyNamed(() => import('./MyComputerApp'), 'MyComputerApp'),
    defaultSize: { width: 440, height: 360 },
  },
  {
    id: 'control',
    title: 'Systemsteuerung',
    icon: Controls3000,
    showOnDesktop: false,
    kind: 'window',
    component: lazyNamed(() => import('./ControlPanelApp'), 'ControlPanelApp'),
    defaultSize: { width: 420, height: 240 },
  },
  {
    id: 'recycle',
    title: 'Papierkorb',
    icon: RecycleEmpty,
    kind: 'window',
    component: lazyNamed(() => import('./RecycleBinApp'), 'RecycleBinApp'),
    defaultSize: { width: 340, height: 180 },
  },
  {
    id: 'display',
    title: 'Eigenschaften von Anzeige',
    icon: Desk100,
    showOnDesktop: false,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./DisplayApp'), 'DisplayApp'),
    defaultSize: { width: 420, height: 640 },
  },
  {
    id: 'system',
    title: 'Eigenschaften von System',
    icon: Computer,
    showOnDesktop: false,
    showInStartMenu: false,
    kind: 'window',
    component: lazyNamed(() => import('./SystemApp'), 'SystemApp'),
    defaultSize: { width: 520, height: 470 },
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
];

export function getApp(id: string) {
  return desktopApps.find((app) => app.id === id);
}
