import { clear, runLoop, type SaverStart } from '../loop';

type Flag = { x: number; y: number; z: number };

const start: SaverStart = (canvas) => {
  const image = new Image();
  image.src = '/img/win98.png';

  return runLoop(canvas, (ctx, width, height) => {
    const spawn = (anyDepth: boolean): Flag => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: anyDepth ? Math.random() * 0.9 + 0.1 : 1,
    });
    const flags = Array.from({ length: 34 }, () => spawn(true));
    const cx = width / 2;
    const cy = height / 2;
    const base = Math.max(6, height * 0.035);

    return (dt) => {
      clear(ctx, width, height);
      flags.sort((a, b) => b.z - a.z);
      for (const flag of flags) {
        flag.z -= dt * 0.22;
        const size = base / flag.z;
        const px = cx + (flag.x / flag.z) * cx;
        const py = cy + (flag.y / flag.z) * cy;
        if (flag.z <= 0.04 || px < -size || px > width + size || py < -size || py > height + size) {
          Object.assign(flag, spawn(false));
          continue;
        }
        if (!image.complete) continue;
        ctx.globalAlpha = Math.min(1, (1 - flag.z) * 2.2);
        ctx.drawImage(image, px - size / 2, py - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };
  });
};

export default start;
