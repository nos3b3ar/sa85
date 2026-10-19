import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { AlertDialog } from '../../desktop/AlertDialog';
import { MenuBar, type Menu } from '../shared/MenuBar';
import type { AppProps } from '../types';
import {
  autoToFoundation,
  bestMove,
  deal,
  drawFromStock,
  flipTableau,
  isRed,
  isWon,
  moveCards,
  rankLabel,
  suitSymbol,
  type Card,
  type Game,
  type PileRef,
} from './game';
import { PlayingCard } from './PlayingCard';

const boardWidth = 600;
const cardWidth = 71;
const cardHeight = 96;
const topY = 10;
const tableauY = 124;
const downOffset = 6;
const upOffset = 17;
const wasteFan = 14;
const dragThreshold = 3;

const columnX = (column: number) => 12 + column * 84;

type Placed = {
  card: Card;
  x: number;
  y: number;
  z: number;
  pile: PileRef | null;
  depth: number;
  draggable: boolean;
};

type Drag = {
  from: PileRef;
  ids: string[];
  originX: number;
  originY: number;
  pointerX: number;
  pointerY: number;
  dx: number;
  dy: number;
  moved: boolean;
  pointerType: string;
};

export function SolitaireApp({ onClose }: AppProps) {
  const [drawCount, setDrawCount] = useState<1 | 3>(1);
  const [game, setGame] = useState<Game>(() => deal(1));
  const [undo, setUndo] = useState<Game | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [about, setAbout] = useState(false);
  const [view, setView] = useState({ scale: 1, height: 420 });
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const won = isWon(game);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const { width, height } = container.getBoundingClientRect();
      const scale = Math.max(0.45, Math.min(1.6, width / boardWidth));
      setView({ scale, height: height / scale });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!game.started || won) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [game.started, won]);

  const newGame = useCallback((count: 1 | 3 = drawCount) => {
    setDrawCount(count);
    setGame(deal(count));
    setUndo(null);
    setSeconds(0);
    setDrag(null);
    dragRef.current = null;
  }, [drawCount]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'F2') return;
      event.preventDefault();
      newGame();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [newGame]);

  const commit = (next: Game | null) => {
    if (!next) return false;
    setUndo(gameRef.current);
    setGame(next);
    return true;
  };

  const toBoard = (clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left) / view.scale, y: (clientY - rect.top) / view.scale };
  };

  const availableHeight = Math.max(cardHeight, view.height - tableauY - cardHeight - 8);
  const placed = layout(game, availableHeight);
  const byId = new Map(placed.map((item) => [item.card.id, item]));

  const dropTarget = (current: Drag, state: Game): PileRef | null => {
    const lead = byId.get(current.ids[0]);
    if (!lead) return null;
    const rect = { x: lead.x + current.dx, y: lead.y + current.dy };
    const candidates: Array<{ pile: PileRef; x: number; y: number }> = [
      ...state.foundations.map((_, index) => ({ pile: { kind: 'foundation', index } as PileRef, x: columnX(3 + index), y: topY })),
      ...state.tableau.map((pile, index) => {
        const last = pile[pile.length - 1];
        const spot = last ? byId.get(last.id) : null;
        return { pile: { kind: 'tableau', index } as PileRef, x: columnX(index), y: spot ? spot.y : tableauY };
      }),
    ];
    let best: PileRef | null = null;
    let bestArea = 0;
    for (const candidate of candidates) {
      const overlapX = Math.min(rect.x + cardWidth, candidate.x + cardWidth) - Math.max(rect.x, candidate.x);
      const overlapY = Math.min(rect.y + cardHeight, candidate.y + cardHeight) - Math.max(rect.y, candidate.y);
      const area = Math.max(0, overlapX) * Math.max(0, overlapY);
      if (area > bestArea && moveCards(state, current.from, current.ids.length, candidate.pile)) {
        best = candidate.pile;
        bestArea = area;
      }
    }
    return best;
  };

  useEffect(() => {
    if (!drag) return;
    const onMove = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      const point = toBoard(event.clientX, event.clientY);
      const dx = point.x - current.pointerX;
      const dy = point.y - current.pointerY;
      const moved = current.moved || Math.hypot(dx, dy) > dragThreshold;
      const next = { ...current, dx, dy, moved };
      dragRef.current = next;
      setDrag(next);
    };
    const onUp = () => {
      const current = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!current) return;
      const state = gameRef.current;
      if (current.moved) {
        const target = dropTarget(current, state);
        if (target) commit(moveCards(state, current.from, current.ids.length, target));
        return;
      }
      if (current.pointerType !== 'mouse') commit(bestMove(state, current.from, current.ids.length));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  });

  const startDrag = (item: Placed, event: React.PointerEvent<HTMLDivElement>) => {
    if (won || !item.pile || event.button !== 0) return;
    if (item.pile.kind === 'tableau' && !item.card.faceUp) {
      const pile = game.tableau[item.pile.index];
      if (pile[pile.length - 1]?.id === item.card.id) commit(flipTableau(game, item.pile.index));
      return;
    }
    if (!item.draggable) return;
    const pile = item.pile.kind === 'waste'
      ? game.waste
      : item.pile.kind === 'foundation'
        ? game.foundations[item.pile.index]
        : game.tableau[item.pile.index];
    const ids = pile.slice(item.depth).map((card) => card.id);
    const point = toBoard(event.clientX, event.clientY);
    const next: Drag = {
      from: item.pile,
      ids,
      originX: item.x,
      originY: item.y,
      pointerX: point.x,
      pointerY: point.y,
      dx: 0,
      dy: 0,
      moved: false,
      pointerType: event.pointerType,
    };
    dragRef.current = next;
    setDrag(next);
  };

  const onDoubleClick = (item: Placed) => {
    if (won || !item.pile || !item.card.faceUp || item.pile.kind === 'foundation') return;
    const pile = item.pile.kind === 'waste' ? game.waste : game.tableau[item.pile.index];
    if (pile[pile.length - 1]?.id !== item.card.id) return;
    commit(autoToFoundation(game, item.pile));
  };

  useCascade(canvasRef, won, game, view.height);

  const menus: Menu[] = [
    {
      label: 'Spiel',
      entries: [
        { kind: 'item', label: 'Austeilen', shortcut: 'F2', onSelect: () => newGame() },
        { kind: 'separator' },
        {
          kind: 'item',
          label: 'Rückgängig',
          disabled: !undo || won,
          onSelect: () => {
            if (!undo) return;
            setGame(undo);
            setUndo(null);
          },
        },
        { kind: 'separator' },
        { kind: 'item', label: 'Eine Karte ziehen', checked: drawCount === 1, onSelect: () => newGame(1) },
        { kind: 'item', label: 'Drei Karten ziehen', checked: drawCount === 3, onSelect: () => newGame(3) },
        { kind: 'separator' },
        { kind: 'item', label: 'Beenden', onSelect: onClose },
      ],
    },
    {
      label: '?',
      entries: [{ kind: 'item', label: 'Info', onSelect: () => setAbout(true) }],
    },
  ];

  const dragging = drag?.moved ? new Set(drag.ids) : null;

  return (
    <div className="sol">
      <MenuBar menus={menus} />
      <div className="sol-table" ref={containerRef}>
        <div
          className="sol-board"
          ref={boardRef}
          style={{ width: boardWidth, height: view.height, transform: `scale(${view.scale})` }}
        >
          <button
            type="button"
            className="sol-slot is-stock"
            style={{ left: columnX(0), top: topY }}
            aria-label={game.stock.length ? 'Karte ziehen' : 'Stapel neu mischen'}
            onClick={() => !won && commit(drawFromStock(game))}
          >
            {game.stock.length || !game.waste.length ? null : <span className="sol-recycle" />}
          </button>
          {game.foundations.map((_, index) => (
            <div key={index} className="sol-slot" style={{ left: columnX(3 + index), top: topY }} />
          ))}
          {game.tableau.map((_, index) => (
            <div key={index} className="sol-slot is-empty-column" style={{ left: columnX(index), top: tableauY }} />
          ))}
          {won ? null : placed.map((item) => {
            const lifted = dragging?.has(item.card.id) && drag;
            const style: CSSProperties = {
              left: item.x + (lifted ? drag.dx : 0),
              top: item.y + (lifted ? drag.dy : 0),
              zIndex: lifted ? 1000 + item.z : item.z,
            };
            return (
              <PlayingCard
                key={item.card.id}
                card={item.card}
                className={lifted ? 'is-dragging' : item.pile === null ? 'is-stock' : undefined}
                style={style}
                onPointerDown={(event) => {
                  if (item.pile === null) {
                    if (!won && event.button === 0) commit(drawFromStock(game));
                    return;
                  }
                  startDrag(item, event);
                }}
                onDoubleClick={() => onDoubleClick(item)}
              />
            );
          })}
          <canvas
            ref={canvasRef}
            className={won ? 'sol-cascade is-active' : 'sol-cascade'}
            width={boardWidth}
            height={Math.round(view.height)}
            onClick={() => won && newGame()}
          />
        </div>
      </div>
      <div className="status-bar sol-status">
        <span>{won ? 'Gewonnen! Klicken Sie, um neu auszuteilen.' : drawCount === 3 ? 'Drei Karten ziehen' : 'Eine Karte ziehen'}</span>
        <span>Punkte: {game.score} Zeit: {seconds}</span>
      </div>
      {about ? (
        <AlertDialog
          title="Info: Solitär"
          message="Klondike-Solitär für sa85. Karten ziehen und ablegen, Doppelklick legt eine Karte auf die Ablage. Auf Touch-Geräten genügt ein Tippen."
          onClose={() => setAbout(false)}
        />
      ) : null}
    </div>
  );
}

function layout(game: Game, availableHeight: number): Placed[] {
  const placed: Placed[] = [];
  let z = 1;

  const stockVisible = game.stock.slice(-Math.min(3, game.stock.length));
  stockVisible.forEach((card, index) => {
    placed.push({ card, x: columnX(0) + index * 2, y: topY + index, z: z++, pile: null, depth: 0, draggable: false });
  });

  const fanStart = game.drawCount === 3 ? Math.max(0, game.waste.length - 3) : game.waste.length;
  game.waste.forEach((card, index) => {
    const fanIndex = Math.max(0, index - fanStart);
    placed.push({
      card,
      x: columnX(1) + fanIndex * wasteFan,
      y: topY,
      z: z++,
      pile: { kind: 'waste' },
      depth: index,
      draggable: index === game.waste.length - 1,
    });
  });

  game.foundations.forEach((pile, foundation) => {
    pile.forEach((card, index) => {
      placed.push({
        card,
        x: columnX(3 + foundation),
        y: topY,
        z: z++,
        pile: { kind: 'foundation', index: foundation },
        depth: index,
        draggable: index === pile.length - 1,
      });
    });
  });

  game.tableau.forEach((pile, column) => {
    const needed = pile.slice(0, -1).reduce((sum, card) => sum + (card.faceUp ? upOffset : downOffset), 0);
    const squeeze = needed > availableHeight ? availableHeight / needed : 1;
    let y = tableauY;
    pile.forEach((card, index) => {
      placed.push({
        card,
        x: columnX(column),
        y,
        z: 100 + z++,
        pile: { kind: 'tableau', index: column },
        depth: index,
        draggable: card.faceUp,
      });
      y += (card.faceUp ? upOffset : downOffset) * squeeze;
    });
  });

  return placed;
}

function useCascade(canvasRef: React.RefObject<HTMLCanvasElement>, active: boolean, game: Game, height: number) {
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!active || !canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const piles = gameRef.current.foundations.map((pile) => [...pile]);
    piles.forEach((pile, index) => drawCanvasCard(ctx, pile[pile.length - 1], columnX(3 + index), topY));

    let rank = 13;
    let foundation = 0;
    let flying: { card: Card; x: number; y: number; vx: number; vy: number } | null = null;
    let frame = 0;
    const floor = canvas.height - cardHeight;

    const launch = () => {
      if (rank < 1) return false;
      const pile = piles[foundation];
      const card = pile.pop();
      if (card) {
        const below = pile[pile.length - 1];
        const slotX = columnX(3 + foundation);
        if (below) drawCanvasCard(ctx, below, slotX, topY);
        else {
          ctx.fillStyle = '#008000';
          ctx.fillRect(slotX, topY, cardWidth, cardHeight);
        }
        const direction = Math.random() < 0.5 ? -1 : 1;
        flying = { card, x: slotX, y: topY, vx: direction * (2 + Math.random() * 4), vy: -Math.random() * 6 };
      }
      foundation += 1;
      if (foundation > 3) {
        foundation = 0;
        rank -= 1;
      }
      return true;
    };

    const tick = () => {
      if (!flying && !launch()) return;
      const card = flying;
      if (card) {
        card.x += card.vx;
        card.vy += 0.55;
        card.y += card.vy;
        if (card.y > floor) {
          card.y = floor;
          card.vy = -card.vy * 0.78;
        }
        drawCanvasCard(ctx, card.card, card.x, card.y);
        if (card.x < -cardWidth || card.x > canvas.width) flying = null;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, canvasRef, height]);
}

function drawCanvasCard(ctx: CanvasRenderingContext2D, card: Card | undefined, x: number, y: number) {
  if (!card) return;
  const color = isRed(card.suit) ? '#d00000' : '#000';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + 0.5, y + 0.5, cardWidth - 1, cardHeight - 1, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(rankLabel[card.rank], x + 4, y + 4);
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText(suitSymbol[card.suit], x + 4, y + 18);
  ctx.font = '34px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(suitSymbol[card.suit], x + cardWidth / 2, y + cardHeight / 2 + 2);
  ctx.textAlign = 'start';
}
