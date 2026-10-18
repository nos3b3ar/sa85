import { Bouncer, clear, runLoop, type SaverStart } from '../loop';

const trail = 7;

const start: SaverStart = (canvas) =>
  runLoop(canvas, (ctx, width, height) => {
    const speed = Math.max(width, height) * 0.32;
    const shapes = [0, 1].map((index) => ({
      points: Array.from({ length: 4 }, () => new Bouncer(width, height, speed)),
      history: [] as Array<Array<[number, number]>>,
      hue: index * 160,
    }));
    let sinceSnapshot = 0;

    return (dt) => {
      clear(ctx, width, height);
      sinceSnapshot += dt;
      for (const shape of shapes) {
        shape.points.forEach((point) => point.step(dt, width, height));
        shape.hue = (shape.hue + dt * 18) % 360;
        if (sinceSnapshot > 0.06) {
          shape.history.unshift(shape.points.map((point) => [point.x, point.y]));
          shape.history.length = Math.min(shape.history.length, trail);
        }
        ctx.strokeStyle = `hsl(${shape.hue}, 100%, 55%)`;
        ctx.lineWidth = Math.max(1, width / 640);
        for (const outline of shape.history) {
          ctx.beginPath();
          outline.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
          ctx.closePath();
          ctx.stroke();
        }
      }
      if (sinceSnapshot > 0.06) sinceSnapshot = 0;
    };
  });

export default start;
