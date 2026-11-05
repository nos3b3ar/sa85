import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, MenuList, MenuListItem, Separator, Window, WindowContent, WindowHeader } from 'react95';
import { IcqFlower } from './IcqFlower';
import type { Status } from './data';

let topZ = 4000;
const nextZ = () => ++topZ;

function desktopRoot() {
  return document.querySelector('.desktop') ?? document.body;
}

type FloatingProps = {
  title: string;
  tone?: Status | 'logo';
  width: number;
  /** Versatz, damit mehrere Fenster nicht genau übereinander liegen. */
  offset?: number;
  closeLabel: string;
  onClose: () => void;
  className?: string;
  /** Ersetzt die Blume in der Titelleiste. */
  icon?: ReactNode;
  children: ReactNode;
};

/** Eigenes Win98-Fenster über dem Desktop, für Nachrichten und Dialoge von ICQ. */
export function IcqFloating({ title, tone = 'logo', width, offset = 0, closeLabel, onClose, className, icon, children }: FloatingProps) {
  const [pos, setPos] = useState(() => {
    const w = Math.min(width, window.innerWidth - 16);
    const besideList = Math.round(window.innerWidth / 2 - w - 110);
    return {
      x: Math.max(8, (besideList > 8 ? besideList : Math.round((window.innerWidth - w) / 2)) + offset),
      y: Math.max(8, Math.round(window.innerHeight * 0.18) + offset),
    };
  });
  const [z, setZ] = useState(nextZ);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  return createPortal(
    <Window
      className={['icq-floating', className].filter(Boolean).join(' ')}
      style={{ left: pos.x, top: pos.y, zIndex: z, width: Math.min(width, window.innerWidth - 16) }}
      onPointerDownCapture={() => setZ(nextZ())}
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
    >
      <WindowHeader
        active
        className="app-window-header icq-floating-header"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('button')) return;
          drag.current = { dx: event.clientX - pos.x, dy: event.clientY - pos.y };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const x = Math.min(window.innerWidth - 40, Math.max(-width + 60, event.clientX - drag.current.dx));
          const y = Math.min(window.innerHeight - 60, Math.max(0, event.clientY - drag.current.dy));
          setPos({ x, y });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        <span className="app-window-title">
          {icon ?? <IcqFlower size={16} tone={tone} />}
          <span>{title}</span>
        </span>
        <Button size="sm" onClick={onClose} aria-label={closeLabel} title={closeLabel}>
          <span className="title-close" />
        </Button>
      </WindowHeader>
      <WindowContent className="icq-floating-body">{children}</WindowContent>
    </Window>,
    desktopRoot(),
  );
}

export type PopupEntry =
  | { kind: 'item'; label: string; tone?: Status | 'logo'; checked?: boolean; bold?: boolean; disabled?: boolean; onSelect: () => void }
  | { kind: 'header'; label: string }
  | { kind: 'separator' };

type PopupProps = {
  /** Linke obere Ecke oder, mit `above`, linke untere Ecke in Bildschirmkoordinaten. */
  x: number;
  y: number;
  above?: boolean;
  /** Feste Breite, z. B. die des ICQ-Fensters beim Statusmenü. */
  width?: number;
  /** Kleine Zeilen wie im Statusmenü von ICQ 2001b. */
  compact?: boolean;
  entries: PopupEntry[];
  onClose: () => void;
  label: string;
};

export function IcqPopup({ x, y, above, width, compact, entries, onClose, label }: PopupProps) {
  const ref = useRef<HTMLUListElement>(null);
  const [place, setPlace] = useState({ left: x, top: y, ready: false });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const left = Math.max(4, Math.min(x, window.innerWidth - rect.width - 4));
    const wanted = above ? y - rect.height : y;
    const top = Math.max(4, Math.min(wanted, window.innerHeight - rect.height - 4));
    setPlace({ left, top, ready: true });
  }, [x, y, above]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const timer = window.setTimeout(() => document.addEventListener('pointerdown', close), 0);
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <MenuList
      ref={ref}
      className={compact ? 'context-menu icq-popup is-compact' : 'context-menu icq-popup'}
      role="menu"
      aria-label={label}
      style={{ left: place.left, top: place.top, width, visibility: place.ready ? 'visible' : 'hidden' }}
    >
      {entries.map((entry, index) => {
        if (entry.kind === 'separator') return <Separator key={index} />;
        if (entry.kind === 'header') {
          return (
            <li key={index} className="icq-popup-header" role="presentation">
              <span>{entry.label}</span>
            </li>
          );
        }
        return (
          <MenuListItem
            key={index}
            role="menuitem"
            size="sm"
            disabled={entry.disabled}
            className={entry.bold ? 'icq-popup-item is-bold' : 'icq-popup-item'}
            onClick={() => {
              if (entry.disabled) return;
              onClose();
              entry.onSelect();
            }}
          >
            <span className="icq-popup-icon">
              {entry.checked ? '✓' : entry.tone ? <IcqFlower size={16} tone={entry.tone} /> : null}
            </span>
            {entry.label}
          </MenuListItem>
        );
      })}
    </MenuList>,
    desktopRoot(),
  );
}
