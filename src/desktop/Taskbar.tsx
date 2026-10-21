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
import { useLocaleTag, useT, windowTitle } from '../i18n';
import { queryBattery, useBattery } from '../power/battery';
import { PowerGlyph } from '../power/PowerGlyph';
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
  const t = useT();
  const tag = useLocaleTag();
  const battery = useBattery();
  const batteryInfo = battery.status === 'ready' ? battery.info : null;
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

  useEffect(() => {
    if (settings.showPowerMeter && battery.status === 'idle') void queryBattery();
  }, [settings.showPowerMeter, battery.status]);

  const silent = settings.muted || settings.volume === 0;
  const powerTitle = !batteryInfo?.present
    ? t.shell.powerAc
    : batteryInfo.charging
      ? t.shell.powerCharging(Math.round(batteryInfo.level * 100))
      : t.shell.powerBattery(Math.round(batteryInfo.level * 100));
  const SpeakerIcon = silent ? Mute : Unmute;

  return (
    <AppBar className="taskbar">
      <Toolbar className="taskbar-row">
        <div className="start-root" data-start-root>
          <Button active={menuOpen} onClick={onToggleMenu}>
            <span className="start-button-label">
              <WindowsLogo />
              {t.shell.start}
            </span>
          </Button>
          {menuOpen ? menu : null}
        </div>
        {/* Die Schnellstartleiste kam erst mit Windows 98. */}
        {settings.look === '98' ? (
          <div className="quick-launch">
            <span className="toolbar-grip" aria-hidden />
            <QuickButton title={t.shell.showDesktop} onClick={onShowDesktop}>
              <DesktopGlyph variant="16x16_4" />
            </QuickButton>
            <QuickButton title={t.shell.launchIe} onClick={() => onOpenApp('ie')}>
              <Ie variant="16x16_4" />
            </QuickButton>
            <QuickButton title={t.shell.launchNetscape} onClick={() => onOpenApp('netscape')}>
              <NetscapeIcon variant="16x16_4" />
            </QuickButton>
            <QuickButton title={t.shell.mailStefan} onClick={() => onOpenApp('contact')}>
              <Mailnews2 variant="16x16_4" />
            </QuickButton>
            <QuickButton title={t.shell.launchWinamp} onClick={() => onOpenApp('winamp')}>
              <WinampIcon variant="16x16_4" />
            </QuickButton>
          </div>
        ) : null}
        <div className="task-list">
          {settings.look === '98' ? <span className="toolbar-grip" aria-hidden /> : null}
          {windows.map((win) => {
            const app = getApp(win.appId);
            const Icon = win.icon ?? app?.windowIcon ?? app?.icon;
            return (
              <Button
                key={win.id}
                className="task-button"
                active={!win.minimized && win.id === activeId}
                onClick={() => onToggleTask(win.id)}
              >
                <span className="task-button-label">
                  {Icon ? <Icon variant="16x16_4" /> : null}
                  {windowTitle(t, app, win.title)}
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
                {t.shell.disconnect}
              </MenuListItem>
            </MenuList>
          ) : null}
          <Frame variant="status" className="tray">
            {online ? (
              <button
                type="button"
                className="tray-icon"
                title={t.shell.connected}
                aria-label={t.shell.connected}
                onClick={() => {
                  setVolumeOpen(false);
                  setLinkMenu((open) => !open);
                }}
              >
                <Rnaui101 variant="16x16_4" />
              </button>
            ) : null}
            {settings.showPowerMeter ? (
              <button
                type="button"
                className="tray-icon"
                title={powerTitle}
                aria-label={powerTitle}
                onClick={() => {
                  setVolumeOpen(false);
                  setLinkMenu(false);
                  onOpenApp('power');
                }}
              >
                <PowerGlyph info={batteryInfo} />
              </button>
            ) : null}
            <button
              type="button"
              className="tray-icon"
              title={silent ? t.shell.volumeMuted : t.shell.volumeLevel(Math.round(settings.volume * 100))}
              aria-label={t.shell.volume}
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
              title={now.toLocaleDateString(tag, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              onClick={() => {
                setVolumeOpen(false);
                onOpenApp('datetime');
              }}
            >
              {now.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' })}
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
