import { useState } from 'react';
import { desktopApps } from './registry';
import type { AppProps } from './types';

export function GamesApp({ openApp }: AppProps) {
  const games = desktopApps.filter((app) => app.startMenuGroup === 'games');
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="folder-view">
      {games.map((game) => {
        const Icon = game.icon;
        return (
          <button
            key={game.id}
            type="button"
            className={selected === game.id ? 'folder-item is-selected' : 'folder-item'}
            onClick={() => setSelected(game.id)}
            onDoubleClick={() => openApp(game.id)}
          >
            <Icon variant="32x32_4" />
            <span>{game.title}</span>
          </button>
        );
      })}
    </div>
  );
}
