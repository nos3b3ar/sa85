import { useEffect, useState } from 'react';

type Rgb = [number, number, number];

const cache = new Map<string, Promise<string>>();

function hex(color: string): Rgb {
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function nearest(palette: Rgb[], r: number, g: number, b: number) {
  let best = palette[0];
  let distance = Infinity;
  for (const color of palette) {
    const d = (color[0] - r) ** 2 + (color[1] - g) ** 2 + (color[2] - b) ** 2;
    if (d < distance) {
      distance = d;
      best = color;
    }
  }
  return best;
}

/** Rendert ein SVG in ein kleines Raster und rundet jedes Pixel auf eine Palette, damit es wie ein echtes 4-Bit-Symbol aussieht. */
function rasterize(svg: string, size: number, palette?: string[]) {
  const key = `${size}|${palette?.join() ?? 'full'}|${svg}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const task = new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('no canvas'));
      ctx.drawImage(image, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size);
      const colors = palette?.map(hex);
      for (let index = 0; index < data.data.length; index += 4) {
        const alpha = data.data[index + 3];
        if (alpha < 120) {
          data.data[index + 3] = 0;
          continue;
        }
        // Halbtransparente Kantenpixel gegen Weiß gemischt, sonst kippen sie zu dunkel.
        const mix = (channel: number) => Math.round((channel * alpha + 255 * (255 - alpha)) / 255);
        const mixed: Rgb = [mix(data.data[index]), mix(data.data[index + 1]), mix(data.data[index + 2])];
        const [r, g, b] = colors ? nearest(colors, ...mixed) : mixed;
        data.data[index] = r;
        data.data[index + 1] = g;
        data.data[index + 2] = b;
        data.data[index + 3] = 255;
      }
      ctx.putImageData(data, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = reject;
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  cache.set(key, task);
  return task;
}

type PixelIconProps = {
  svg: string;
  /** Rastergröße in Pixeln; angezeigt wird in derselben Größe, auf Retina also mit sichtbaren Blöcken. */
  size: number;
  /** Ohne Palette bleiben die Farben erhalten, nur die Kanten werden hart. */
  palette?: string[];
  className?: string;
};

export function PixelIcon({ svg, size, palette, className }: PixelIconProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    rasterize(svg, size, palette)
      .then((url) => alive && setSrc(url))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [svg, size, palette]);

  return src ? (
    <img src={src} width={size} height={size} className={className} alt="" aria-hidden draggable={false} style={{ imageRendering: 'pixelated' }} />
  ) : (
    <span className={className} style={{ display: 'inline-block', width: size, height: size }} aria-hidden />
  );
}
