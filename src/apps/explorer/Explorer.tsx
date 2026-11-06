import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MenuList, MenuListItem, Select } from 'react95';
import { snapIconPosition, type IconPoint } from '../../desktop/iconLayout';
import { arrowDirections, nextIcon } from '../../desktop/iconNav';
import { restoreApp } from '../../desktop/recycleBin';
import { useDoubleActivate } from '../../desktop/useDoubleActivate';
import { useT } from '../../i18n';
import { useSettings } from '../../settings/settings';
import type { AppProps } from '../types';
import { addressOrder, buildFolders, type FolderId, type FolderItem } from './folders';

type History = { stack: FolderId[]; index: number };

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
  const { look, recycled } = useSettings();
  const t = useT();
  const folders = useMemo(() => buildFolders(t), [t]);
  const addressOptions = useMemo(
    () => addressOrder.map((id) => ({ value: id, label: folders[id].title })),
    [folders],
  );
  const [history, setHistory] = useState<History>({ stack: [start], index: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const current = history.stack[history.index];
  const folder = folders[current];
  const items = useMemo(() => folder.items(recycled), [folder, recycled]);
  const selectedItem = items.find((item) => item.id === selected);
  const FolderIcon = folder.icon;
  const rich = look === '98';

  useEffect(() => {
    setTitle?.(folder.title, folder.icon);
  }, [folder, setTitle]);

  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => {
      if (!(event.target as HTMLElement).closest('.context-menu')) setMenu(null);
    };
    document.addEventListener('pointerdown', close, true);
    return () => document.removeEventListener('pointerdown', close, true);
  }, [menu]);

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

  const restore = (id: string, position?: IconPoint) => {
    setMenu(null);
    setSelected(null);
    restoreApp(id, position);
  };

  const onViewKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const direction = arrowDirections[event.key];
    if (!direction || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const nodes = [...event.currentTarget.querySelectorAll<HTMLElement>('.folder-item[data-item-id]')];
    const placed = nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { id: node.dataset.itemId!, x: rect.left, y: rect.top };
    });
    const next = nextIcon(placed, selected, direction);
    if (!next) return;
    setSelected(next);
    nodes.find((node) => node.dataset.itemId === next)?.focus({ preventScroll: false });
  };

  return (
    <div className="explorer">
      {rich && (
        <div className="explorer-bars">
          <div className="explorer-toolbar">
            <span className="toolbar-grip" aria-hidden />
            <ToolButton label={t.explorer.back} disabled={history.index === 0} onClick={() => step(-1)}>
              <path d="M2 10 9 3v4h9v6H9v4z" />
            </ToolButton>
            <ToolButton label={t.explorer.forward} disabled={history.index === history.stack.length - 1} onClick={() => step(1)}>
              <path d="M18 10 11 3v4H2v6h9v4z" />
            </ToolButton>
            <ToolButton
              label={t.explorer.up}
              disabled={!folder.parent}
              onClick={() => folder.parent && navigate(folder.parent)}
            >
              <path className="tool-folder" d="M1 7h6l2 2h9v9H1z" />
              <path d="M12 1 7 6h3v6h4V6h3z" />
            </ToolButton>
          </div>
          <div className="explorer-address">
            <span className="toolbar-grip" aria-hidden />
            <span className="explorer-address-label">{t.explorer.address}</span>
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
                {folder.restorable ? (
                  <button type="button" className="web-pane-link" onClick={() => restore(selectedItem.id)}>
                    {t.explorer.recycle.restore}
                  </button>
                ) : null}
              </>
            ) : (
              <p>{items.length > 0 && folder.introFilled ? folder.introFilled : folder.intro}</p>
            )}
          </aside>
        )}
        <div
          className="folder-view"
          onClick={(event) => event.target === event.currentTarget && setSelected(null)}
          onKeyDown={onViewKey}
        >
          {items.map((item) => (
            <FolderItemButton
              key={item.id}
              item={item}
              selected={selected === item.id}
              onSelect={() => setSelected(item.id)}
              onActivate={() => activate(item)}
              onMenu={folder.restorable ? (x, y) => {
                setSelected(item.id);
                setMenu({ id: item.id, x, y });
              } : undefined}
              onDragOut={folder.restorable ? (position) => restore(item.id, position) : undefined}
            />
          ))}
        </div>
      </div>
      <div className="status-bar">
        <span>{selectedItem ? selectedItem.description : t.explorer.objects(items.length)}</span>
        <span>{folder.status}</span>
      </div>
      {menu ? createPortal(
        <MenuList className="context-menu" style={{ left: menu.x, top: menu.y }}>
          <MenuListItem size="sm" onClick={() => restore(menu.id)}>
            <b>{t.explorer.recycle.restore}</b>
          </MenuListItem>
        </MenuList>,
        document.body,
      ) : null}
    </div>
  );
}

const mouseDragThreshold = 4;
const coarseDragThreshold = 16;

type Drag = { startX: number; startY: number; dx: number; dy: number; moved: boolean; pointerType: string };

function FolderItemButton({ item, selected, onSelect, onActivate, onMenu, onDragOut }: {
  item: FolderItem;
  selected: boolean;
  onSelect: () => void;
  onActivate: () => void;
  onMenu?: (x: number, y: number) => void;
  /** Loslassen über freiem Desktop, Position schon im Symbolraster. */
  onDragOut?: (position: IconPoint) => void;
}) {
  const Icon = item.icon;
  const double = useDoubleActivate(onActivate);
  const drag = useRef<Drag | null>(null);
  const [ghost, setGhost] = useState<IconPoint | null>(null);

  const finishDrag = (x: number, y: number) => {
    const current = drag.current;
    drag.current = null;
    setGhost(null);
    if (!current?.moved) return false;
    const target = document.elementFromPoint(x, y);
    const overDesktop = target?.closest('.desktop') && !target.closest('.app-window, .taskbar, [data-start-root], .context-menu');
    if (overDesktop) onDragOut?.(snapIconPosition({ x: x - current.dx, y: y - current.dy }));
    return true;
  };

  return (
    <>
      <button
        type="button"
        data-item-id={item.id}
        className={selected ? 'folder-item is-selected' : 'folder-item'}
        style={onDragOut ? { touchAction: 'none' } : undefined}
        onPointerDown={(event) => {
          if (!double.isPrimary(event)) return;
          onSelect();
          if (!onDragOut) return;
          const rect = event.currentTarget.getBoundingClientRect();
          drag.current = {
            startX: event.clientX,
            startY: event.clientY,
            dx: event.clientX - rect.left,
            dy: event.clientY - rect.top,
            moved: false,
            pointerType: event.pointerType,
          };
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // Ohne aktiven Pointer bleibt das Ziehen auf dem Symbol.
          }
        }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current) return;
          const threshold = current.pointerType === 'mouse' ? mouseDragThreshold : coarseDragThreshold;
          if (!current.moved && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < threshold) return;
          current.moved = true;
          setGhost({ x: event.clientX - current.dx, y: event.clientY - current.dy });
        }}
        onPointerUp={(event) => {
          if (finishDrag(event.clientX, event.clientY)) double.reset();
          else double.onPointerUp(event);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setGhost(null);
          double.reset();
        }}
        onContextMenu={(event) => {
          double.onContextMenu(event);
          if (!onMenu) return;
          event.preventDefault();
          onMenu(event.clientX, event.clientY);
        }}
        onClick={(event) => {
          if (event.detail === 0) onSelect();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onActivate();
        }}
      >
        <Icon variant="32x32_4" />
        <span>{item.label}</span>
      </button>
      {ghost ? createPortal(
        <div className="icon-drag-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden>
          <Icon variant="32x32_4" />
          <span>{item.label}</span>
        </div>,
        document.body,
      ) : null}
    </>
  );
}

export const MyComputerApp = (props: AppProps) => <Explorer start="computer" {...props} />;
export const ControlPanelApp = (props: AppProps) => <Explorer start="control" {...props} />;
export const GamesApp = (props: AppProps) => <Explorer start="games" {...props} />;
export const RecycleBinApp = (props: AppProps) => <Explorer start="recycle" {...props} />;
