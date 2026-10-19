const size = 28;
const center = (size - 1) / 2;

type Pixel = { x: number; y: number; color: string };
type Layer = 'halo' | 'base' | 'cap' | 'icon';

const colors = {
  halo: '#38e8f5',
  outline: '#05151a',
  bezelLight: '#6c7c82',
  bezelMid: '#3c484d',
  bezelDark: '#1d2629',
  well: '#020809',
  face: '#0b2228',
  faceShine: '#14404a',
  icon: '#5ff6ff',
};

function classify(x: number, y: number): { layer: Layer; color: string } | null {
  const dx = x - center;
  const dy = y - center;
  const d = Math.hypot(dx, dy);
  if (d > 13.6) return null;
  if (d > 12.4) return { layer: 'halo', color: colors.halo };
  if (d > 11.4) return { layer: 'base', color: colors.outline };
  if (d > 9.4) {
    const light = (-dx - dy) / (d * Math.SQRT2);
    const color = light > 0.35 ? colors.bezelLight : light < -0.35 ? colors.bezelDark : colors.bezelMid;
    return { layer: 'base', color };
  }
  if (d > 8.4) return { layer: 'base', color: colors.well };

  const inGap = dy < 0 && Math.abs(dx) < 2.6;
  const onRing = d > 4.4 && d < 6.0 && !inGap;
  const onBar = Math.abs(dx) < 1 && y >= 6 && y <= 13;
  if (onRing || onBar) return { layer: 'icon', color: colors.icon };
  const shine = Math.hypot(x - 9, y - 9) < 2.2;
  return { layer: 'cap', color: shine ? colors.faceShine : colors.face };
}

/** Benachbarte gleichfarbige Pixel einer Zeile werden zu einem Rechteck zusammengefasst. */
function runs(pixels: Pixel[]) {
  const rects: Array<Pixel & { w: number }> = [];
  for (const pixel of pixels) {
    const last = rects[rects.length - 1];
    if (last && last.y === pixel.y && last.color === pixel.color && last.x + last.w === pixel.x) last.w += 1;
    else rects.push({ ...pixel, w: 1 });
  }
  return rects;
}

const layers: Record<Layer, Pixel[]> = { halo: [], base: [], cap: [], icon: [] };
for (let y = 0; y < size; y += 1) {
  for (let x = 0; x < size; x += 1) {
    const hit = classify(x, y);
    if (hit) layers[hit.layer].push({ x, y, color: hit.color });
  }
}
const rendered = Object.fromEntries(
  (Object.keys(layers) as Layer[]).map((layer) => [layer, runs(layers[layer])]),
) as Record<Layer, Array<Pixel & { w: number }>>;

const arrow = ['..###..', '..###..', '..###..', '#######', '.#####.', '..###..', '...#...'];

function Rects({ layer }: { layer: Layer }) {
  return (
    <>
      {rendered[layer].map(({ x, y, w, color }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={1} fill={color} />
      ))}
    </>
  );
}

export function PixelPowerButton() {
  return (
    <span className="pb">
      <svg className="pb-arrow" viewBox="0 0 7 7" shapeRendering="crispEdges" aria-hidden>
        {arrow.flatMap((row, y) => [...row].map((cell, x) => (
          cell === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null
        )))}
      </svg>
      <svg className="pb-svg" viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" aria-hidden>
        <g className="pb-halo"><Rects layer="halo" /></g>
        <Rects layer="base" />
        <g className="pb-cap">
          <Rects layer="cap" />
          <g className="pb-icon"><Rects layer="icon" /></g>
        </g>
      </svg>
    </span>
  );
}
