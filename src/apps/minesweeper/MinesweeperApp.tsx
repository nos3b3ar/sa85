import { useEffect, useRef, useState } from 'react';
import { AlertDialog } from '../../desktop/AlertDialog';
import { MenuBar, type Menu } from '../shared/MenuBar';
import { SegmentDisplay } from '../shared/SegmentDisplay';
import type { AppProps } from '../types';
import { chord, createBoard, levels, minesLeft, reveal, toggleMark, type Board, type Level } from './game';

const longPressMs = 420;

export function MinesweeperApp({ onClose }: AppProps) {
  const [level, setLevel] = useState<Level>(levels[0]);
  const [board, setBoard] = useState<Board>(() => createBoard(levels[0]));
  const [questionMarks, setQuestionMarks] = useState(true);
  const [pressing, setPressing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [about, setAbout] = useState(false);
  const longPress = useRef<{ timer: number; fired: boolean } | null>(null);

  const newGame = (next: Level = level) => {
    setLevel(next);
    setBoard(createBoard(next));
    setSeconds(0);
  };

  useEffect(() => {
    if (board.phase !== 'playing') return;
    const timer = window.setInterval(() => setSeconds((value) => Math.min(999, value + 1)), 1000);
    return () => window.clearInterval(timer);
  }, [board.phase]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'F2') return;
      event.preventDefault();
      newGame();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const open = (index: number) => {
    setBoard((current) => {
      const cell = current.cells[index];
      const next = cell.open ? chord(current, index) : reveal(current, index);
      if (current.phase === 'ready' && next.phase !== 'ready') setSeconds(1);
      return next;
    });
  };

  const mark = (index: number) => setBoard((current) => toggleMark(current, index, questionMarks));

  const menus: Menu[] = [
    {
      label: 'Spiel',
      entries: [
        { kind: 'item', label: 'Neu', shortcut: 'F2', onSelect: () => newGame() },
        { kind: 'separator' },
        ...levels.map((item) => ({
          kind: 'item' as const,
          label: item.label,
          checked: item.id === level.id,
          onSelect: () => newGame(item),
        })),
        { kind: 'separator' },
        { kind: 'item', label: 'Marker (?)', checked: questionMarks, onSelect: () => setQuestionMarks((on) => !on) },
        { kind: 'separator' },
        { kind: 'item', label: 'Beenden', onSelect: onClose },
      ],
    },
    {
      label: '?',
      entries: [{ kind: 'item', label: 'Info', onSelect: () => setAbout(true) }],
    },
  ];

  const face = board.phase === 'lost' ? 'dead' : board.phase === 'won' ? 'cool' : pressing ? 'oh' : 'smile';
  const finished = board.phase === 'won' || board.phase === 'lost';

  return (
    <div className="mines">
      <MenuBar menus={menus} />
      <div className="mines-body">
        <div className="mines-panel">
          <SegmentDisplay className="mines-led" value={ledValue(minesLeft(board))} on="#ff0000" off="#400000" label="Verbleibende Minen" />
          <button type="button" className="mines-face" aria-label="Neues Spiel" onClick={() => newGame()}>
            <Smiley face={face} />
          </button>
          <SegmentDisplay className="mines-led" value={ledValue(seconds)} on="#ff0000" off="#400000" label="Zeit" />
        </div>
        <div
          className="mines-grid"
          style={{ gridTemplateColumns: `repeat(${level.cols}, 16px)` }}
          onContextMenu={(event) => event.preventDefault()}
          onPointerLeave={() => setPressing(false)}
        >
          {board.cells.map((cell, index) => {
            const wrongFlag = board.phase === 'lost' && cell.mark === 'flag' && !cell.mine;
            const className = [
              'mines-cell',
              cell.open || wrongFlag ? 'is-open' : '',
              board.exploded === index ? 'is-exploded' : '',
              cell.open && !cell.mine && cell.adjacent ? `n${cell.adjacent}` : '',
            ].filter(Boolean).join(' ');
            return (
              <button
                key={index}
                type="button"
                className={className}
                aria-label={cellLabel(index, level.cols)}
                disabled={finished && !cell.open && !wrongFlag && !cell.mark}
                onPointerDown={(event) => {
                  if (finished) return;
                  if (event.button === 2) {
                    mark(index);
                    return;
                  }
                  if (event.button !== 0) return;
                  setPressing(true);
                  if (event.pointerType !== 'mouse') {
                    const state = { fired: false, timer: 0 };
                    state.timer = window.setTimeout(() => {
                      state.fired = true;
                      setPressing(false);
                      mark(index);
                    }, longPressMs);
                    longPress.current = state;
                  }
                }}
                onPointerUp={(event) => {
                  if (event.button !== 0) return;
                  setPressing(false);
                  const press = longPress.current;
                  longPress.current = null;
                  if (press) {
                    window.clearTimeout(press.timer);
                    if (press.fired) return;
                  }
                  if (!finished) open(index);
                }}
                onPointerCancel={() => {
                  setPressing(false);
                  if (longPress.current) window.clearTimeout(longPress.current.timer);
                  longPress.current = null;
                }}
              >
                <CellContent board={board} index={index} wrongFlag={wrongFlag} />
              </button>
            );
          })}
        </div>
      </div>
      {about ? (
        <AlertDialog
          title="Info: Minesweeper"
          message="Minesweeper für Andernach85. Linksklick deckt auf, Rechtsklick (oder lange drücken) setzt eine Flagge. Klick auf eine Zahl deckt die Nachbarn auf, wenn alle Flaggen gesetzt sind."
          onClose={() => setAbout(false)}
        />
      ) : null}
    </div>
  );
}

function CellContent({ board, index, wrongFlag }: { board: Board; index: number; wrongFlag: boolean }) {
  const cell = board.cells[index];
  if (wrongFlag) return <MineGlyph crossed />;
  if (!cell.open) {
    if (cell.mark === 'flag') return <FlagGlyph />;
    if (cell.mark === 'question') return <span className="mines-question">?</span>;
    return null;
  }
  if (cell.mine) return <MineGlyph />;
  return cell.adjacent ? <span>{cell.adjacent}</span> : null;
}

function MineGlyph({ crossed = false }: { crossed?: boolean }) {
  return (
    <svg viewBox="0 0 13 13" className="mines-glyph" aria-hidden="true">
      <path d="M6 0h1v2H6zM6 11h1v2H6zM0 6h2v1H0zM11 6h2v1h-2zM2 2h1v1H2zM10 2h1v1h-1zM2 10h1v1H2zM10 10h1v1h-1z" fill="#000" />
      <circle cx="6.5" cy="6.5" r="4.2" fill="#000" />
      <rect x="4" y="4" width="2" height="2" fill="#fff" />
      {crossed ? <path d="M1 1l11 11M12 1L1 12" stroke="#f00" strokeWidth="1.4" /> : null}
    </svg>
  );
}

function FlagGlyph() {
  return (
    <svg viewBox="0 0 12 12" className="mines-glyph" aria-hidden="true">
      <polygon points="7,1 7,6 2,3.5" fill="#f00" />
      <rect x="6.5" y="1" width="1" height="7" fill="#000" />
      <rect x="4" y="8" width="5" height="1.5" fill="#000" />
      <rect x="2.5" y="9.5" width="8" height="1.5" fill="#000" />
    </svg>
  );
}

function Smiley({ face }: { face: 'smile' | 'oh' | 'dead' | 'cool' }) {
  return (
    <svg viewBox="0 0 17 17" className="mines-smiley" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="7.5" fill="#ff0" stroke="#000" strokeWidth="1" />
      {face === 'dead' ? (
        <path d="M4.5 5l2 2M6.5 5l-2 2M10.5 5l2 2M12.5 5l-2 2" stroke="#000" strokeWidth="1" />
      ) : face === 'cool' ? (
        <path d="M3 5.5h11v1l-1.5 1.5h-2L9 6.5H8L6.5 8h-2L3 6.5z" fill="#000" />
      ) : (
        <>
          <rect x="5" y="5" width="2" height="2" fill="#000" />
          <rect x="10" y="5" width="2" height="2" fill="#000" />
        </>
      )}
      {face === 'oh' ? (
        <circle cx="8.5" cy="11.5" r="1.8" fill="none" stroke="#000" strokeWidth="1" />
      ) : face === 'dead' ? (
        <path d="M5 12.5q3.5-3 7 0" fill="none" stroke="#000" strokeWidth="1" />
      ) : (
        <path d="M5 10.5q3.5 3 7 0" fill="none" stroke="#000" strokeWidth="1" />
      )}
    </svg>
  );
}

function ledValue(value: number) {
  if (value < 0) return `-${String(Math.min(99, -value)).padStart(2, '0')}`;
  return String(Math.min(999, value)).padStart(3, '0');
}

function cellLabel(index: number, cols: number) {
  return `Feld ${Math.floor(index / cols) + 1}/${(index % cols) + 1}`;
}
