import { drawCloth } from '../cloth';
import { Bouncer, clear, runLoop, type Rgb, type SaverStart } from '../loop';

const black: Rgb = [12, 12, 12];
const quadrants: Rgb[] = [
  [240, 60, 25],
  [95, 185, 45],
  [45, 110, 215],
  [245, 200, 30],
];

function windowsFlag(u: number, v: number): Rgb {
  const frame = 0.07;
  const gap = 0.045;
  if (u < frame || u > 1 - frame || v < frame || v > 1 - frame) return black;
  if (Math.abs(u - 0.5) < gap || Math.abs(v - 0.5) < gap) return black;
  return quadrants[(v < 0.5 ? 0 : 2) + (u < 0.5 ? 0 : 1)];
}

const start: SaverStart = (canvas) =>
  runLoop(canvas, (ctx, width, height) => {
    const size = Math.min(width, height) * 0.13;
    const margin = size * 1.4;
    const mover = new Bouncer(width - margin * 2, height - margin * 2, Math.max(width, height) * 0.12);

    return (dt, t) => {
      clear(ctx, width, height);
      mover.step(dt, width - margin * 2, height - margin * 2);
      drawCloth(ctx, {
        cx: mover.x + margin,
        cy: mover.y + margin,
        size,
        t,
        rotX: Math.sin(t * 0.5) * 0.35,
        rotY: Math.sin(t * 0.7) * 0.9,
        rotZ: -0.12,
        wave: 1.2,
        colorAt: windowsFlag,
      });
    };
  });

export default start;
