import { useEffect, useRef } from 'react';
import type { SaverId } from '../settings/settings';
import { getSaver } from './catalog';
import type { SaverOptions } from './loop';

type SaverCanvasProps = {
  saver: SaverId;
  options: SaverOptions;
  className?: string;
};

export function SaverCanvas({ saver, options, className }: SaverCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { text3d, marqueeText } = options;

  useEffect(() => {
    const canvas = ref.current;
    const def = getSaver(saver);
    if (!canvas || !def) return;
    let stop: (() => void) | null = null;
    let cancelled = false;
    void def.load().then((mod) => {
      if (!cancelled) stop = mod.default(canvas, { text3d, marqueeText });
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [saver, text3d, marqueeText]);

  return <canvas ref={ref} className={className ?? 'saver-canvas'} />;
}
