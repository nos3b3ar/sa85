import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Window, WindowContent, WindowHeader } from 'react95';
import { useSettings } from '../../settings/settings';
import type { AppProps } from '../types';
import { randomCrash, type DialogCrash, type ScreenCrash } from './crashes';

const lastKey = 'sa85.napster.lastCrash';

function pickCrash() {
  let previous: string | undefined;
  try {
    previous = sessionStorage.getItem(lastKey) ?? undefined;
  } catch {
    previous = undefined;
  }
  const crash = randomCrash(previous);
  try {
    sessionStorage.setItem(lastKey, crash.id);
  } catch {
    /* ohne Speicher darf derselbe Fehler auch zweimal kommen */
  }
  return crash;
}

/** Napster startet nie: Jeder Start endet in einem zufälligen Windows-Fehler aus dem Pool. */
export function NapsterApp({ chrome, onClose }: AppProps) {
  const [crash] = useState(pickCrash);
  const lang = useSettings().locale === 'de' ? 'de' : 'en';
  const close = chrome?.onClose ?? onClose;
  if (crash.kind === 'screen') return <CrashScreen crash={crash} lang={lang} onClose={close} />;
  return <CrashDialog crash={crash} lang={lang} chrome={chrome} onClose={close} />;
}

function ErrorIcon({ kind }: { kind: DialogCrash['icon'] }) {
  if (kind === 'warning') {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden className="crash-icon">
        <path d="M16 2 L30 28 H2 Z" fill="#ffff00" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="14.5" y="10" width="3" height="10" fill="#000" />
        <rect x="14.5" y="22" width="3" height="3" fill="#000" />
      </svg>
    );
  }
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden className="crash-icon">
      <circle cx="16" cy="16" r="14" fill="#ff0000" stroke="#800000" strokeWidth="1.5" />
      <path d="M10.5 10.5 L21.5 21.5 M21.5 10.5 L10.5 21.5" stroke="#fff" strokeWidth="3.4" strokeLinecap="square" />
    </svg>
  );
}

function CrashDialog({
  crash,
  lang,
  chrome,
  onClose,
}: {
  crash: DialogCrash;
  lang: 'de' | 'en';
  chrome: AppProps['chrome'];
  onClose: () => void;
}) {
  const [details, setDetails] = useState(false);
  const closeLabel = lang === 'de' ? 'Schließen' : 'Close';

  return (
    <Window className="crash-dialog">
      <WindowHeader active={chrome?.active ?? true} className="app-window-header" {...chrome?.dragHandlers}>
        <span className="app-window-title">
          <span>{crash.title[lang]}</span>
        </span>
        <Button size="sm" onClick={onClose} aria-label={closeLabel} title={closeLabel}>
          <span className="title-close" />
        </Button>
      </WindowHeader>
      <WindowContent className="crash-body">
        <div className="crash-main">
          <ErrorIcon kind={crash.icon} />
          <div className="crash-text">
            {crash.message.map((line) => (
              <p key={line.en}>{line[lang]}</p>
            ))}
          </div>
          <div className={crash.details ? 'crash-actions is-side' : 'crash-actions'}>
            {crash.buttons.map((button, index) => {
              const isDetails = Boolean(crash.details) && index === 1;
              return (
                <Button
                  key={button.en}
                  primary={index === 0}
                  autoFocus={index === 0}
                  onClick={isDetails ? () => setDetails((open) => !open) : onClose}
                  style={{ minWidth: 86 }}
                >
                  {isDetails && details ? '<< Details' : button[lang]}
                </Button>
              );
            })}
          </div>
        </div>
        {details && crash.details ? (
          <textarea className="crash-details" readOnly value={crash.details[lang]} rows={10} aria-label="Details" />
        ) : null}
      </WindowContent>
    </Window>
  );
}

function CrashScreen({ crash, lang, onClose }: { crash: ScreenCrash; lang: 'de' | 'en'; onClose: () => void }) {
  useEffect(() => {
    const finish = () => onClose();
    // Erst nach dem Doppelklick zuhören, sonst schließt derselbe Klick den Bluescreen sofort.
    const timer = window.setTimeout(() => {
      window.addEventListener('keydown', finish, { once: true });
      window.addEventListener('pointerdown', finish, { once: true });
    }, 400);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', finish);
      window.removeEventListener('pointerdown', finish);
    };
  }, [onClose]);

  return createPortal(
    <div className={`crash-screen is-${crash.tone}`} role="alertdialog" aria-label={crash.heading?.[lang] ?? 'Windows'}>
      <div className="crash-screen-inner">
        {crash.heading ? <p className="crash-screen-heading">{crash.heading[lang]}</p> : null}
        {crash.lines.map((line) => (
          <p key={line.en}>{line[lang]}</p>
        ))}
        {crash.prompt ? <p className="crash-screen-prompt">{crash.prompt[lang]}</p> : null}
      </div>
    </div>,
    document.body,
  );
}
