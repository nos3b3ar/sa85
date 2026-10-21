import { QuestionBubble } from '@react95/icons/QuestionBubble';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button, MenuList, MenuListItem, Window, WindowContent, WindowHeader } from 'react95';
import { dosGames, type DosGame } from '../content/dosGames';
import type { AppProps } from './types';

type DosMessage = { type: 'sa85-dos'; event: 'started' | 'rejected'; name?: string | null };

const storageKeyPrefix = 'jsdos.';

type IterableDirectory = FileSystemDirectoryHandle & { values(): AsyncIterable<FileSystemHandle> };

async function sumFiles(dir: FileSystemDirectoryHandle): Promise<number> {
  let total = 0;
  for await (const handle of (dir as IterableDirectory).values()) {
    total += handle.kind === 'file'
      ? (await (handle as FileSystemFileHandle).getFile()).size
      : await sumFiles(handle as FileSystemDirectoryHandle);
  }
  return total;
}

function storageKeys() {
  return Object.keys(localStorage).filter((key) => key.startsWith(storageKeyPrefix));
}

/** Bytes, die js-dos im Browser hinterlegt hat: Bundles im OPFS plus Einstellungen im localStorage. */
async function storedBytes() {
  let total = storageKeys().reduce((sum, key) => sum + key.length + (localStorage.getItem(key)?.length ?? 0), 0);
  try {
    const root = await navigator.storage.getDirectory();
    total += await sumFiles(await root.getDirectoryHandle('jsdos'));
  } catch {
    // Kein OPFS oder noch nichts gespeichert.
  }
  return total;
}

async function clearStorage() {
  storageKeys().forEach((key) => localStorage.removeItem(key));
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry('jsdos', { recursive: true });
  } catch {
    // Kein OPFS oder noch nichts gespeichert.
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} Bytes`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

export function DosApp({ onClose, setCloseGuard }: AppProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [program, setProgram] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [closePrompt, setClosePrompt] = useState<number | null>(null);
  const [gamesOpen, setGamesOpen] = useState(false);
  const gamesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent<DosMessage>) => {
      if (event.source !== frameRef.current?.contentWindow || event.data?.type !== 'sa85-dos') return;
      if (event.data.event === 'started') {
        setProgram(event.data.name?.replace(/\.(zip|jsdos)$/i, '') ?? null);
        setNote(null);
        frameRef.current?.focus();
      }
      if (event.data.event === 'rejected') setNote(`${event.data.name} ist keine .zip- oder .jsdos-Datei.`);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    setCloseGuard?.(() => {
      void storedBytes().then((bytes) => (bytes > 0 ? setClosePrompt(bytes) : onClose()));
    });
    return () => setCloseGuard?.(null);
  }, [onClose, setCloseGuard]);

  const send = (message: Record<string, unknown>) => {
    frameRef.current?.contentWindow?.postMessage({ type: 'sa85-dos', ...message }, window.location.origin);
  };

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) send({ action: 'load', file });
  };

  useEffect(() => {
    if (!gamesOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!gamesRef.current?.contains(event.target as Node)) setGamesOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [gamesOpen]);

  const startGame = async (game: DosGame) => {
    setGamesOpen(false);
    setNote(`${game.title} wird geladen...`);
    try {
      const response = await fetch(game.file);
      if (!response.ok) throw new Error(String(response.status));
      const file = new File([await response.blob()], `${game.title}.zip`);
      send({ action: 'load', file, run: [`cd \\GAMES\\${game.dir}`, game.exe], cycles: game.cycles });
    } catch {
      setNote(`${game.title} konnte nicht geladen werden.`);
    }
  };

  const clear = async () => {
    const bytes = await storedBytes();
    await clearStorage();
    setNote(bytes > 0 ? `Cache geleert (${formatBytes(bytes)}).` : 'Der Cache ist bereits leer.');
  };

  const closeAndClear = async () => {
    await clearStorage();
    onClose();
  };

  return (
    <div className="dos-app">
      <div className="dos-toolbar">
        <div className="dos-games" ref={gamesRef}>
          <Button size="sm" active={gamesOpen} onClick={() => setGamesOpen((open) => !open)}>Spiele ▾</Button>
          {gamesOpen ? (
            <MenuList className="browser-dropdown dos-games-menu">
              {dosGames.map((game) => (
                <MenuListItem key={game.id} size="sm" title={game.license} onClick={() => void startGame(game)}>
                  {game.title} ({game.year})
                </MenuListItem>
              ))}
            </MenuList>
          ) : null}
        </div>
        <Button size="sm" onClick={() => fileRef.current?.click()}>Programm öffnen...</Button>
        <Button size="sm" onClick={() => send({ action: 'reset' })}>Neustart</Button>
        <Button size="sm" onClick={() => void frameRef.current?.requestFullscreen?.()}>Vollbild</Button>
        <Button size="sm" onClick={() => void clear()}>Cache leeren</Button>
        <span className="dos-status">
          {note ?? (program ? `C:\\ = ${program}` : '.zip oder .jsdos hierher ziehen')}
        </span>
        <input ref={fileRef} type="file" accept=".zip,.jsdos" hidden onChange={pick} />
      </div>
      <div className="dos-screen">
        <iframe ref={frameRef} src="/dos/index.html" title="MS DOS" allow="fullscreen; autoplay" />
      </div>
      {closePrompt !== null ? (
        <div className="modal-layer">
          <Window className="message-box">
            <WindowHeader active className="app-window-header">
              <span className="app-window-title">MS DOS</span>
              <Button size="sm" onClick={() => setClosePrompt(null)} aria-label="Schließen">
                <span className="title-close" />
              </Button>
            </WindowHeader>
            <WindowContent>
              <div className="message-body">
                <QuestionBubble variant="32x32_32" width={32} height={32} style={{ flex: 'none' }} />
                <p>
                  MS DOS hat {formatBytes(closePrompt)} in diesem Browser gespeichert, etwa geöffnete Programme und
                  Einstellungen. Sollen diese Daten beim Schließen gelöscht werden?
                </p>
              </div>
              <div className="message-actions">
                <Button style={{ minWidth: 84 }} onClick={() => void closeAndClear()}>Ja</Button>
                <Button style={{ minWidth: 84 }} onClick={onClose}>Nein</Button>
                <Button style={{ minWidth: 84 }} onClick={() => setClosePrompt(null)}>Abbrechen</Button>
              </div>
            </WindowContent>
          </Window>
        </div>
      ) : null}
    </div>
  );
}
