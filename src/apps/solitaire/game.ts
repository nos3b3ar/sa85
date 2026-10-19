export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type Card = {
  id: string;
  suit: Suit;
  rank: number;
  faceUp: boolean;
};

export type PileRef =
  | { kind: 'waste' }
  | { kind: 'foundation'; index: number }
  | { kind: 'tableau'; index: number };

export type Game = {
  stock: Card[];
  waste: Card[];
  foundations: Card[][];
  tableau: Card[][];
  drawCount: 1 | 3;
  score: number;
  started: boolean;
};

export const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

export const suitSymbol: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export const rankLabel = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function isRed(suit: Suit) {
  return suit === 'hearts' || suit === 'diamonds';
}

export function deal(drawCount: 1 | 3): Game {
  const deck = suits.flatMap((suit) => Array.from({ length: 13 }, (_, i) => ({
    id: `${suit}-${i + 1}`,
    suit,
    rank: i + 1,
    faceUp: false,
  })));
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const tableau: Card[][] = Array.from({ length: 7 }, () => []);
  for (let round = 0; round < 7; round += 1) {
    for (let column = round; column < 7; column += 1) {
      const card = deck.pop()!;
      tableau[column].push({ ...card, faceUp: column === round });
    }
  }
  return {
    stock: deck,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    drawCount,
    score: 0,
    started: false,
  };
}

function clone(game: Game): Game {
  return {
    ...game,
    stock: [...game.stock],
    waste: [...game.waste],
    foundations: game.foundations.map((pile) => [...pile]),
    tableau: game.tableau.map((pile) => [...pile]),
  };
}

export function drawFromStock(game: Game): Game {
  const next = clone(game);
  next.started = true;
  if (!next.stock.length) {
    if (!next.waste.length) return game;
    next.stock = next.waste.reverse().map((card) => ({ ...card, faceUp: false }));
    next.waste = [];
    if (next.drawCount === 1) next.score = Math.max(0, next.score - 100);
    return next;
  }
  for (let i = 0; i < next.drawCount && next.stock.length; i += 1) {
    next.waste.push({ ...next.stock.pop()!, faceUp: true });
  }
  return next;
}

export function pileCards(game: Game, pile: PileRef) {
  if (pile.kind === 'waste') return game.waste;
  if (pile.kind === 'foundation') return game.foundations[pile.index];
  return game.tableau[pile.index];
}

export function canDrop(game: Game, cards: Card[], target: PileRef) {
  const first = cards[0];
  if (!first) return false;
  if (target.kind === 'waste') return false;
  if (target.kind === 'foundation') {
    if (cards.length !== 1) return false;
    const pile = game.foundations[target.index];
    const top = pile[pile.length - 1];
    return top ? top.suit === first.suit && top.rank === first.rank - 1 : first.rank === 1;
  }
  const pile = game.tableau[target.index];
  const top = pile[pile.length - 1];
  if (!top) return first.rank === 13;
  return top.faceUp && isRed(top.suit) !== isRed(first.suit) && top.rank === first.rank + 1;
}

export function moveCards(game: Game, from: PileRef, count: number, to: PileRef): Game | null {
  const source = pileCards(game, from);
  const cards = source.slice(source.length - count);
  if (!cards.length || !cards.every((card) => card.faceUp) || !canDrop(game, cards, to)) return null;
  if (from.kind === to.kind && 'index' in from && 'index' in to && from.index === to.index) return null;

  const next = clone(game);
  next.started = true;
  const nextSource = pileCards(next, from);
  nextSource.splice(nextSource.length - count, count);
  pileCards(next, to).push(...cards);

  if (from.kind === 'waste' && to.kind === 'tableau') next.score += 5;
  if (to.kind === 'foundation' && from.kind !== 'foundation') next.score += 10;
  if (from.kind === 'foundation' && to.kind === 'tableau') next.score = Math.max(0, next.score - 15);
  return next;
}

export function flipTableau(game: Game, index: number): Game | null {
  const pile = game.tableau[index];
  const top = pile[pile.length - 1];
  if (!top || top.faceUp) return null;
  const next = clone(game);
  next.started = true;
  next.tableau[index][pile.length - 1] = { ...top, faceUp: true };
  next.score += 5;
  return next;
}

export function autoToFoundation(game: Game, from: PileRef): Game | null {
  for (let index = 0; index < 4; index += 1) {
    const moved = moveCards(game, from, 1, { kind: 'foundation', index });
    if (moved) return moved;
  }
  return null;
}

export function bestMove(game: Game, from: PileRef, count: number): Game | null {
  if (count === 1) {
    const toFoundation = autoToFoundation(game, from);
    if (toFoundation) return toFoundation;
  }
  for (let index = 0; index < 7; index += 1) {
    if (from.kind === 'tableau' && from.index === index) continue;
    const moved = moveCards(game, from, count, { kind: 'tableau', index });
    if (moved) return moved;
  }
  return null;
}

export function isWon(game: Game) {
  return game.foundations.every((pile) => pile.length === 13);
}
