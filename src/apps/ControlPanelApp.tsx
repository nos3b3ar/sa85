import { Computer } from '@react95/icons/Computer';
import { Desk100 } from '@react95/icons/Desk100';
import { Timedate } from '@react95/icons/Timedate';
import { Unmute } from '@react95/icons/Unmute';
import { useState, type ComponentType } from 'react';
import type { AppProps } from './types';

const entries: Array<{ id: string; label: string; icon: ComponentType<{ variant?: '32x32_4' }> }> = [
  { id: 'display', label: 'Anzeige', icon: Desk100 },
  { id: 'system', label: 'System', icon: Computer },
  { id: 'datetime', label: 'Datum/Uhrzeit', icon: Timedate },
  { id: 'volume', label: 'Multimedia', icon: Unmute },
];

export function ControlPanelApp({ openApp }: AppProps) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="explorer">
      <div className="folder-view">
        {entries.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={selected === id ? 'folder-item is-selected' : 'folder-item'}
            onClick={() => setSelected(id)}
            onDoubleClick={() => openApp(id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') openApp(id);
            }}
          >
            <Icon variant="32x32_4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="status-bar">
        <span>{entries.length} Objekt(e)</span>
        <span>Arbeitsplatz</span>
      </div>
    </div>
  );
}
