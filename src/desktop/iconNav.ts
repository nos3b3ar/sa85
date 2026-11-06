export type Direction = { dx: number; dy: number };

export const arrowDirections: Record<string, Direction | undefined> = {
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
};

export type PlacedIcon = { id: string; x: number; y: number };

/** Gewählt wird das nächste Symbol in Pfeilrichtung, seitlicher Versatz zählt doppelt. */
export function nextIcon(icons: PlacedIcon[], current: string | null, { dx, dy }: Direction): string | null {
  const from = icons.find((icon) => icon.id === current);
  if (!from) {
    const first = [...icons].sort((a, b) => a.x - b.x || a.y - b.y)[0];
    return first?.id ?? null;
  }
  let best: { id: string; score: number } | null = null;
  for (const icon of icons) {
    if (icon.id === from.id) continue;
    const ahead = (icon.x - from.x) * dx + (icon.y - from.y) * dy;
    if (ahead <= 0) continue;
    const aside = Math.abs((icon.x - from.x) * dy + (icon.y - from.y) * dx);
    const score = ahead + aside * 2;
    if (!best || score < best.score) best = { id: icon.id, score };
  }
  return best?.id ?? null;
}
