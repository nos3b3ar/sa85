import { Folder } from '@react95/icons/Folder';
import { useState } from 'react';
import { MenuList, MenuListItem, Separator } from 'react95';
import { desktopApps, type DesktopApp } from '../apps/registry';
import { WindowsLogo } from './WindowsLogo';

type StartMenuProps = {
  onOpen: (appId: string) => void;
  onShutdown: () => void;
};

export function StartMenu({ onOpen, onShutdown }: StartMenuProps) {
  const [gamesOpen, setGamesOpen] = useState(false);
  const visible = desktopApps.filter((app) => app.showInStartMenu !== false);
  const games = visible.filter((app) => app.startMenuGroup === 'games');

  return (
    <div className="start-menu">
      <div className="start-banner">sa85</div>
      <MenuList>
        {visible.filter((app) => !app.startMenuGroup).map((app) => (
          <MenuListItem key={app.id} onClick={() => onOpen(app.id)} onMouseEnter={() => setGamesOpen(false)}>
            <StartItem app={app} />
          </MenuListItem>
        ))}
        {games.length > 0 ? (
          <MenuListItem
            className={gamesOpen ? 'start-group is-open' : 'start-group'}
            onMouseEnter={() => setGamesOpen(true)}
            onClick={() => setGamesOpen((open) => !open)}
          >
            <span className="start-item">
              <Folder variant="16x16_4" />
              Spiele
              <span className="start-arrow" aria-hidden="true" />
            </span>
            {gamesOpen ? (
              <MenuList className="start-submenu">
                {games.map((app) => (
                  <MenuListItem
                    key={app.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(app.id);
                    }}
                  >
                    <StartItem app={app} />
                  </MenuListItem>
                ))}
              </MenuList>
            ) : null}
          </MenuListItem>
        ) : null}
        <Separator />
        <MenuListItem className="start-shutdown" onClick={onShutdown} onMouseEnter={() => setGamesOpen(false)}>
          <span className="start-item">
            <WindowsLogo />
            Beenden...
          </span>
        </MenuListItem>
      </MenuList>
    </div>
  );
}

function StartItem({ app }: { app: DesktopApp }) {
  const Icon = app.icon;
  return (
    <span className="start-item">
      <Icon variant="16x16_4" />
      {app.title}
    </span>
  );
}
