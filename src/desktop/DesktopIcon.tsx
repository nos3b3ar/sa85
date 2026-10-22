import { useRef, useState } from 'react';
import type { DesktopApp } from '../apps/registry';
import { appTitle, useT } from '../i18n';
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

const mouseDragThreshold = 4;
const coarseDragThreshold = 16;

export function DesktopIcon({ app, position, selected, onSelect, onOpen, onMove }: DesktopIconProps) {
  const Icon = app.icon;
  const t = useT();
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
      <Icon variant="32x32_4" />
      <span>{appTitle(t, app)}</span>
    </button>
  );
}
