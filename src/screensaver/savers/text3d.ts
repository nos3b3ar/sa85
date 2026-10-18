import { clear, runLoop, type SaverStart } from '../loop';

const start: SaverStart = (canvas, options) =>
  runLoop(canvas, (ctx, width, height) => {
    const text = options.text3d.trim() || 'Windows 98';
    const size = Math.min(height * 0.24, (width * 1.3) / Math.max(4, text.length));
    const layers = Math.max(6, Math.round(size * 0.16));

    return (_dt, t) => {
      clear(ctx, width, height);
      const spin = t * 0.85;
      const tilt = Math.sin(t * 0.55) * 0.45;
      const scaleX = Math.cos(spin);
      const scaleY = Math.cos(tilt);
      const stepX = Math.sin(spin) * (size * 0.012);
      const stepY = Math.sin(tilt) * (size * 0.012);
      const x = width / 2 + Math.sin(t * 0.21) * width * 0.18;
      const y = height / 2 + Math.cos(t * 0.29) * height * 0.18;

      ctx.font = `900 ${size}px "Arial Black", "Arial Bold", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let layer = layers; layer > 0; layer -= 1) {
        const shade = 0.35 + (1 - layer / layers) * 0.3;
        ctx.setTransform(scaleX, 0, 0, scaleY, x + stepX * layer, y + stepY * layer);
        ctx.fillStyle = `rgb(${Math.round(190 * shade)},${Math.round(95 * shade)},${Math.round(10 * shade)})`;
        ctx.fillText(text, 0, 0);
      }

      ctx.setTransform(scaleX, 0, 0, scaleY, x, y);
      const face = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
      const light = 0.55 + Math.abs(scaleX) * 0.45;
      face.addColorStop(0, `rgb(255,${Math.round(240 * light)},${Math.round(150 * light)})`);
      face.addColorStop(0.5, `rgb(${Math.round(250 * light)},${Math.round(165 * light)},20)`);
      face.addColorStop(1, `rgb(${Math.round(170 * light)},${Math.round(80 * light)},0)`);
      ctx.fillStyle = face;
      ctx.fillText(text, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };
  });

export default start;
