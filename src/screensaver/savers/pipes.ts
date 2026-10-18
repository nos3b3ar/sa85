import { clear, hexToRgb, rand, rgb, runLoop, type Rgb, type SaverStart } from '../loop';

type Vec = [number, number, number];
type Pipe = { pos: Vec; dir: number; color: Rgb; alive: boolean };

const grid = 11;
const directions: Vec[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const palette = ['#d02020', '#20b030', '#2850e0', '#e0c020', '#20c0c0', '#c030c0', '#d8d8d8', '#e07818'];
const stepSeconds = 0.045;
const maxSegments = 520;

const start: SaverStart = (canvas) =>
  runLoop(canvas, (ctx, width, height) => {
    let occupied = new Set<string>();
    let pipes: Pipe[] = [];
    let segments = 0;
    let spawned = 0;
    let acc = 0;
    let resetIn = 0;
    let yaw = 0;
    let pitch = 0;
    const focal = Math.min(width, height) * 1.25;
    const distance = grid * 1.55;
    const radius = 0.22;

    const key = (p: Vec) => p.join(',');
    const inside = (p: Vec) => p.every((value) => value >= 0 && value < grid);

    const reset = () => {
      clear(ctx, width, height);
      occupied = new Set();
      pipes = [];
      segments = 0;
      spawned = 0;
      yaw = rand(-0.6, 0.6);
      pitch = rand(-0.4, 0.4);
    };

    const project = ([x, y, z]: Vec) => {
      const cx = x - grid / 2 + 0.5;
      const cy = y - grid / 2 + 0.5;
      const cz = z - grid / 2 + 0.5;
      const x1 = cx * Math.cos(yaw) - cz * Math.sin(yaw);
      const z1 = cx * Math.sin(yaw) + cz * Math.cos(yaw);
      const y1 = cy * Math.cos(pitch) - z1 * Math.sin(pitch);
      const z2 = cy * Math.sin(pitch) + z1 * Math.cos(pitch) + distance;
      const scale = focal / z2;
      return { x: width / 2 + x1 * scale, y: height / 2 + y1 * scale, scale };
    };

    const spawn = () => {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const pos: Vec = [0, 1, 2].map(() => Math.floor(rand(0, grid))) as Vec;
        if (occupied.has(key(pos))) continue;
        occupied.add(key(pos));
        const color = hexToRgb(palette[spawned % palette.length]);
        spawned += 1;
        pipes.push({ pos, dir: Math.floor(rand(0, 6)), color, alive: true });
        drawBall(pos, color);
        return true;
      }
      return false;
    };

    const drawBall = (pos: Vec, color: Rgb) => {
      const p = project(pos);
      const r = radius * 1.35 * p.scale;
      const gradient = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
      gradient.addColorStop(0, rgb(color, 1.8));
      gradient.addColorStop(0.45, rgb(color));
      gradient.addColorStop(1, rgb(color, 0.35));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawSegment = (from: Vec, to: Vec, color: Rgb) => {
      const a = project(from);
      const b = project(to);
      const r = radius * ((a.scale + b.scale) / 2);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy) || 1;
      const nx = -dy / length;
      const ny = dx / length;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const gradient = ctx.createLinearGradient(mx - nx * r, my - ny * r, mx + nx * r, my + ny * r);
      gradient.addColorStop(0, rgb(color, 0.3));
      gradient.addColorStop(0.3, rgb(color));
      gradient.addColorStop(0.45, rgb(color, 1.7));
      gradient.addColorStop(0.65, rgb(color));
      gradient.addColorStop(1, rgb(color, 0.3));
      ctx.strokeStyle = gradient;
      ctx.lineWidth = r * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    const advance = (pipe: Pipe) => {
      const options = directions
        .map((_, index) => index)
        .filter((index) => {
          const next = add(pipe.pos, directions[index]);
          return inside(next) && !occupied.has(key(next));
        });
      if (options.length === 0) {
        pipe.alive = false;
        return;
      }
      let dir = pipe.dir;
      if (!options.includes(dir) || Math.random() < 0.22) {
        dir = options[Math.floor(rand(0, options.length))];
      }
      if (dir !== pipe.dir) drawBall(pipe.pos, pipe.color);
      const next = add(pipe.pos, directions[dir]);
      drawSegment(pipe.pos, next, pipe.color);
      occupied.add(key(next));
      pipe.pos = next;
      pipe.dir = dir;
      segments += 1;
    };

    reset();

    return (dt) => {
      if (resetIn > 0) {
        resetIn -= dt;
        if (resetIn <= 0) reset();
        return;
      }
      acc += dt;
      while (acc >= stepSeconds) {
        acc -= stepSeconds;
        if (pipes.filter((pipe) => pipe.alive).length < 2 && !spawn()) {
          resetIn = 2.5;
          return;
        }
        pipes.filter((pipe) => pipe.alive).forEach(advance);
        if (segments > maxSegments) {
          resetIn = 2.5;
          return;
        }
      }
    };
  });

function add(a: Vec, b: Vec): Vec {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export default start;
