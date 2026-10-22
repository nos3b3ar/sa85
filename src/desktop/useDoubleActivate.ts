import { useRef, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useSettings } from '../settings/settings';

const slopPx = 4;

type Options = {
  /** Überschreibt die gespeicherte Doppelklickgeschwindigkeit, z. B. im Testbereich der Maus-Eigenschaften. */
  threshold?: number;
  leftHanded?: boolean;
};

export type PrimaryHandlers = {
  /** Linke Taste, bei Linkshändern die rechte. */
  isPrimary: (event: { button: number; pointerType?: string }) => boolean;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void;
  /** Verwirft den laufenden Klick, z. B. nach dem Ziehen eines Symbols. */
  reset: () => void;
};

/**
 * Ersetzt onDoubleClick, damit die eingestellte Doppelklickgeschwindigkeit und die
 * Tastenbelegung für Linkshänder wirken. Browser liefern dafür selbst keine Einstellung.
 */
export function useDoubleActivate(onActivate: () => void, options: Options = {}): PrimaryHandlers {
  const { mouse } = useSettings();
  const threshold = options.threshold ?? mouse.doubleClickMs;
  const leftHanded = options.leftHanded ?? mouse.leftHanded;
  const last = useRef<{ time: number; x: number; y: number } | null>(null);
  const primaryButton = leftHanded ? 2 : 0;

  return {
    isPrimary: (event) => event.pointerType === 'touch' || event.button === primaryButton,
    onPointerUp: (event) => {
      if (event.pointerType !== 'touch' && event.button !== primaryButton) return;
      const now = event.timeStamp;
      const previous = last.current;
      if (
        previous
        && now - previous.time <= threshold
        && Math.hypot(event.clientX - previous.x, event.clientY - previous.y) <= slopPx
      ) {
        last.current = null;
        onActivate();
        return;
      }
      last.current = { time: now, x: event.clientX, y: event.clientY };
    },
    onContextMenu: (event) => {
      if (leftHanded) event.preventDefault();
    },
    reset: () => {
      last.current = null;
    },
  };
}
