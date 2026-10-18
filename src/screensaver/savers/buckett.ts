import { drawCloth } from '../cloth';
import { clear, runLoop, type Rgb, type SaverStart } from '../loop';

const red: Rgb = [235, 20, 30];

const start: SaverStart = (canvas) =>
  runLoop(canvas, (ctx, width, height) => (_dt, t) => {
    clear(ctx, width, height);
    drawCloth(ctx, {
      cx: width / 2 + Math.sin(t * 0.35) * width * 0.12,
      cy: height / 2 + Math.cos(t * 0.27) * height * 0.08,
      size: Math.min(width, height) * 0.2,
      t,
      rotX: Math.sin(t * 0.45) * 0.7,
      rotY: t * 0.6,
      rotZ: Math.sin(t * 0.3) * 0.4,
      wave: 1.6,
      colorAt: () => red,
    });
  });

export default start;
