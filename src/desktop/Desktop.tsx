import { useEffect, useRef, useState } from 'react';
import { MenuList, MenuListItem } from 'react95';
import { ScreensaverHost } from '../screensaver/ScreensaverHost';
import { getSettings, updateSettings, useSettings } from '../settings/settings';
import { desktopApps, getApp } from '../apps/registry';
import { useT, windowTitle } from '../i18n';
import { defaultIconPosition } from './iconLayout';
import { arrowDirections, nextIcon } from './iconNav';
import { canRecycle, recycleApp, recycleBinId } from './recycleBin';
import { shouldShowDstDialog, type DstNotice } from '../utils/dst';
import { AppWindow } from './AppWindow';
import { DesktopAssistant } from './DesktopAssistant';
import { DesktopIcon } from './DesktopIcon';
import { DstDialog } from './DstDialog';
import { CloseProgramDialog } from './CloseProgramDialog';
import { ShutdownDialog, type ShutdownChoice } from './ShutdownDialog';
import { Standby } from './Standby';
import { StartMenu } from './StartMenu';
import { Taskbar } from './Taskbar';
import { useWindows, WindowManagerProvider } from './WindowManager';

type DesktopProps = {
  initialApp?: string | null;
  onInitialAppOpened?: () => void;
  onShutdown: (choice: Exclude<ShutdownChoice, 'standby'>) => void;
};

export function Desktop(props: DesktopProps) {
  return (
    <WindowManagerProvider>
      <DesktopView {...props} />
    </WindowManagerProvider>
  );
}

function DesktopView({ initialApp, onInitialAppOpened, onShutdown }: DesktopProps) {
  const { windows, openApp, close, focus, minimize, move, toggleTask, toggleDesktop } = useWindows();
  const openedInitial = useRef(false);
  const bgPressRef = useRef<{ x: number; y: number; timer: number } | null>(null);
  /** Pfeiltasten und Enter gehören dem Desktop, bis ein Fenster, Menü oder die Taskleiste angeklickt wird. */
  const desktopFocused = useRef(true);
  const settings = useSettings();
  const [selected, setSelected] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [dst, setDst] = useState<DstNotice | null>(() => shouldShowDstDialog());
  const [shutdownOpen, setShutdownOpen] = useState(false);
  const [closeProgramOpen, setCloseProgramOpen] = useState(false);
  const [standby, setStandby] = useState(false);
  const [, setViewport] = useState(0);
  const [overBin, setOverBin] = useState(false);
  const t = useT();
  const visibleApps = desktopApps.filter((app) => app.showOnDesktop !== false && !settings.recycled.includes(app.id));
  const iconPosition = (id: string) => settings.iconPositions[id] ?? defaultIconPosition(id);
  const binPosition = iconPosition(recycleBinId);
  const onBin = (cell: { x: number; y: number }) => cell.x === binPosition.x && cell.y === binPosition.y;
  const monitorMinutes = settings.powerTimeouts[settings.powerScheme].monitor;
  const leftHanded = settings.mouse.leftHanded;

  useEffect(() => {
    const onResize = () => setViewport((tick) => tick + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (monitorMinutes <= 0 || standby) return;
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setStandby(true), monitorMinutes * 60_000);
    };
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((name) => window.addEventListener(name, arm, { capture: true, passive: true }));
    arm();
    return () => {
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, arm, { capture: true }));
    };
  }, [monitorMinutes, standby]);

  useEffect(() => {
    if (openedInitial.current || !initialApp) return;
    openedInitial.current = true;
    openApp(initialApp);
    onInitialAppOpened?.();
  }, [initialApp, onInitialAppOpened, openApp]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (shutdownOpen || closeProgramOpen || menuOpen || standby) return;
      const target = event.target as HTMLElement | null;
      const onDesktop = !target || target === document.body || target.closest('.desktop-icon') || target.classList.contains('desktop');
      const windowOpen = windows.some((win) => !win.minimized);
      if (!onDesktop || (windowOpen && !desktopFocused.current)) return;
      const deleting = event.key === 'Delete' || (event.key === 'Backspace' && event.metaKey);
      if (deleting && selected && canRecycle(selected)) {
        event.preventDefault();
        recycleApp(selected);
        setSelected(null);
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Enter') {
        if (!selected) return;
        event.preventDefault();
        setMenuOpen(false);
        target?.blur();
        desktopFocused.current = false;
        openApp(selected);
        return;
      }
      const direction = arrowDirections[event.key];
      if (!direction) return;
      event.preventDefault();
      const icons = visibleApps.map((app) => ({ id: app.id, ...iconPosition(app.id) }));
      const next = nextIcon(icons, selected, direction);
      if (!next) return;
      setSelected(next);
      document.querySelector<HTMLElement>(`.desktop-icon[data-app-id="${next}"]`)?.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openApp, selected, shutdownOpen, closeProgramOpen, menuOpen, standby, windows, visibleApps, iconPosition]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.altKey || event.metaKey || event.shiftKey) return;
      if (event.key !== 'Delete' && event.key !== 'Backspace' && event.code !== 'Delete') return;
      event.preventDefault();
      if (closeProgramOpen) {
        onShutdown('restart');
        return;
      }
      setMenuOpen(false);
      setContextMenu(null);
      setShutdownOpen(false);
      setCloseProgramOpen(true);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [closeProgramOpen, onShutdown]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-start-root]')) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen]);

  const activeId = windows
    .filter((win) => !win.minimized)
    .reduce<string | null>((top, win) => {
      if (!top) return win.id;
      const current = windows.find((item) => item.id === top);
      return !current || win.z > current.z ? win.id : top;
    }, null);

  const activeWin = windows.find((win) => win.id === activeId);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      // Ohne fn meldet die Mac-Taste F4 je nach Browser ein Launch-/Spotlight-Kürzel statt F4; ⌥W als Ausweichkürzel.
      const f4 = event.key === 'F4' || event.code === 'F4' || /launch|spotlight/i.test(`${event.key} ${event.code}`);
      if (!f4 && event.code !== 'KeyW') return;
      if (standby) return;
      event.preventDefault();
      event.stopPropagation();
      if (closeProgramOpen) setCloseProgramOpen(false);
      else if (shutdownOpen) setShutdownOpen(false);
      else if (menuOpen) setMenuOpen(false);
      else if (activeId) close(activeId);
      else {
        setContextMenu(null);
        setShutdownOpen(true);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [activeId, close, closeProgramOpen, shutdownOpen, menuOpen, standby]);

  const onBackground = (target: EventTarget) =>
    !(target as HTMLElement).closest(
      '.desktop-icon, .app-window, [data-start-root], .taskbar, .dst-window, .shutdown-window, .context-menu, .desktop-assistant',
    );

  const clearIfEmpty = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!(event.target as HTMLElement).closest('.context-menu')) setContextMenu(null);
    if (!onBackground(event.target)) return;
    setSelected(null);
    setMenuOpen(false);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const clearBgPress = () => {
    if (bgPressRef.current) {
      window.clearTimeout(bgPressRef.current.timer);
      bgPressRef.current = null;
    }
  };

  return (
    <div
      className="desktop"
      style={{ backgroundColor: settings.desktopColor }}
      onMouseDown={clearIfEmpty}
      onPointerDownCapture={(event) => {
        const onIcon = Boolean((event.target as HTMLElement).closest('.desktop-icon'));
        desktopFocused.current = onIcon || onBackground(event.target);
        const focused = document.activeElement;
        if (!onIcon && focused instanceof HTMLElement && focused.closest('.desktop-icon')) focused.blur();
      }}
      onMouseUp={(event) => {
        if (!leftHanded || event.button !== 0 || !onBackground(event.target)) return;
        setContextMenu({ x: event.clientX, y: event.clientY });
      }}
      onPointerDown={(event) => {
        if (!(event.target as HTMLElement).closest('.context-menu')) setContextMenu(null);
        if (!onBackground(event.target)) return;
        setSelected(null);
        setMenuOpen(false);
        if (event.pointerType === 'mouse') return;
        clearBgPress();
        const x = event.clientX;
        const y = event.clientY;
        const timer = window.setTimeout(() => {
          bgPressRef.current = null;
          setContextMenu({
            x: Math.max(8, Math.min(x, window.innerWidth - 180)),
            y: Math.max(8, Math.min(y, window.innerHeight - 140)),
          });
        }, 460);
        bgPressRef.current = { x, y, timer };
      }}
      onPointerMove={(event) => {
        const press = bgPressRef.current;
        if (!press) return;
        if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) {
          clearBgPress();
          return;
        }
        if (event.pointerType !== 'mouse' && event.pressure >= 0.65 && event.pressure < 1) {
          clearBgPress();
          setContextMenu({
            x: Math.max(8, Math.min(event.clientX, window.innerWidth - 180)),
            y: Math.max(8, Math.min(event.clientY, window.innerHeight - 140)),
          });
        }
      }}
      onPointerUp={clearBgPress}
      onPointerCancel={clearBgPress}
      onContextMenu={(event) => {
        if (!onBackground(event.target)) return;
        event.preventDefault();
        if (!leftHanded) setContextMenu({ x: event.clientX, y: event.clientY });
      }}
    >
      {visibleApps.map((app) => (
        <DesktopIcon
          key={app.id}
          app={app}
          position={iconPosition(app.id)}
          selected={selected === app.id}
          dropTarget={app.id === recycleBinId && overBin}
          onDragCell={canRecycle(app.id) ? (cell) => setOverBin(Boolean(cell && onBin(cell))) : undefined}
          onSelect={() => setSelected(app.id)}
          onOpen={() => {
            setMenuOpen(false);
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
            desktopFocused.current = false;
            openApp(app.id);
          }}
          onMove={(position) => {
            if (canRecycle(app.id) && onBin(position)) {
              recycleApp(app.id);
              setSelected(null);
              return;
            }
            updateSettings({
              iconPositions: { ...getSettings().iconPositions, [app.id]: position },
            });
          }}
        />
      ))}
      {windows.map((win) => (
        <AppWindow
          key={win.id}
          win={win}
          active={win.id === activeId}
          onClose={() => close(win.id)}
          onFocus={() => focus(win.id)}
          onMinimize={() => minimize(win.id)}
          onMove={(x, y) => move(win.id, x, y)}
        />
      ))}
      <DesktopAssistant
        openApp={openApp}
        activeAppId={activeWin?.appId ?? null}
        paused={standby || shutdownOpen || closeProgramOpen}
      />
      <Taskbar
        windows={windows}
        activeId={activeId}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onToggleTask={toggleTask}
        onShowDesktop={toggleDesktop}
        onOpenApp={openApp}
        menu={(
          <StartMenu
            onOpen={(appId) => {
              setMenuOpen(false);
              openApp(appId);
            }}
            onShutdown={() => {
              setMenuOpen(false);
              setShutdownOpen(true);
            }}
          />
        )}
      />
      {dst ? <DstDialog notice={dst} onClose={() => setDst(null)} /> : null}
      {closeProgramOpen ? (
        <CloseProgramDialog
          tasks={[
            { id: 'explorer', title: t.closeProgram.explorer },
            ...windows.map((win) => ({
              id: win.id,
              title: windowTitle(t, getApp(win.appId), win.title),
            })),
          ]}
          initialId={activeId ?? 'explorer'}
          onEndTask={(id) => {
            if (id === 'explorer') {
              windows.forEach((win) => close(win.id));
              return;
            }
            close(id);
          }}
          onShutdown={() => {
            setCloseProgramOpen(false);
            setShutdownOpen(true);
          }}
          onCancel={() => setCloseProgramOpen(false)}
        />
      ) : null}
      {shutdownOpen ? (
        <ShutdownDialog
          onChoose={(choice) => {
            setShutdownOpen(false);
            if (choice === 'standby') setStandby(true);
            else onShutdown(choice);
          }}
          onCancel={() => setShutdownOpen(false)}
        />
      ) : null}
      {standby ? <Standby onWake={() => setStandby(false)} /> : null}
      {contextMenu ? (
        <MenuList className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <MenuListItem
            size="sm"
            onClick={() => {
              setContextMenu(null);
              toggleDesktop();
            }}
          >
            {t.shell.showDesktop}
          </MenuListItem>
          <MenuListItem
            size="sm"
            onClick={() => {
              setContextMenu(null);
              openApp('assistant');
            }}
          >
            Office-Assistent...
          </MenuListItem>
          <MenuListItem
            size="sm"
            onClick={() => {
              setContextMenu(null);
              openApp('display');
            }}
          >
            {t.shell.properties}
          </MenuListItem>
        </MenuList>
      ) : null}
      <ScreensaverHost />
    </div>
  );
}
