import { useEffect, useRef, useState } from 'react';
import { MenuList, MenuListItem } from 'react95';
import { ScreensaverHost } from '../screensaver/ScreensaverHost';
import { getSettings, updateSettings, useSettings } from '../settings/settings';
import { desktopApps } from '../apps/registry';
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
  const openedWizard = useRef(false);
  const settings = useSettings();
  const [selected, setSelected] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [dst, setDst] = useState<DstNotice | null>(() => shouldShowDstDialog());
  const [shutdownOpen, setShutdownOpen] = useState(false);
  const [standby, setStandby] = useState(false);
  const [, setViewport] = useState(0);

  useEffect(() => {
    const onResize = () => setViewport((tick) => tick + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (openedInitial.current || !initialApp) return;
    openedInitial.current = true;
    openApp(initialApp);
    onInitialAppOpened?.();
  }, [initialApp, onInitialAppOpened, openApp]);

  // Einrichtungs-Wizard des Office-Assistenten beim ersten Besuch öffnen
  useEffect(() => {
    if (openedWizard.current || initialApp || settings.assistantSetupDone) return;
    openedWizard.current = true;
    openApp('assistant');
  }, [initialApp, openApp, settings.assistantSetupDone]);

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

  return (
    <div
      className="desktop"
      style={{ backgroundColor: settings.desktopColor }}
      onMouseDown={clearIfEmpty}
      onContextMenu={(event) => {
        if (!onBackground(event.target)) return;
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY });
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
            Desktop anzeigen
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
            Eigenschaften
          </MenuListItem>
        </MenuList>
      ) : null}
      <ScreensaverHost />
    </div>
  );
}
