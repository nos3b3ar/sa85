import { Computer } from '@react95/icons/Computer';
import { Controls3000 } from '@react95/icons/Controls3000';
import { Desk100 } from '@react95/icons/Desk100';
import { Folder } from '@react95/icons/Folder';
import { Intl101 } from '@react95/icons/Intl101';
import { Joy102 } from '@react95/icons/Joy102';
import { Main100 } from '@react95/icons/Main100';
import { Network2 } from '@react95/icons/Network2';
import { PowerOn } from '@react95/icons/PowerOn';
import { ReaderCd } from '@react95/icons/ReaderCd';
import { ReaderClosed } from '@react95/icons/ReaderClosed';
import { ReaderDisket } from '@react95/icons/ReaderDisket';
import { RecycleEmpty } from '@react95/icons/RecycleEmpty';
import { Timedate } from '@react95/icons/Timedate';
import { Unmute } from '@react95/icons/Unmute';
import { Wab321019 } from '@react95/icons/Wab321019';
import type { ComponentType } from 'react';
import { machine } from '../../boot/bootScript';
import { desktopApps, type DesktopIconComponent } from '../registry';

export type FolderId = 'computer' | 'control' | 'games' | 'recycle';

export type FolderItem = {
  id: string;
  label: string;
  icon: ComponentType<{ variant?: '32x32_4' }>;
  /** Text in der Web-Ansicht und in der Statusleiste, wenn das Objekt markiert ist. */
  description: string;
  /** Doppelklick öffnet einen Ordner im selben Fenster oder eine App in einem neuen. */
  open?: { folder: FolderId } | { app: string };
};

export type FolderDef = {
  title: string;
  icon: DesktopIconComponent;
  parent: FolderId | null;
  intro: string;
  status: string;
  items: () => FolderItem[];
};

const pick = 'Markieren Sie ein Objekt, um seine Beschreibung anzuzeigen.';

export const folders: Record<FolderId, FolderDef> = {
  computer: {
    title: 'Arbeitsplatz',
    icon: Computer,
    parent: null,
    intro: `Zeigt die Laufwerke dieses Computers an. ${pick}`,
    status: `${machine.cpuType}, ${machine.totalMemoryK}K RAM`,
    items: () => [
      { id: 'a', label: '3,5-Diskette (A:)', icon: ReaderDisket, description: `3,5"-Diskette (${machine.driveA})` },
      { id: 'c', label: '(C:)', icon: ReaderClosed, description: `Lokaler Datenträger, ${machine.hddModel} (${machine.hddSize})` },
      { id: 'd', label: '(D:)', icon: ReaderCd, description: 'CD-ROM-Laufwerk' },
      { id: 'e', label: '(E:)', icon: ReaderCd, description: 'CD-ROM-Laufwerk' },
      {
        id: 'control',
        label: 'Systemsteuerung',
        icon: Controls3000,
        description: 'Passt die Einstellungen des Computers an.',
        open: { folder: 'control' },
      },
    ],
  },
  control: {
    title: 'Systemsteuerung',
    icon: Controls3000,
    parent: 'computer',
    intro: `Die Einstellungen in der Systemsteuerung ermöglichen die Anpassung des Computers an Ihre persönlichen Vorstellungen. ${pick}`,
    status: 'Arbeitsplatz',
    items: () => [
      {
        id: 'display',
        label: 'Anzeige',
        icon: Desk100,
        description: 'Passt Hintergrund, Bildschirmschoner und Bildschirmeinstellungen an.',
        open: { app: 'display' },
      },
      { id: 'users', label: 'Benutzer', icon: Wab321019, description: 'Richtet den Computer für mehrere Benutzer ein.' },
      {
        id: 'datetime',
        label: 'Datum/Uhrzeit',
        icon: Timedate,
        description: 'Ändert Datum, Uhrzeit und Zeitzone des Computers.',
        open: { app: 'datetime' },
      },
      { id: 'power', label: 'Energieverwaltung', icon: PowerOn, description: 'Konfiguriert die Energiesparfunktionen des Computers.' },
      { id: 'joystick', label: 'Gamecontroller', icon: Joy102, description: 'Fügt Gamecontroller hinzu, entfernt sie oder ändert ihre Einstellungen.' },
      { id: 'regional', label: 'Ländereinstellungen', icon: Intl101, description: 'Ändert die Anzeige von Zahlen, Währungen, Uhrzeit und Datum.' },
      { id: 'mouse', label: 'Maus', icon: Main100, description: 'Passt Doppelklickgeschwindigkeit, Mauszeiger und Bewegung an.' },
      {
        id: 'volume',
        label: 'Multimedia',
        icon: Unmute,
        description: 'Ändert die Einstellungen für Audio und Lautstärke.',
        open: { app: 'volume' },
      },
      { id: 'network', label: 'Netzwerk', icon: Network2, description: 'Konfiguriert Netzwerkhardware und -software.' },
      {
        id: 'system',
        label: 'System',
        icon: Computer,
        description: 'Zeigt Systeminformationen an und ändert die Darstellung von Windows.',
        open: { app: 'system' },
      },
    ],
  },
  games: {
    title: 'Spiele',
    icon: Folder,
    parent: null,
    intro: `Enthält die Spiele dieses Computers. ${pick}`,
    status: 'Desktop',
    items: () => desktopApps
      .filter((app) => app.startMenuGroup === 'games')
      .map((app) => ({ id: app.id, label: app.title, icon: app.icon, description: `Startet ${app.title}.`, open: { app: app.id } })),
  },
  recycle: {
    title: 'Papierkorb',
    icon: RecycleEmpty,
    parent: null,
    intro: 'Enthält Dateien und Ordner, die Sie gelöscht haben. Der Papierkorb ist leer.',
    status: '0 Byte',
    items: () => [],
  },
};

export const addressOrder: FolderId[] = ['computer', 'control', 'games', 'recycle'];
