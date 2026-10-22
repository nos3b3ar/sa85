export type IconPoint = {
  x: number;
  y: number;
};

export const iconCell = { width: 90, height: 88 };
const pad = 6;
const taskbarHeight = 40;

/** Linke Spalte, von oben nach unten. Die rechte Spalte bleibt für Papierkorb und die Rechtstexte frei. */
const columnOrder = ['computer', 'about', 'skills', 'portfolio', 'linkedin', 'contact', 'icq', 'ie', 'winamp', 'msdos', 'games'];

function metrics() {
  const width = window.innerWidth;
  const height = Math.max(iconCell.height, window.innerHeight - taskbarHeight);
  const cols = Math.max(1, Math.floor((width - pad) / iconCell.width));
  const rows = Math.max(1, Math.floor((height - pad) / iconCell.height));
  return { cols, rows };
}

export function cellPosition(col: number, row: number): IconPoint {
  const { cols, rows } = metrics();
  return {
    x: pad + Math.min(Math.max(0, col), cols - 1) * iconCell.width,
    y: pad + Math.min(Math.max(0, row), rows - 1) * iconCell.height,
  };
}

export function defaultIconPosition(id: string): IconPoint {
  const { cols, rows } = metrics();
  if (id === 'recycle') return cellPosition(cols - 1, 0);
  if (id === 'datenschutz') return cellPosition(cols - 1, rows - 1);
  if (id === 'impressum') return cellPosition(cols - 2, rows - 1);
  const index = Math.max(0, columnOrder.indexOf(id));
  const usableCols = Math.max(1, cols - 1);
  const col = Math.min(Math.floor(index / rows), usableCols - 1);
  const row = index % rows;
  return cellPosition(col, row);
}

export function snapIconPosition(point: IconPoint): IconPoint {
  const { cols, rows } = metrics();
  const col = Math.round((point.x - pad) / iconCell.width);
  const row = Math.round((point.y - pad) / iconCell.height);
  return cellPosition(Math.min(Math.max(0, col), cols - 1), Math.min(Math.max(0, row), rows - 1));
}
