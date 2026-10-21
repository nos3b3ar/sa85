import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Select } from 'react95';
import { useSettings } from '../../settings/settings';
import type { AppProps } from '../types';
import { addressOrder, folders, type FolderId, type FolderItem } from './folders';

type History = { stack: FolderId[]; index: number };

const addressOptions = addressOrder.map((id) => ({ value: id, label: folders[id].title }));

function ToolButton({ label, disabled, onClick, children }: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className="tool-button" disabled={disabled} onClick={onClick}>
      <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden>
        {children}
      </svg>
      <span>{label}</span>
    </button>
  );
}

export function Explorer({ start, openApp, setTitle }: AppProps & { start: FolderId }) {
  const { look } = useSettings();
  const [history, setHistory] = useState<History>({ stack: [start], index: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const current = history.stack[history.index];
  const folder = folders[current];
  const items = useMemo(() => folder.items(), [folder]);
  const selectedItem = items.find((item) => item.id === selected);
  const FolderIcon = folder.icon;
  const rich = look === '98';

  useEffect(() => {
    setTitle?.(folder.title, folder.icon);
  }, [folder, setTitle]);

  const navigate = (id: FolderId) => {
    if (id === current) return;
    setSelected(null);
    setHistory(({ stack, index }) => ({ stack: [...stack.slice(0, index + 1), id], index: index + 1 }));
  };

  const step = (delta: number) => {
    setSelected(null);
    setHistory((prev) => ({ ...prev, index: prev.index + delta }));
  };

  const activate = (item: FolderItem) => {
    if (!item.open) return;
    if ('folder' in item.open) navigate(item.open.folder);
    else openApp(item.open.app);
  };

  return (
    <div className="explorer">
      {rich && (
        <div className="explorer-bars">
          <div className="explorer-toolbar">
            <span className="toolbar-grip" aria-hidden />
            <ToolButton label="Zurück" disabled={history.index === 0} onClick={() => step(-1)}>
              <path d="M2 10 9 3v4h9v6H9v4z" />
            </ToolButton>
            <ToolButton label="Vorwärts" disabled={history.index === history.stack.length - 1} onClick={() => step(1)}>
              <path d="M18 10 11 3v4H2v6h9v4z" />
            </ToolButton>
            <ToolButton
              label="Aufwärts"
              disabled={!folder.parent}
              onClick={() => folder.parent && navigate(folder.parent)}
            >
              <path className="tool-folder" d="M1 7h6l2 2h9v9H1z" />
              <path d="M12 1 7 6h3v6h4V6h3z" />
            </ToolButton>
          </div>
          <div className="explorer-address">
            <span className="toolbar-grip" aria-hidden />
            <span className="explorer-address-label">Adresse</span>
            <span className="explorer-address-icon" aria-hidden>
              <FolderIcon variant="16x16_4" />
            </span>
            <Select
              className="explorer-address-select"
              options={addressOptions}
              value={current}
              onChange={(option) => navigate(option.value)}
            />
          </div>
        </div>
      )}
      <div className="explorer-body">
        {rich && (
          <aside className="web-pane">
            <FolderIcon variant="32x32_4" />
            <h2>{folder.title}</h2>
            <hr />
            {selectedItem ? (
              <>
                <strong>{selectedItem.label}</strong>
                <p>{selectedItem.description}</p>
              </>
            ) : (
              <p>{folder.intro}</p>
            )}
          </aside>
        )}
        <div className="folder-view" onClick={(event) => event.target === event.currentTarget && setSelected(null)}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={selected === item.id ? 'folder-item is-selected' : 'folder-item'}
                onClick={() => setSelected(item.id)}
                onDoubleClick={() => activate(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') activate(item);
                }}
              >
                <Icon variant="32x32_4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="status-bar">
        <span>{selectedItem ? selectedItem.description : `${items.length} Objekt(e)`}</span>
        <span>{folder.status}</span>
      </div>
    </div>
  );
}

export const MyComputerApp = (props: AppProps) => <Explorer start="computer" {...props} />;
export const ControlPanelApp = (props: AppProps) => <Explorer start="control" {...props} />;
export const GamesApp = (props: AppProps) => <Explorer start="games" {...props} />;
export const RecycleBinApp = (props: AppProps) => <Explorer start="recycle" {...props} />;
