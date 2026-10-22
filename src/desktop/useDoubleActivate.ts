import { useRef, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useSettings } from '../settings/settings';

const mouseSlopPx = 4;
const touchSlopPx = 24;
const touchMinMs = 500;

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

type Armed = {
  owner: object;
  time: number;
  x: number;
  y: number;
  element: HTMLElement;
  threshold: number;
  open: () => void;
};

let armed: Armed | null = null;
let ignoredPointer = -1;

/**
 * Ersetzt onDoubleClick, damit die eingestellte Doppelklickgeschwindigkeit und die
 * Tastenbelegung für Linkshänder wirken. Finger dürfen dabei deutlich verrutschen.
 */
export function useDoubleActivate(onActivate: () => void, options: Options = {}): PrimaryHandlers {
  const { mouse } = useSettings();
  const threshold = options.threshold ?? mouse.doubleClickMs;
  const leftHanded = options.leftHanded ?? mouse.leftHanded;
  const last = useRef<{ time: number; x: number; y: number; coarse: boolean } | null>(null);
  const owner = useRef({});
  const onActivateRef = useRef(onActivate);
  const thresholdRef = useRef(threshold);
  onActivateRef.current = onActivate;
  thresholdRef.current = threshold;
  const primaryButton = leftHanded ? 2 : 0;

  return {
    isPrimary: (event) => event.pointerType === 'touch' || event.button === primaryButton,
    onPointerUp: (event) => {
      const coarse = event.pointerType !== 'mouse';
      if (!coarse && event.button !== primaryButton) return;
      if (coarse && event.pointerId === ignoredPointer) {
        ignoredPointer = -1;
        return;
      }
      const now = event.timeStamp;
      const previous = last.current;
      const limit = coarse ? Math.max(thresholdRef.current, touchMinMs) : thresholdRef.current;
      const slop = coarse ? touchSlopPx : mouseSlopPx;
      if (
        previous
        && previous.coarse === coarse
        && now - previous.time <= limit
        && Math.hypot(event.clientX - previous.x, event.clientY - previous.y) <= slop
      ) {
        last.current = null;
        if (armed?.owner === owner.current) armed = null;
        onActivateRef.current();
        return;
      }
      last.current = { time: now, x: event.clientX, y: event.clientY, coarse };
      if (!coarse) return;
      armed = {
        owner: owner.current,
        time: now,
        x: event.clientX,
        y: event.clientY,
        element: event.currentTarget,
        threshold: limit,
        open: () => onActivateRef.current(),
      };
    },
    onContextMenu: (event) => {
      if (leftHanded) event.preventDefault();
    },
    reset: () => {
      last.current = null;
      if (armed?.owner === owner.current) armed = null;
    },
  };
}

/** Zweiter Tipp neben dem Symbol: noch öffnen, wenn kein Nachbar näher liegt. */
function onSlippedTap(event: PointerEvent) {
  const current = armed;
  if (!current || event.pointerType === 'mouse' || event.button !== 0) return;
  if (event.timeStamp - current.time > current.threshold) {
    armed = null;
    return;
  }
  if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > touchSlopPx) return;
  if (current.element.contains(event.target as Node)) return;
  const hit = (event.target as Element | null)?.closest?.('.desktop-icon, .folder-item');
  if (hit && hit !== current.element && closer(event.clientX, event.clientY, hit, current.element)) return;
  if (!hit && anyNeighborCloser(event.clientX, event.clientY, current.element)) return;
  armed = null;
  ignoredPointer = event.pointerId;
  event.preventDefault();
  event.stopPropagation();
  current.open();
}

function closer(x: number, y: number, element: Element, origin: HTMLElement) {
  return distance(x, y, element) < distance(x, y, origin);
}

function anyNeighborCloser(x: number, y: number, origin: HTMLElement) {
  const originDistance = distance(x, y, origin);
  const nodes = document.querySelectorAll('.desktop-icon, .folder-item');
  for (const node of nodes) {
    if (node === origin) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (distance(x, y, node) < originDistance) return true;
  }
  return false;
}

function distance(x: number, y: number, element: Element) {
  const rect = element.getBoundingClientRect();
  return Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2));
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', onSlippedTap, true);
}
