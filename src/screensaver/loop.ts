export type SaverOptions = {
  text3d: string;
  marqueeText: string;
};

export type SaverStart = (canvas: HTMLCanvasElement, options: SaverOptions) => () => void;

export type FrameFn = (dt: number, t: number) => void;

/**
 * Passt die Canvas-Größe an ihr Element an und ruft `setup` bei jeder
 * Größenänderung neu auf. Die zurückgegebene Funktion zeichnet ein Frame.
 */
export function runLoop(
  canvas: HTMLCanvasElement,
  setup: (ctx: CanvasRenderingContext2D, width: number, height: number) => FrameFn,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;
  let width = 0;
  let height = 0;
  let frame: FrameFn | null = null;
  let raf = 0;
  let last = performance.now();
  const start = last;

  const fit = () => {
    const nextWidth = Math.max(1, Math.round(canvas.clientWidth));
    const nextHeight = Math.max(1, Math.round(canvas.clientHeight));
    if (nextWidth === width && nextHeight === height && frame) return;
    width = nextWidth;
    height = nextHeight;
    canvas.width = width;
    canvas.height = height;
    frame = setup(ctx, width, height);
  };

  const tick = (now: number) => {
    fit();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    frame?.(dt, (now - start) / 1000);
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export function clear(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
}

export function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function rgb([r, g, b]: Rgb, factor = 1) {
  const f = (channel: number) => Math.max(0, Math.min(255, Math.round(channel * factor)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/** Punkt, der innerhalb eines Rechtecks hin und her prallt. */
export class Bouncer {
  x: number;
  y: number;
  vx: number;
  vy: number;

  constructor(width: number, height: number, speed: number) {
    this.x = rand(0, width);
    this.y = rand(0, height);
    const angle = rand(0, Math.PI * 2);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  step(dt: number, width: number, height: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < 0 || this.x > width) {
      this.vx *= -1;
      this.x = Math.max(0, Math.min(width, this.x));
    }
    if (this.y < 0 || this.y > height) {
      this.vy *= -1;
      this.y = Math.max(0, Math.min(height, this.y));
    }
  }
}
