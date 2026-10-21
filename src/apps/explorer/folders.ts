import { Computer } from '@react95/icons/Computer';
import { Controls3000 } from '@react95/icons/Controls3000';
import { Desk100 } from '@react95/icons/Desk100';
import { Folder } from '@react95/icons/Folder';
import { Intl101 } from '@react95/icons/Intl101';
import { Joy102 } from '@react95/icons/Joy102';
import { Network2 } from '@react95/icons/Network2';
import { PowerOn } from '@react95/icons/PowerOn';
import { ReaderCd } from '@react95/icons/ReaderCd';
import { ReaderClosed } from '@react95/icons/ReaderClosed';
import { ReaderDisket } from '@react95/icons/ReaderDisket';
import { RecycleEmpty } from '@react95/icons/RecycleEmpty';
import { Timedate } from '@react95/icons/Timedate';
import { Unmute } from '@react95/icons/Unmute';
import { machine } from '../../boot/bootScript';
import { appTitle, type Messages } from '../../i18n';
import { desktopApps, type DesktopIconComponent } from '../registry';
import { MouseIcon, UsersIcon } from '../systemIcons';

export type FolderId = 'computer' | 'control' | 'games' | 'recycle';

export type FolderItem = {
  id: string;
  label: string;
  icon: DesktopIconComponent;
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

export function buildFolders(t: Messages): Record<FolderId, FolderDef> {
  const e = t.explorer;
  const c = e.control;
  return {
    computer: {
      title: t.apps.computer,
      icon: Computer,
      parent: null,
      intro: `${e.computer.intro} ${e.pick}`,
      status: `${machine.cpuType}, ${machine.totalMemoryK}K RAM`,
      items: () => [
        { id: 'a', label: e.computer.floppy, icon: ReaderDisket, description: e.computer.floppyInfo(machine.driveA) },
        { id: 'c', label: '(C:)', icon: ReaderClosed, description: e.computer.localDisk(machine.hddModel, machine.hddSize) },
        { id: 'd', label: '(D:)', icon: ReaderCd, description: e.computer.cdrom },
        { id: 'e', label: '(E:)', icon: ReaderCd, description: e.computer.cdrom },
        {
          id: 'control',
          label: t.apps.control,
          icon: Controls3000,
          description: e.computer.controlInfo,
          open: { folder: 'control' },
        },
      ],
    },
    control: {
      title: t.apps.control,
      icon: Controls3000,
      parent: 'computer',
      intro: `${c.intro} ${e.pick}`,
      status: t.apps.computer,
      items: () => [
        { id: 'display', label: c.display, icon: Desk100, description: c.displayInfo, open: { app: 'display' } },
        { id: 'users', label: c.users, icon: UsersIcon, description: c.usersInfo, open: { app: 'users' } },
        { id: 'datetime', label: c.datetime, icon: Timedate, description: c.datetimeInfo, open: { app: 'datetime' } },
        { id: 'power', label: c.power, icon: PowerOn, description: c.powerInfo, open: { app: 'power' } },
        { id: 'joystick', label: c.gamepad, icon: Joy102, description: c.gamepadInfo, open: { app: 'gamepad' } },
        { id: 'regional', label: c.regional, icon: Intl101, description: c.regionalInfo, open: { app: 'regional' } },
        { id: 'mouse', label: c.mouse, icon: MouseIcon, description: c.mouseInfo, open: { app: 'mouse' } },
        { id: 'volume', label: c.multimedia, icon: Unmute, description: c.multimediaInfo, open: { app: 'volume' } },
        { id: 'network', label: c.network, icon: Network2, description: c.networkInfo, open: { app: 'network' } },
        { id: 'system', label: c.system, icon: Computer, description: c.systemInfo, open: { app: 'system' } },
      ],
    },
    games: {
      title: t.apps.games,
      icon: Folder,
      parent: null,
      intro: `${e.games.intro} ${e.pick}`,
      status: e.games.status,
      items: () => desktopApps
        .filter((app) => app.startMenuGroup === 'games')
        .map((app) => {
          const label = appTitle(t, app);
          return { id: app.id, label, icon: app.icon, description: e.startsApp(label), open: { app: app.id } };
        }),
    },
    recycle: {
      title: t.apps.recycle,
      icon: RecycleEmpty,
      parent: null,
      intro: e.recycle.intro,
      status: '0 Byte',
      items: () => [],
    },
  };
}

export const addressOrder: FolderId[] = ['computer', 'control', 'games', 'recycle'];
