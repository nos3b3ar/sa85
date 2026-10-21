import { useEffect, useMemo, useRef } from 'react';
import { useSettings } from '../settings/settings';
import { cursorFrames } from './render';

const framesPerStep = 3;

/** Mausspur wie in Windows 98: Kopien des Zeigers folgen der Maus mit Verzögerung. */
export function PointerTrail() {
  const { mouse, desktopColor } = useSettings();
  const image = useMemo(() => cursorFrames('normal', mouse, desktopColor)[0], [mouse, desktopColor]);
  const count = mouse.trail ? mouse.trailLength : 0;
  const refs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    if (count === 0) return;
    let pointer: { x: number; y: number } | null = null;
    const history: { x: number; y: number }[] = [];
    const capacity = count * framesPerStep + 1;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') pointer = { x: event.clientX, y: event.clientY };
    };
    const onLeave = () => {
      pointer = null;
      history.length = 0;
    };

    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (pointer) {
        history.push(pointer);
        if (history.length > capacity) history.shift();
      }
      refs.current.forEach((node, index) => {
        if (!node) return;
        const spot = history[history.length - 1 - (index + 1) * framesPerStep];
        const visible = spot && pointer && (spot.x !== pointer.x || spot.y !== pointer.y);
        node.style.visibility = visible ? 'visible' : 'hidden';
        if (visible) node.style.transform = `translate(${spot.x - image.x}px, ${spot.y - image.y}px)`;
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [count, image]);

  if (count === 0) return null;
  return (
    <div className="pointer-trail" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <img
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          src={image.url}
          width={image.width}
          height={image.height}
          alt=""
          style={{ opacity: 1 - index / (count + 1) }}
        />
      ))}
    </div>
  );
}
