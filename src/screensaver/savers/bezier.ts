import { Bouncer, clear, runLoop, type SaverStart } from '../loop';

const trail = 14;

const start: SaverStart = (canvas) =>
  runLoop(canvas, (ctx, width, height) => {
    const speed = Math.max(width, height) * 0.28;
    const points = Array.from({ length: 7 }, () => new Bouncer(width, height, speed));
    const history: Array<Array<[number, number]>> = [];
    let hue = 120;
    let sinceSnapshot = 0;

    return (dt) => {
      clear(ctx, width, height);
      points.forEach((point) => point.step(dt, width, height));
      hue = (hue + dt * 12) % 360;
      sinceSnapshot += dt;
      if (sinceSnapshot > 0.05) {
        sinceSnapshot = 0;
        history.unshift(points.map((point) => [point.x, point.y]));
        history.length = Math.min(history.length, trail);
      }
      ctx.lineWidth = Math.max(1, width / 800);
      history.forEach((curve, age) => {
        ctx.strokeStyle = `hsla(${hue}, 85%, 50%, ${1 - age / trail})`;
        ctx.beginPath();
        ctx.moveTo(curve[0][0], curve[0][1]);
        ctx.bezierCurveTo(curve[1][0], curve[1][1], curve[2][0], curve[2][1], curve[3][0], curve[3][1]);
        ctx.bezierCurveTo(curve[4][0], curve[4][1], curve[5][0], curve[5][1], curve[6][0], curve[6][1]);
        ctx.stroke();
      });
    };
  });

export default start;
