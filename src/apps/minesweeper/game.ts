export type Level = { id: 'beginner' | 'intermediate' | 'expert'; label: string; cols: number; rows: number; mines: number };

export const levels: Level[] = [
  { id: 'beginner', label: 'Anfänger', cols: 9, rows: 9, mines: 10 },
  { id: 'intermediate', label: 'Fortgeschrittene', cols: 16, rows: 16, mines: 40 },
  { id: 'expert', label: 'Profis', cols: 30, rows: 16, mines: 99 },
];

export type CellMark = 'none' | 'flag' | 'question';

export type Cell = {
  mine: boolean;
  open: boolean;
  mark: CellMark;
  adjacent: number;
};

export type Phase = 'ready' | 'playing' | 'won' | 'lost';

export type Board = {
  level: Level;
  cells: Cell[];
  phase: Phase;
  exploded: number | null;
};

export function createBoard(level: Level): Board {
  return {
    level,
    cells: Array.from({ length: level.cols * level.rows }, () => ({ mine: false, open: false, mark: 'none', adjacent: 0 })),
    phase: 'ready',
    exploded: null,
  };
}

export function neighbors(level: Level, index: number) {
  const col = index % level.cols;
  const row = Math.floor(index / level.cols);
  const result: number[] = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (!dx && !dy) continue;
      const x = col + dx;
      const y = row + dy;
      if (x >= 0 && y >= 0 && x < level.cols && y < level.rows) result.push(y * level.cols + x);
    }
  }
  return result;
}

function placeMines(board: Board, safe: number): Cell[] {
  const { level } = board;
  const forbidden = new Set([safe, ...neighbors(level, safe)]);
  const candidates = board.cells.map((_, index) => index).filter((index) => !forbidden.has(index));
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const mines = new Set(candidates.slice(0, level.mines));
  return board.cells.map((cell, index) => ({
    ...cell,
    mine: mines.has(index),
    adjacent: neighbors(level, index).filter((other) => mines.has(other)).length,
  }));
}

export function reveal(board: Board, index: number): Board {
  if (board.phase === 'won' || board.phase === 'lost') return board;
  let cells = board.phase === 'ready' ? placeMines(board, index) : board.cells.map((cell) => ({ ...cell }));
  const target = cells[index];
  if (target.open || target.mark === 'flag') return board;

  if (target.mine) {
    cells = cells.map((cell) => (cell.mine && cell.mark !== 'flag' ? { ...cell, open: true } : cell));
    return { ...board, cells, phase: 'lost', exploded: index };
  }

  const queue = [index];
  while (queue.length) {
    const current = queue.pop()!;
    const cell = cells[current];
    if (cell.open || cell.mark === 'flag') continue;
    cell.open = true;
    cell.mark = 'none';
    if (cell.adjacent === 0) queue.push(...neighbors(board.level, current).filter((other) => !cells[other].open));
  }

  return settle({ ...board, cells, phase: 'playing' });
}

export function chord(board: Board, index: number): Board {
  const cell = board.cells[index];
  if (board.phase !== 'playing' || !cell.open || cell.adjacent === 0) return board;
  const around = neighbors(board.level, index);
  const flags = around.filter((other) => board.cells[other].mark === 'flag').length;
  if (flags !== cell.adjacent) return board;
  let next = board;
  for (const other of around) {
    if (!next.cells[other].open && next.cells[other].mark !== 'flag') next = reveal(next, other);
    if (next.phase === 'lost') break;
  }
  return next;
}

export function toggleMark(board: Board, index: number, questionMarks: boolean): Board {
  if (board.phase === 'won' || board.phase === 'lost') return board;
  const cell = board.cells[index];
  if (cell.open) return board;
  const order: CellMark[] = questionMarks ? ['none', 'flag', 'question'] : ['none', 'flag'];
  const mark = order[(order.indexOf(cell.mark) + 1) % order.length] ?? 'none';
  const cells = board.cells.map((item, i) => (i === index ? { ...item, mark } : item));
  return { ...board, cells };
}

function settle(board: Board): Board {
  const won = board.cells.every((cell) => cell.mine || cell.open);
  if (!won) return board;
  return {
    ...board,
    phase: 'won',
    cells: board.cells.map((cell) => (cell.mine ? { ...cell, mark: 'flag' } : cell)),
  };
}

export function minesLeft(board: Board) {
  return board.level.mines - board.cells.filter((cell) => cell.mark === 'flag').length;
}
