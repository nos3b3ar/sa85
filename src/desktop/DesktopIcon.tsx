import { useRef, useState } from 'react';
import type { DesktopApp } from '../apps/registry';
import { appTitle, useT } from '../i18n';
import { useSettings } from '../settings/settings';
import { snapIconPosition, type IconPoint } from './iconLayout';
import { useDoubleActivate } from './useDoubleActivate';

type DesktopIconProps = {
  app: DesktopApp;
  position: IconPoint;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onMove: (position: IconPoint) => void;
};

/** Verknüpfungspfeil von Windows 95: weißes Kästchen mit schwarzem Bogenpfeil unten links am Symbol. */
function ShortcutArrow() {
  return (
    <svg className="desktop-icon-shortcut" width="11" height="11" viewBox="0 0 11 11" aria-hidden shapeRendering="crispEdges">
      <rect x="0.5" y="0.5" width="10" height="10" fill="#fff" stroke="#000" />
      <path d="M3 9 V6 H4 V5 H5 V4 H6 V3 H5 V2 H9 V6 H8 V5 H7 V4 H6 V5 H5 V6 H4 V9 Z" fill="#000" />
    </svg>
  );
}

const mouseDragThreshold = 4;
const coarseDragThreshold = 16;

export function DesktopIcon({ app, position, selected, onSelect, onOpen, onMove }: DesktopIconProps) {
  const Icon = app.icon;
  const t = useT();
  const { look } = useSettings();
  const drag = useRef<{ dx: number; dy: number; moved: boolean; pointerType: string } | null>(null);
  const liveRef = useRef<IconPoint | null>(null);
  const [live, setLive] = useState<IconPoint | null>(null);
  const spot = live ?? position;
  const activate = useDoubleActivate(onOpen);

  const finishDrag = () => {
    const current = drag.current;
    drag.current = null;
    if (current?.moved && liveRef.current) onMove(snapIconPosition(liveRef.current));
    liveRef.current = null;
    setLive(null);
    return Boolean(current?.moved);
  };

  return (
    <button
      type="button"
      className={['desktop-icon', selected ? 'is-selected' : '', live ? 'is-dragging' : ''].filter(Boolean).join(' ')}
      style={{ left: spot.x, top: spot.y }}
      onPointerDown={(event) => {
        if (!activate.isPrimary(event)) return;
        onSelect();
        drag.current = {
          dx: event.clientX - spot.x,
          dy: event.clientY - spot.y,
          moved: false,
          pointerType: event.pointerType,
        };
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Ohne aktiven Pointer bleibt das Ziehen auf dem Symbol.
        }
      }}
      onPointerMove={(event) => {
        const current = drag.current;
        if (!current) return;
        const next = { x: event.clientX - current.dx, y: event.clientY - current.dy };
        const threshold = current.pointerType === 'mouse' ? mouseDragThreshold : coarseDragThreshold;
        if (!current.moved && Math.hypot(next.x - position.x, next.y - position.y) < threshold) return;
        current.moved = true;
        liveRef.current = next;
        setLive(next);
      }}
      onPointerUp={(event) => {
        if (finishDrag()) activate.reset();
        else activate.onPointerUp(event);
      }}
      onPointerCancel={() => {
        finishDrag();
        activate.reset();
      }}
      onContextMenu={activate.onContextMenu}
    >
      <span className="desktop-icon-art">
        <Icon variant="32x32_4" />
        {look === '95' && (app.kind === 'link' || app.shortcut) ? <ShortcutArrow /> : null}
      </span>
      <span>{appTitle(t, app)}</span>
    </button>
  );
}
