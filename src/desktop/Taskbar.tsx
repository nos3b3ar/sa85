import { Desktop as DesktopGlyph } from '@react95/icons/Desktop';
import { Ie } from '@react95/icons/Ie';
import { Rnaui101 } from '@react95/icons/Rnaui101';
import { Mailnews2 } from '@react95/icons/Mailnews2';
import { Mute } from '@react95/icons/Mute';
import { Unmute } from '@react95/icons/Unmute';
import { useEffect, useRef, useState } from 'react';
import { AppBar, Button, Frame, MenuList, MenuListItem, Toolbar, Window, WindowContent } from 'react95';
import { getApp } from '../apps/registry';
import { NetscapeIcon } from '../apps/NetscapeIcon';
import { WinampIcon } from '../apps/WinampIcon';
import { VolumeControl } from '../apps/VolumeControl';
import { disconnect, useOnline } from '../apps/browser/connection';
import { useSettings } from '../settings/settings';
import type { ManagedWindow } from './WindowManager';
import { WindowsLogo } from './WindowsLogo';

type TaskbarProps = {
  windows: ManagedWindow[];
  activeId: string | null;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onToggleTask: (id: string) => void;
  onShowDesktop: () => void;
  onOpenApp: (appId: string) => void;
  menu: React.ReactNode;
};

export function Taskbar({
  windows,
  activeId,
  menuOpen,
  onToggleMenu,
  onToggleTask,
  onShowDesktop,
  onOpenApp,
  menu,
}: TaskbarProps) {
  const now = useClock();
  const settings = useSettings();
  const online = useOnline();
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [linkMenu, setLinkMenu] = useState(false);
  const trayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!volumeOpen && !linkMenu) return;
    const close = (event: MouseEvent) => {
      if (!trayRef.current?.contains(event.target as Node)) {
        setVolumeOpen(false);
        setLinkMenu(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [volumeOpen, linkMenu]);

  const silent = settings.muted || settings.volume === 0;
  const SpeakerIcon = silent ? Mute : Unmute;

  return (
    <AppBar className="taskbar">
      <Toolbar className="taskbar-row">
        <div className="start-root" data-start-root>
          <Button active={menuOpen} onClick={onToggleMenu}>
            <span className="start-button-label">
              <WindowsLogo />
              Start
            </span>
          </Button>
          {menuOpen ? menu : null}
        </div>
        <div className="quick-launch">
          <QuickButton title="Desktop anzeigen" onClick={onShowDesktop}>
            <DesktopGlyph variant="16x16_4" />
          </QuickButton>
          <QuickButton title="Internet Explorer starten" onClick={() => onOpenApp('ie')}>
            <Ie variant="16x16_4" />
          </QuickButton>
          <QuickButton title="Netscape Navigator starten" onClick={() => onOpenApp('netscape')}>
            <NetscapeIcon variant="16x16_4" />
          </QuickButton>
          <QuickButton title="Mail an Stefan schreiben" onClick={() => onOpenApp('contact')}>
            <Mailnews2 variant="16x16_4" />
          </QuickButton>
          <QuickButton title="Winamp starten" onClick={() => onOpenApp('winamp')}>
            <WinampIcon variant="16x16_4" />
          </QuickButton>
        </div>
        <div className="task-list">
          {windows.map((win) => {
            const app = getApp(win.appId);
            const Icon = app?.icon;
            return (
              <Button
                key={win.id}
                className="task-button"
                active={!win.minimized && win.id === activeId}
                onClick={() => onToggleTask(win.id)}
              >
                <span className="task-button-label">
                  {Icon ? <Icon variant="16x16_4" /> : null}
                  {win.title}
                </span>
              </Button>
            );
          })}
        </div>
        <div className="tray-root" ref={trayRef}>
          {volumeOpen ? (
            <Window className="volume-popup">
              <WindowContent>
                <VolumeControl />
              </WindowContent>
            </Window>
          ) : null}
          {linkMenu ? (
            <MenuList className="tray-menu">
              <MenuListItem
                size="sm"
                onClick={() => {
                  disconnect();
                  setLinkMenu(false);
                }}
              >
                Trennen
              </MenuListItem>
            </MenuList>
          ) : null}
          <Frame variant="status" className="tray">
            {online ? (
              <button
                type="button"
                className="tray-icon"
                title="Verbindung hergestellt"
                aria-label="Verbindung hergestellt"
                onClick={() => {
                  setVolumeOpen(false);
                  setLinkMenu((open) => !open);
                }}
              >
                <Rnaui101 variant="16x16_4" />
              </button>
            ) : null}
            <button
              type="button"
              className="tray-icon"
              title={silent ? 'Lautstärke (Ton aus)' : `Lautstärke ${Math.round(settings.volume * 100)}%`}
              aria-label="Lautstärke"
              onClick={() => {
                setLinkMenu(false);
                setVolumeOpen((open) => !open);
              }}
              onDoubleClick={() => {
                setVolumeOpen(false);
                onOpenApp('volume');
              }}
            >
              <SpeakerIcon variant="16x16_4" />
            </button>
            <button
              type="button"
              className="tray-clock"
              title={now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              onClick={() => {
                setVolumeOpen(false);
                onOpenApp('datetime');
              }}
            >
              {now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </button>
          </Frame>
        </div>
      </Toolbar>
    </AppBar>
  );
}

function QuickButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button variant="thin" square size="sm" title={title} aria-label={title} onClick={onClick} className="quick-button">
      {children}
    </Button>
  );
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
