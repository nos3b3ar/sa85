import { useEffect, useRef, useState } from 'react';
import { MenuList, MenuListItem } from 'react95';
import { ScreensaverHost } from '../screensaver/ScreensaverHost';
import { getSettings, updateSettings, useSettings } from '../settings/settings';
import { desktopApps } from '../apps/registry';
import { useT } from '../i18n';
import { defaultIconPosition } from './iconLayout';
import { shouldShowDstDialog, type DstNotice } from '../utils/dst';
import { AppWindow } from './AppWindow';
import { DesktopAssistant } from './DesktopAssistant';
import { DesktopIcon } from './DesktopIcon';
import { DstDialog } from './DstDialog';
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
  const settings = useSettings();
  const [selected, setSelected] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [dst, setDst] = useState<DstNotice | null>(() => shouldShowDstDialog());
  const [shutdownOpen, setShutdownOpen] = useState(false);
  const [standby, setStandby] = useState(false);
  const [, setViewport] = useState(0);
  const t = useT();
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
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if (typing || shutdownOpen || event.key !== 'Enter' || !selected) return;
      openApp(selected);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openApp, selected, shutdownOpen]);

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

  const onBackground = (target: EventTarget) =>
    !(target as HTMLElement).closest(
      '.desktop-icon, .app-window, [data-start-root], .taskbar, .dst-window, .shutdown-window, .context-menu, .desktop-assistant',
    );

  const clearIfEmpty = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!(event.target as HTMLElement).closest('.context-menu')) setContextMenu(null);
    if (!onBackground(event.target)) return;
    setSelected(null);
    setMenuOpen(false);
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
      {desktopApps.filter((app) => app.showOnDesktop !== false).map((app) => (
        <DesktopIcon
          key={app.id}
          app={app}
          position={settings.iconPositions[app.id] ?? defaultIconPosition(app.id)}
          selected={selected === app.id}
          onSelect={() => setSelected(app.id)}
          onOpen={() => {
            setMenuOpen(false);
            openApp(app.id);
          }}
          onMove={(position) => {
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
        paused={standby || shutdownOpen}
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
