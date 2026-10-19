import { useRef, useState } from 'react';
import type { DesktopApp } from '../apps/registry';
import { snapIconPosition, type IconPoint } from './iconLayout';

type DesktopIconProps = {
  app: DesktopApp;
  position: IconPoint;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onMove: (position: IconPoint) => void;
};

const dragThreshold = 4;

export function DesktopIcon({ app, position, selected, onSelect, onOpen, onMove }: DesktopIconProps) {
  const Icon = app.icon;
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const liveRef = useRef<IconPoint | null>(null);
  const skipOpen = useRef(false);
  const [live, setLive] = useState<IconPoint | null>(null);
  const spot = live ?? position;

  const finishDrag = () => {
    const current = drag.current;
    drag.current = null;
    skipOpen.current = Boolean(current?.moved);
    if (current?.moved && liveRef.current) onMove(snapIconPosition(liveRef.current));
    liveRef.current = null;
    setLive(null);
  };

  return (
    <button
      type="button"
      className={['desktop-icon', selected ? 'is-selected' : '', live ? 'is-dragging' : ''].filter(Boolean).join(' ')}
      style={{ left: spot.x, top: spot.y }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        onSelect();
        drag.current = { dx: event.clientX - spot.x, dy: event.clientY - spot.y, moved: false };
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
        if (!current.moved && Math.hypot(next.x - position.x, next.y - position.y) < dragThreshold) return;
        current.moved = true;
        liveRef.current = next;
        setLive(next);
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onDoubleClick={() => {
        if (skipOpen.current) {
          skipOpen.current = false;
          return;
        }
        onOpen();
      }}
    >
      <Icon variant="32x32_4" />
      <span>{app.title}</span>
    </button>
  );
}
