import type { Rgb } from './loop';

type ClothOptions = {
  cx: number;
  cy: number;
  size: number;
  t: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  wave: number;
  colorAt: (u: number, v: number) => Rgb;
};

const resolution = 15;
const light = normalize([0.3, -0.5, -1]);

/** Zeichnet ein wehendes Tuch als schattiertes Dreiecksnetz (Maleralgorithmus). */
export function drawCloth(ctx: CanvasRenderingContext2D, options: ClothOptions) {
  const { cx, cy, size, t, rotX, rotY, rotZ, wave, colorAt } = options;
  const n = resolution;
  const world: Array<[number, number, number]> = [];
  const screen: Array<[number, number]> = [];

  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      const u = (i / (n - 1)) * 2 - 1;
      const v = (j / (n - 1)) * 2 - 1;
      const z = (Math.sin(u * 2.6 + t * 3.1) * 0.16 + Math.cos(v * 1.9 + t * 2.3) * 0.08) * wave * ((u + 1) / 2 + 0.25);
      const p = rotate([u, v, z], rotX, rotY, rotZ);
      world.push(p);
      const scale = (size * 2.4) / (p[2] + 2.6);
      screen.push([cx + p[0] * scale, cy + p[1] * scale]);
    }
  }

  const quads: Array<{ depth: number; i: number; j: number; shade: number }> = [];
  for (let j = 0; j < n - 1; j += 1) {
    for (let i = 0; i < n - 1; i += 1) {
      const a = world[j * n + i];
      const b = world[j * n + i + 1];
      const c = world[(j + 1) * n + i];
      const d = world[(j + 1) * n + i + 1];
      const normal = normalize(cross(sub(b, a), sub(c, a)));
      const shade = 0.25 + 0.75 * Math.abs(dot(normal, light));
      quads.push({ depth: (a[2] + b[2] + c[2] + d[2]) / 4, i, j, shade });
    }
  }
  quads.sort((left, right) => right.depth - left.depth);

  for (const quad of quads) {
    const { i, j, shade } = quad;
    const [r, g, b] = colorAt((i + 0.5) / (n - 1), (j + 0.5) / (n - 1));
    const color = `rgb(${Math.round(r * shade)},${Math.round(g * shade)},${Math.round(b * shade)})`;
    const p1 = screen[j * n + i];
    const p2 = screen[j * n + i + 1];
    const p3 = screen[(j + 1) * n + i + 1];
    const p4 = screen[(j + 1) * n + i];
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.lineTo(p3[0], p3[1]);
    ctx.lineTo(p4[0], p4[1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

type V3 = [number, number, number];

function rotate([x, y, z]: V3, rx: number, ry: number, rz: number): V3 {
  const y1 = y * Math.cos(rx) - z * Math.sin(rx);
  const z1 = y * Math.sin(rx) + z * Math.cos(rx);
  const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
  const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
  const x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz);
  const y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);
  return [x3, y3, z2];
}

function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot(a: V3, b: V3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize(a: V3): V3 {
  const length = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
}
