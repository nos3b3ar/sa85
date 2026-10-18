import { clear, runLoop, type SaverStart } from '../loop';

const start: SaverStart = (canvas, options) =>
  runLoop(canvas, (ctx, width, height) => {
    const text = options.marqueeText.trim() || ' ';
    const size = Math.max(10, Math.round(height * 0.075));
    ctx.font = `700 ${size}px "Times New Roman", Times, serif`;
    const textWidth = ctx.measureText(text).width;
    let x = width;
    let y = randomLine();

    function randomLine() {
      return size + Math.random() * Math.max(1, height - size * 2);
    }

    return (dt) => {
      clear(ctx, width, height);
      x -= dt * Math.max(80, width * 0.18);
      if (x < -textWidth) {
        x = width;
        y = randomLine();
      }
      ctx.font = `700 ${size}px "Times New Roman", Times, serif`;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ff2020';
      ctx.fillText(text, x, y);
    };
  });

export default start;
