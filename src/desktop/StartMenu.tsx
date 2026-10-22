import { Computer } from '@react95/icons/Computer';
import { Folder } from '@react95/icons/Folder';
import { useState } from 'react';
import { MenuList, MenuListItem, Separator } from 'react95';
import { desktopApps, type DesktopApp } from '../apps/registry';
import { appTitle, useT } from '../i18n';

type StartMenuProps = {
  onOpen: (appId: string) => void;
  onShutdown: () => void;
};

export function StartMenu({ onOpen, onShutdown }: StartMenuProps) {
  const [gamesOpen, setGamesOpen] = useState(false);
  const t = useT();
  const visible = desktopApps.filter((app) => app.showInStartMenu !== false);
  const games = visible.filter((app) => app.startMenuGroup === 'games');

  return (
    <div className="start-menu">
      <div className="start-banner">
        <b>Stefan</b>
        <span>Andernach</span>
      </div>
      <MenuList className="start-list">
        {visible.filter((app) => !app.startMenuGroup).map((app) => (
          <MenuListItem key={app.id} onClick={() => onOpen(app.id)} onMouseEnter={() => setGamesOpen(false)}>
            <StartItem app={app} large />
          </MenuListItem>
        ))}
        {games.length > 0 ? (
          <MenuListItem
            className={gamesOpen ? 'start-group is-open' : 'start-group'}
            onMouseEnter={() => setGamesOpen(true)}
            onClick={() => setGamesOpen((open) => !open)}
          >
            <span className="start-item is-large">
              <Folder variant="32x32_4" />
              {t.shell.games}
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
        <MenuListItem onClick={onShutdown} onMouseEnter={() => setGamesOpen(false)}>
          <span className="start-item is-large">
            <Computer variant="32x32_4" />
            {t.shell.shutdown}
          </span>
        </MenuListItem>
      </MenuList>
    </div>
  );
}

function StartItem({ app, large = false }: { app: DesktopApp; large?: boolean }) {
  const Icon = app.icon;
  const t = useT();
  return (
    <span className={large ? 'start-item is-large' : 'start-item'}>
      <Icon variant={large ? '32x32_4' : '16x16_4'} />
      {appTitle(t, app)}
    </span>
  );
}
