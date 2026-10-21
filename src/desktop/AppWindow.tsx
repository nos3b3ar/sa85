import { Suspense, useCallback, useRef } from 'react';
import { Button, Window, WindowContent, WindowHeader } from 'react95';
import { getApp, type DesktopIconComponent } from '../apps/registry';
import type { WindowChrome } from '../apps/types';
import { useT, windowTitle } from '../i18n';
import { minWindowSize, useWindows, type ManagedWindow, type WindowRect } from './WindowManager';

type AppWindowProps = {
  win: ManagedWindow;
  active: boolean;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  onMove: (x: number, y: number) => void;
};

type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const edges: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

export function AppWindow({ win, active, onClose, onFocus, onMinimize, onMove }: AppWindowProps) {
  const app = getApp(win.appId);
  const { openApp, resize, toggleMaximize, retitle } = useWindows();
  const t = useT();
  const setTitle = useCallback(
    (title: string, icon?: DesktopIconComponent) => retitle(win.id, title, icon),
    [retitle, win.id],
  );
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const sizing = useRef<{ edge: Edge; px: number; py: number; start: WindowRect } | null>(null);
  const closeGuard = useRef<(() => void) | null>(null);
  const setCloseGuard = useCallback((guard: (() => void) | null) => {
    closeGuard.current = guard;
  }, []);
  const requestClose = () => (closeGuard.current ? closeGuard.current() : onClose());

  if (!app || app.kind !== 'window') return null;
  const Icon = win.icon ?? app.windowIcon ?? app.icon;
  const Body = app.component;
  const skinned = app.chrome === 'skinned';
  const fixedSize = skinned || app.sizing === 'content';
  const maximized = win.maximized && !fixedSize;

  const dragHandlers: WindowChrome['dragHandlers'] = {
    onPointerDown: (event) => {
      if ((event.target as HTMLElement).closest('button')) return;
      onFocus();
      if (maximized) return;
      drag.current = { dx: event.clientX - win.x, dy: event.clientY - win.y };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event) => {
      if (!drag.current) return;
      onMove(event.clientX - drag.current.dx, event.clientY - drag.current.dy);
    },
    onPointerUp: () => {
      drag.current = null;
    },
  };

  const startResize = (edge: Edge) => (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onFocus();
    sizing.current = {
      edge,
      px: event.clientX,
      py: event.clientY,
      start: { x: win.x, y: win.y, width: win.width, height: win.height },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onResizeMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = sizing.current;
    if (!current) return;
    const { edge, start } = current;
    const dx = event.clientX - current.px;
    const dy = event.clientY - current.py;
    const next = { ...start };

    if (edge.includes('e')) next.width = Math.max(minWindowSize.width, start.width + dx);
    if (edge.includes('s')) next.height = Math.max(minWindowSize.height, start.height + dy);
    if (edge.includes('w')) {
      next.width = Math.max(minWindowSize.width, start.width - dx);
      next.x = start.x + start.width - next.width;
    }
    if (edge.includes('n')) {
      next.height = Math.max(minWindowSize.height, start.height - dy);
      next.y = start.y + start.height - next.height;
      if (next.y < 0) {
        next.height += next.y;
        next.y = 0;
      }
    }
    resize(win.id, next);
  };

  const body = (
    <Suspense fallback={skinned ? null : <p className="window-loading">{t.common.loading}</p>}>
      <Body
        onClose={onClose}
        openApp={openApp}
        chrome={skinned ? { active, dragHandlers, onMinimize, onClose: requestClose } : undefined}
        setCloseGuard={setCloseGuard}
        setTitle={setTitle}
      />
    </Suspense>
  );

  if (skinned) {
    return (
      <div
        className="skinned-window"
        style={{
          left: win.x,
          top: win.y,
          zIndex: win.z,
          display: win.minimized ? 'none' : 'block',
        }}
        onMouseDown={onFocus}
      >
        {body}
      </div>
    );
  }

  let position: React.CSSProperties = { left: win.x, top: win.y, width: win.width, height: win.height };
  if (maximized) position = { left: 0, top: 0, width: '100%', height: 'calc(100% - var(--taskbar-height))' };
  else if (fixedSize) position = { left: win.x, top: win.y };

  const className = ['app-window', maximized ? 'is-maximized' : '', fixedSize ? 'is-fixed' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <Window
      className={className}
      resizable={!maximized && !fixedSize}
      style={{
        position: 'absolute',
        ...position,
        zIndex: win.z,
        display: win.minimized ? 'none' : 'flex',
      }}
      onMouseDown={onFocus}
    >
      <WindowHeader
        active={active}
        className="app-window-header"
        {...dragHandlers}
        onDoubleClick={(event) => {
          if (fixedSize || (event.target as HTMLElement).closest('button')) return;
          toggleMaximize(win.id);
        }}
      >
        <span className="app-window-title">
          <Icon variant="16x16_4" />
          <span>{windowTitle(t, app, win.title)}</span>
        </span>
        <span className="app-window-controls">
          <Button size="sm" onClick={onMinimize} aria-label={t.shell.minimize} title={t.shell.minimize}>
            <span className="title-min" />
          </Button>
          <Button
            size="sm"
            disabled={fixedSize}
            onClick={() => toggleMaximize(win.id)}
            aria-label={maximized ? t.shell.restore : t.shell.maximize}
            title={maximized ? t.shell.restore : t.shell.maximize}
          >
            <span className={maximized ? 'title-restore' : 'title-max'} />
          </Button>
          <Button size="sm" onClick={requestClose} aria-label={t.shell.close} title={t.shell.close}>
            <span className="title-close" />
          </Button>
        </span>
      </WindowHeader>
      <WindowContent className="app-window-body">{body}</WindowContent>
      {maximized || fixedSize
        ? null
        : edges.map((edge) => (
          <div
            key={edge}
            className={`resize-handle resize-${edge}`}
            onPointerDown={startResize(edge)}
            onPointerMove={onResizeMove}
            onPointerUp={() => {
              sizing.current = null;
            }}
            onPointerCancel={() => {
              sizing.current = null;
            }}
          />
        ))}
    </Window>
  );
}
