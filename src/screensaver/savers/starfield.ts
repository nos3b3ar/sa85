import { clear, runLoop, type SaverStart } from '../loop';

type Star = { x: number; y: number; z: number };

const start: SaverStart = (canvas) =>
  runLoop(canvas, (ctx, width, height) => {
    const spawn = (anyDepth: boolean): Star => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: anyDepth ? Math.random() : 1,
    });
    const stars = Array.from({ length: Math.round((width * height) / 2200) + 40 }, () => spawn(true));
    const cx = width / 2;
    const cy = height / 2;

    return (dt) => {
      clear(ctx, width, height);
      for (const star of stars) {
        star.z -= dt * 0.32;
        const px = cx + (star.x / star.z) * cx;
        const py = cy + (star.y / star.z) * cy;
        if (star.z <= 0.01 || px < 0 || px > width || py < 0 || py > height) {
          Object.assign(star, spawn(false));
          continue;
        }
        const near = 1 - star.z;
        const size = Math.max(1, near * 3.2 * (width / 640));
        const shade = Math.round(90 + near * 165);
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.fillRect(px, py, size, size);
      }
    };
  });

export default start;
