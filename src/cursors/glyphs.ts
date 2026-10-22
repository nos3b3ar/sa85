import type { CursorRole } from '../settings/settings';

/**
 * Pixelraster der Windows-98-Zeiger.
 * '#' Kontur, '.' Füllung, 's' Sand der Sanduhr, ' ' durchsichtig.
 */
export type Grid = string[][];
export type Glyph = { grid: Grid; hot: { x: number; y: number } };

function parse(rows: string[]): Grid {
  const width = Math.max(...rows.map((row) => row.length));
  return rows.map((row) => row.padEnd(width, ' ').split(''));
}

function blank(width: number, height: number): Grid {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => ' '));
}

const isInk = (cell: string | undefined) => cell === '#' || cell === 's';

/** Weißer Rand um schwarze Striche, damit Zeiger wie Textcursor auf jedem Hintergrund sichtbar bleiben. */
function withHalo(glyph: Glyph): Glyph {
  const src = glyph.grid;
  const grid = blank(src[0].length + 2, src.length + 2);
  src.forEach((row, y) => row.forEach((cell, x) => {
    grid[y + 1][x + 1] = cell;
  }));
  const out = grid.map((row) => [...row]);
  grid.forEach((row, y) => row.forEach((cell, x) => {
    if (cell !== ' ') return;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (isInk(grid[y + dy]?.[x + dx])) out[y][x] = '.';
      }
    }
  }));
  return { grid: out, hot: { x: glyph.hot.x + 1, y: glyph.hot.y + 1 } };
}

/** Aus einer Fläche ('x') wird Füllung mit schwarzer Kontur. */
function fromMask(rows: string[], hot: { x: number; y: number }): Glyph {
  const src = parse(rows);
  const grid = blank(src[0].length + 2, src.length + 2);
  src.forEach((row, y) => row.forEach((cell, x) => {
    if (cell === 'x') grid[y + 1][x + 1] = '.';
  }));
  const out = grid.map((row) => [...row]);
  grid.forEach((row, y) => row.forEach((cell, x) => {
    if (cell !== ' ') return;
    const near = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => grid[y + dy]?.[x + dx] === '.');
    if (near) out[y][x] = '#';
  }));
  return { grid: out, hot: { x: hot.x + 1, y: hot.y + 1 } };
}

function overlay(base: Glyph, top: Glyph, dx: number, dy: number): Glyph {
  const width = Math.max(base.grid[0].length, dx + top.grid[0].length);
  const height = Math.max(base.grid.length, dy + top.grid.length);
  const grid = blank(width, height);
  base.grid.forEach((row, y) => row.forEach((cell, x) => {
    grid[y][x] = cell;
  }));
  top.grid.forEach((row, y) => row.forEach((cell, x) => {
    if (cell !== ' ') grid[y + dy][x + dx] = cell;
  }));
  return { grid, hot: base.hot };
}

function transpose(glyph: Glyph): Glyph {
  const { grid } = glyph;
  return {
    grid: grid[0].map((_, x) => grid.map((row) => row[x])),
    hot: { x: glyph.hot.y, y: glyph.hot.x },
  };
}

function mirror(glyph: Glyph): Glyph {
  const width = glyph.grid[0].length;
  return { grid: glyph.grid.map((row) => [...row].reverse()), hot: { x: width - 1 - glyph.hot.x, y: glyph.hot.y } };
}

const arrow: Glyph = {
  grid: parse([
    '#',
    '##',
    '#.#',
    '#..#',
    '#...#',
    '#....#',
    '#.....#',
    '#......#',
    '#.......#',
    '#........#',
    '#.....#####',
    '#..#..#',
    '#.#.#..#',
    '##  #..#',
    '#    #..#',
    '     #..#',
    '      #..#',
    '      #..#',
    '       ##',
  ]),
  hot: { x: 0, y: 0 },
};

const question = withHalo({
  grid: parse([
    ' ##### ',
    '##   ##',
    '##   ##',
    '    ## ',
    '   ##  ',
    '   ##  ',
    '       ',
    '   ##  ',
    '   ##  ',
  ]),
  hot: { x: 0, y: 0 },
});

/** Sanduhr mit Sand oben ab Zeile topFrom und unten ab Zeile bottomFrom. */
function hourglass(topFrom: number, bottomFrom: number): Glyph {
  const grid = parse([
    '###########',
    '#.........#',
    '###########',
    ' #.......# ',
    ' #.......# ',
    ' #.......# ',
    ' ##.....## ',
    '  ##...##  ',
    '   ##.##   ',
    '   ##.##   ',
    '  ##...##  ',
    ' ##.....## ',
    ' #.......# ',
    ' #.......# ',
    ' #.......# ',
    '###########',
    '#.........#',
    '###########',
  ]);
  for (let y = 3; y <= 14; y += 1) {
    const sand = y <= 8 ? y >= topFrom : y >= bottomFrom;
    const stream = y >= 9 && y < bottomFrom && topFrom <= 8;
    grid[y].forEach((cell, x) => {
      if (cell !== '.') return;
      if (sand || (stream && x === 5)) grid[y][x] = 's';
    });
  }
  return { grid, hot: { x: 5, y: 9 } };
}

const smallHourglassFrames: Glyph[] = [
  ['#######', ' #sss# ', '  #s#  ', '  #.#  ', ' #...# ', ' #...# ', '#######'],
  ['#######', ' #...# ', '  #s#  ', '  #s#  ', ' #.s.# ', ' #sss# ', '#######'],
  ['#######', ' #...# ', '  #.#  ', '  #.#  ', ' #sss# ', ' #sss# ', '#######'],
].map((rows) => ({ grid: parse(rows), hot: { x: 0, y: 0 } }));

const busyFrames = [
  hourglass(4, 15),
  hourglass(5, 14),
  hourglass(6, 13),
  hourglass(7, 12),
  hourglass(8, 11),
];

const precision = (() => {
  const grid = blank(21, 21);
  for (let i = 0; i < 21; i += 1) {
    if (i >= 9 && i <= 11) continue;
    grid[i][10] = '#';
    grid[10][i] = '#';
  }
  return withHalo({ grid, hot: { x: 10, y: 10 } });
})();

const text = withHalo({
  grid: parse([
    '### ###',
    ...Array.from({ length: 15 }, () => '   #   '),
    '### ###',
  ]),
  hot: { x: 3, y: 8 },
});

const unavailable = (() => {
  const grid = blank(19, 19);
  for (let y = 0; y < 19; y += 1) {
    for (let x = 0; x < 19; x += 1) {
      const distance = Math.hypot(x - 9, y - 9);
      const ring = distance >= 6.4 && distance <= 9.2;
      const slash = distance < 7 && Math.abs(x - y) <= 1;
      if (ring || slash) grid[y][x] = '#';
    }
  }
  return withHalo({ grid, hot: { x: 9, y: 9 } });
})();

const resizeNS = withHalo({
  grid: parse([
    '   #   ',
    '  ###  ',
    ' ##### ',
    '#######',
    ...Array.from({ length: 7 }, () => '   #   '),
    '#######',
    ' ##### ',
    '  ###  ',
    '   #   ',
  ]),
  hot: { x: 3, y: 7 },
});

const resizeNWSE = withHalo({
  grid: parse([
    '#####',
    '####',
    '###',
    '## #',
    '#   #',
    '     #',
    '      #   #',
    '       # ##',
    '        ###',
    '       ####',
    '      #####',
  ]),
  hot: { x: 5, y: 5 },
});

const move = withHalo({
  grid: parse([
    '       #',
    '      ###',
    '     #####',
    '       #',
    '       #',
    '  #    #    #',
    ' ##    #    ##',
    '###############',
    ' ##    #    ##',
    '  #    #    #',
    '       #',
    '       #',
    '     #####',
    '      ###',
    '       #',
  ]),
  hot: { x: 7, y: 7 },
});

const link = fromMask([
  '    xx         ',
  '    xx         ',
  '    xx         ',
  '    xx         ',
  '    xx xx      ',
  '    xx xx xx   ',
  '    xx xx xx xx',
  'x   xx xx xx xx',
  'xx  xxxxxxxxxxx',
  'xxx xxxxxxxxxxx',
  ' xxxxxxxxxxxxxx',
  '  xxxxxxxxxxxxx',
  '  xxxxxxxxxxxx ',
  '   xxxxxxxxxxx ',
  '   xxxxxxxxxx  ',
  '    xxxxxxxxx  ',
  '    xxxxxxxxx  ',
], { x: 4, y: 0 });

/** Erstes Bild jeder Rolle, für das Schema "Animierte Sanduhren" auch alle weiteren. */
export const glyphFrames: Record<CursorRole, Glyph[]> = {
  normal: [arrow],
  help: [overlay(arrow, question, 11, 0)],
  background: smallHourglassFrames.map((frame) => overlay(arrow, frame, 12, 9)),
  busy: busyFrames,
  precision: [precision],
  text: [text],
  unavailable: [unavailable],
  resizeNS: [resizeNS],
  resizeEW: [transpose(resizeNS)],
  resizeNWSE: [resizeNWSE],
  resizeNESW: [mirror(resizeNWSE)],
  move: [move],
  link: [link],
};

/** Ruhendes Bild: Die Sanduhr zeigt laufenden Sand wie im Original. */
export const staticFrame: Partial<Record<CursorRole, number>> = { busy: 1, background: 1 };
