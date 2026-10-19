import type { CSSProperties, PointerEventHandler, MouseEventHandler } from 'react';
import { isRed, rankLabel, suitSymbol, type Card } from './game';

const L = 22;
const C = 50;
const R = 78;

const pipLayouts: Record<number, Array<[number, number]>> = {
  1: [[C, 50]],
  2: [[C, 0], [C, 100]],
  3: [[C, 0], [C, 50], [C, 100]],
  4: [[L, 0], [R, 0], [L, 100], [R, 100]],
  5: [[L, 0], [R, 0], [C, 50], [L, 100], [R, 100]],
  6: [[L, 0], [R, 0], [L, 50], [R, 50], [L, 100], [R, 100]],
  7: [[L, 0], [R, 0], [C, 25], [L, 50], [R, 50], [L, 100], [R, 100]],
  8: [[L, 0], [R, 0], [C, 25], [L, 50], [R, 50], [C, 75], [L, 100], [R, 100]],
  9: [[L, 0], [R, 0], [L, 33], [R, 33], [C, 50], [L, 67], [R, 67], [L, 100], [R, 100]],
  10: [[L, 0], [R, 0], [C, 17], [L, 33], [R, 33], [L, 67], [R, 67], [C, 83], [L, 100], [R, 100]],
};

type PlayingCardProps = {
  card: Card;
  style?: CSSProperties;
  className?: string;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
  onDoubleClick?: MouseEventHandler<HTMLDivElement>;
};

export function PlayingCard({ card, style, className, onPointerDown, onDoubleClick }: PlayingCardProps) {
  if (!card.faceUp) {
    return (
      <div
        className={['sol-card', 'is-back', className].filter(Boolean).join(' ')}
        style={style}
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
        aria-label="Verdeckte Karte"
      />
    );
  }

  const symbol = suitSymbol[card.suit];
  const label = rankLabel[card.rank];
  const pips = pipLayouts[card.rank];

  return (
    <div
      className={['sol-card', isRed(card.suit) ? 'is-red' : 'is-black', className].filter(Boolean).join(' ')}
      style={style}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      aria-label={`${label} ${symbol}`}
    >
      <span className="sol-corner">
        <b>{label}</b>
        <i>{symbol}</i>
      </span>
      <span className="sol-corner is-bottom">
        <b>{label}</b>
        <i>{symbol}</i>
      </span>
      {pips ? (
        <span className={card.rank === 1 ? 'sol-pips is-ace' : 'sol-pips'}>
          {pips.map(([x, y], index) => (
            <i key={index} className={y > 50 ? 'is-flipped' : undefined} style={{ left: `${x}%`, top: `${y}%` }}>
              {symbol}
            </i>
          ))}
        </span>
      ) : (
        <span className="sol-face">
          <b>{label}</b>
          <i>{symbol}</i>
        </span>
      )}
    </div>
  );
}
