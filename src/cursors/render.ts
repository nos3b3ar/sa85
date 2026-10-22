import type { CursorRole, CursorScheme, MouseSettings } from '../settings/settings';
import { glyphFrames, staticFrame, type Glyph } from './glyphs';

export type CursorImage = { url: string; x: number; y: number; width: number; height: number };

/** CSS-Variable und Browser-Zeiger als Rückfall je Rolle. */
export const cursorVars: Record<CursorRole, { name: string; fallback: string }> = {
  normal: { name: '--cur-default', fallback: 'default' },
  help: { name: '--cur-help', fallback: 'help' },
  background: { name: '--cur-progress', fallback: 'progress' },
  busy: { name: '--cur-wait', fallback: 'wait' },
  precision: { name: '--cur-crosshair', fallback: 'crosshair' },
  text: { name: '--cur-text', fallback: 'text' },
  unavailable: { name: '--cur-not-allowed', fallback: 'not-allowed' },
  resizeNS: { name: '--cur-ns-resize', fallback: 'ns-resize' },
  resizeEW: { name: '--cur-ew-resize', fallback: 'ew-resize' },
  resizeNWSE: { name: '--cur-nwse-resize', fallback: 'nwse-resize' },
  resizeNESW: { name: '--cur-nesw-resize', fallback: 'nesw-resize' },
  move: { name: '--cur-move', fallback: 'move' },
  link: { name: '--cur-pointer', fallback: 'pointer' },
};

type Palette = { ink: string; fill: string; sand: string };

function invertColor(hex: string) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  if (Number.isNaN(value)) return '#ff7f7f';
  return `#${(0xffffff ^ value).toString(16).padStart(6, '0')}`;
}

function palette(scheme: CursorScheme, desktopColor: string): Palette {
  if (scheme === 'black') return { ink: '#fff', fill: '#000', sand: '#fff' };
  // Echtes XOR können Browser-Zeiger nicht. Die Füllung nimmt deshalb die Gegenfarbe des Desktops an.
  if (scheme === 'inverted') return { ink: '#000', fill: invertColor(desktopColor), sand: '#000' };
  if (scheme === '3d') return { ink: '#000', fill: '#c0c0c0', sand: '#808000' };
  return { ink: '#000', fill: '#fff', sand: '#000' };
}

function colorAt(glyph: Glyph, x: number, y: number, scheme: CursorScheme, colors: Palette) {
  const cell = glyph.grid[y][x];
  if (cell === '#') return colors.ink;
  if (cell === 's') return colors.sand;
  if (cell !== '.') return null;
  if (scheme !== '3d') return colors.fill;
  const isFill = (dx: number, dy: number) => glyph.grid[y + dy]?.[x + dx] === '.';
  if (!isFill(-1, 0) || !isFill(0, -1)) return '#fff';
  if (!isFill(1, 0) || !isFill(0, 1)) return '#808080';
  return colors.fill;
}

const cache = new Map<string, CursorImage>();

export function renderGlyph(glyph: Glyph, scheme: CursorScheme, desktopColor: string): CursorImage {
  const key = `${scheme}|${scheme === 'inverted' ? desktopColor : ''}|${glyph.grid.map((row) => row.join('')).join('/')}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const scale = scheme === 'large' ? 2 : 1;
  const colors = palette(scheme, desktopColor);
  const paths = new Map<string, string>();
  glyph.grid.forEach((row, y) => row.forEach((_, x) => {
    const color = colorAt(glyph, x, y, scheme, colors);
    if (!color) return;
    paths.set(color, `${paths.get(color) ?? ''}M${x} ${y}h1v1h-1z`);
  }));
  const width = glyph.grid[0].length;
  const height = glyph.grid.length;
  const body = [...paths].map(([color, d]) => `<path fill="${color}" d="${d}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${body}</svg>`;
  const image = {
    url: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    x: glyph.hot.x * scale,
    y: glyph.hot.y * scale,
    width: width * scale,
    height: height * scale,
  };
  cache.set(key, image);
  return image;
}

/** Bilder einer Rolle: eigener Zeiger, sonst das Schema. Mehrere Bilder nur bei animierten Sanduhren. */
export function cursorFrames(role: CursorRole, mouse: Pick<MouseSettings, 'scheme' | 'custom'>, desktopColor: string): CursorImage[] {
  const custom = mouse.custom[role];
  if (custom) return [{ url: custom.url, x: custom.x, y: custom.y, width: 32, height: 32 }];
  const frames = glyphFrames[role];
  if (mouse.scheme === 'animated' && frames.length > 1) {
    return frames.map((frame) => renderGlyph(frame, 'standard', desktopColor));
  }
  return [renderGlyph(frames[staticFrame[role] ?? 0], mouse.scheme, desktopColor)];
}

export function cursorValue(image: CursorImage, role: CursorRole) {
  return `url("${image.url}") ${image.x} ${image.y}, ${cursorVars[role].fallback}`;
}
