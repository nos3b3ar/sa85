import { useEffect, useRef, useState } from 'react';
import { getSettings, useSettings, type SaverId } from '../settings/settings';
import { SaverCanvas } from './SaverCanvas';

const previewEvent = 'sa85:screensaver-preview';
const graceMs = 600;
const moveTolerancePx = 8;

export function previewScreensaver(saver: SaverId, text3d: string, marqueeText: string) {
  window.dispatchEvent(new CustomEvent(previewEvent, { detail: { saver, text3d, marqueeText } }));
}

type ActiveSaver = {
  saver: SaverId;
  text3d: string;
  marqueeText: string;
};

export function ScreensaverHost() {
  const settings = useSettings();
  const [active, setActive] = useState<ActiveSaver | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const startedAt = useRef(0);
  const anchor = useRef<{ x: number; y: number } | null>(null);
  const timer = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const schedule = () => {
      window.clearTimeout(timer.current);
      const { saver, saverWaitSeconds } = getSettings();
      if (saver === 'none') return;
      timer.current = window.setTimeout(() => {
        const busyInFrame = document.activeElement instanceof HTMLIFrameElement;
        if (busyInFrame || document.visibilityState !== 'visible') {
          schedule();
          return;
        }
        const current = getSettings();
        show({ saver: current.saver, text3d: current.saverText3d, marqueeText: current.saverMarqueeText });
      }, Math.max(5, saverWaitSeconds) * 1000);
    };

    const show = (saver: ActiveSaver) => {
      startedAt.current = performance.now();
      anchor.current = null;
      setActive(saver);
    };

    const dismiss = () => {
      if (performance.now() - startedAt.current < graceMs) return;
      setActive(null);
      schedule();
    };

    const onActivity = (event: Event) => {
      if (!activeRef.current) {
        schedule();
        return;
      }
      if (event instanceof MouseEvent && event.type === 'mousemove') {
        if (!anchor.current) {
          anchor.current = { x: event.clientX, y: event.clientY };
          return;
        }
        const moved = Math.hypot(event.clientX - anchor.current.x, event.clientY - anchor.current.y);
        if (moved < moveTolerancePx) return;
      }
      if (event.type === 'keydown') event.preventDefault();
      dismiss();
    };

    const onPreview = (event: Event) => {
      const detail = (event as CustomEvent<ActiveSaver>).detail;
      window.clearTimeout(timer.current);
      show(detail);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((name) => window.addEventListener(name, onActivity, { capture: true, passive: name !== 'keydown' }));
    window.addEventListener(previewEvent, onPreview);
    schedule();

    return () => {
      window.clearTimeout(timer.current);
      events.forEach((name) => window.removeEventListener(name, onActivity, { capture: true }));
      window.removeEventListener(previewEvent, onPreview);
    };
  }, [settings.saver, settings.saverWaitSeconds]);

  useEffect(() => {
    if (!active) return;
    window.focus();
    overlayRef.current?.focus({ preventScroll: true });
  }, [active]);

  if (!active || active.saver === 'none') return null;

  return (
    <div className="screensaver" aria-hidden tabIndex={-1} ref={overlayRef}>
      <SaverCanvas saver={active.saver} options={{ text3d: active.text3d, marqueeText: active.marqueeText }} />
    </div>
  );
}
