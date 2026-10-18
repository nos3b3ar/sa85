import { Controls3000 } from '@react95/icons/Controls3000';
import { ReaderCd } from '@react95/icons/ReaderCd';
import { ReaderClosed } from '@react95/icons/ReaderClosed';
import { ReaderDisket } from '@react95/icons/ReaderDisket';
import { useState, type ComponentType } from 'react';
import { machine } from '../boot/bootScript';
import type { AppProps } from './types';

type Entry = {
  id: string;
  label: string;
  detail: string;
  icon: ComponentType<{ variant?: '32x32_4' }>;
  open?: string;
};

const entries: Entry[] = [
  { id: 'a', label: '3,5-Diskette (A:)', detail: `3,5"-Diskette (${machine.driveA})`, icon: ReaderDisket },
  { id: 'c', label: '(C:)', detail: `${machine.hddModel} (${machine.hddSize})`, icon: ReaderClosed },
  { id: 'd', label: '(D:)', detail: 'CD-ROM-Laufwerk', icon: ReaderCd },
  { id: 'e', label: '(E:)', detail: 'CD-ROM-Laufwerk', icon: ReaderCd },
  { id: 'control', label: 'Systemsteuerung', detail: 'Systemsteuerung', icon: Controls3000, open: 'control' },
];

export function MyComputerApp({ openApp }: AppProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const current = entries.find((entry) => entry.id === selected);

  return (
    <div className="explorer">
      <div className="folder-view">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.id}
              type="button"
              className={selected === entry.id ? 'folder-item is-selected' : 'folder-item'}
              onClick={() => setSelected(entry.id)}
              onDoubleClick={() => entry.open && openApp(entry.open)}
            >
              <Icon variant="32x32_4" />
              <span>{entry.label}</span>
            </button>
          );
        })}
      </div>
      <div className="status-bar">
        <span>{current ? current.detail : `${entries.length} Objekt(e)`}</span>
        <span>{machine.cpuType}, {machine.totalMemoryK}K RAM</span>
      </div>
    </div>
  );
}
