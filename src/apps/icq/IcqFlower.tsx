import type { Status } from './data';

type FlowerTone = Status | 'logo';

const green = '#39c22a';
const red = '#e3261d';
const yellow = '#ffe21a';

type IcqFlowerProps = {
  size?: number;
  tone?: FlowerTone;
  /** Welches der acht Blätter rot ist, im Uhrzeigersinn ab oben. */
  redIndex?: number;
  className?: string;
};

function Petals({ fill, accent, redIndex }: { fill: string; accent?: string; redIndex: number }) {
  return (
    <>
      {Array.from({ length: 8 }, (_, index) => (
        <ellipse
          key={index}
          cx="16"
          cy="7"
          rx="3.6"
          ry="5.6"
          fill={index === redIndex && accent ? accent : fill}
          stroke="#000"
          strokeWidth="1.3"
          transform={`rotate(${index * 45} 16 16)`}
        />
      ))}
    </>
  );
}

function Badge({ tone }: { tone: Status }) {
  switch (tone) {
    case 'ffc':
      return (
        <g>
          <circle cx="16" cy="16" r="6" fill={yellow} stroke="#000" strokeWidth="1.2" />
          <circle cx="13.8" cy="14.6" r="1" fill="#000" />
          <circle cx="18.2" cy="14.6" r="1" fill="#000" />
          <path d="M12.6 17.4 Q16 21 19.4 17.4" fill="none" stroke="#000" strokeWidth="1.2" />
        </g>
      );
    case 'away':
      return (
        <g>
          <path d="M17 18 L30 15 L31 28 L18 31 Z" fill="#fff" stroke="#000" strokeWidth="1.2" />
          <path d="M20 21.5 L28 19.6 M20.4 25 L28.4 23.1" stroke="#808080" strokeWidth="1.2" />
        </g>
      );
    case 'na':
      return (
        <g>
          <rect x="2" y="9" width="28" height="14" rx="5" fill="#fff" stroke={red} strokeWidth="2.4" />
          <text x="16" y="20" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="Arial, sans-serif" fill={red}>N/A</text>
        </g>
      );
    case 'occupied':
      return (
        <g>
          <circle cx="24" cy="24" r="7" fill={red} stroke="#000" strokeWidth="1.2" />
          <path d="M24 19.5 V25.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="24" cy="28.4" r="1.3" fill="#fff" />
        </g>
      );
    case 'dnd':
      return (
        <g>
          <circle cx="24" cy="24" r="7" fill={red} stroke="#000" strokeWidth="1.2" />
          <path d="M21 21 L27 27 M27 21 L21 27" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    case 'invisible':
      return (
        <g>
          <path d="M5 16 Q16 6 27 16 Q16 26 5 16 Z" fill="#fff" stroke="#000" strokeWidth="1.4" />
          <circle cx="16" cy="16" r="4" fill="#000" />
          <circle cx="17.3" cy="14.7" r="1.2" fill="#fff" />
        </g>
      );
    default:
      return null;
  }
}

/** Nachrichtensymbol von ICQ 2001b: gelber Zettel mit Klammer, blinkt bei ungelesenen Nachrichten. */
export function IcqMessageIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className} aria-hidden focusable="false" shapeRendering="crispEdges">
      <rect x="0.5" y="5.5" width="15" height="9" fill="#ffff9c" stroke="#000" />
      <rect x="1" y="6" width="14" height="1" fill="#fff" />
      <rect x="6.5" y="1.5" width="3" height="6" fill="#1a2a6c" stroke="#000" />
      <rect x="7" y="2" width="1" height="4" fill="#6f86d8" />
      <rect x="2" y="9" width="4" height="1" fill="#000" />
      <rect x="10" y="9" width="4" height="1" fill="#000" />
      <rect x="2" y="11" width="3" height="1" fill="#000" />
      <rect x="6" y="11" width="3" height="1" fill="#000" />
      <rect x="10" y="11" width="4" height="1" fill="#000" />
    </svg>
  );
}

/** ICQ-2001b-Blume: grün mit einem roten Blatt, rot wenn offline, mit Abzeichen für die übrigen Status. */
export function IcqFlower({ size = 32, tone = 'logo', redIndex = 5, className }: IcqFlowerProps) {
  const offline = tone === 'offline';
  const faded = tone === 'na' || tone === 'invisible';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden focusable="false">
      <g opacity={faded ? 0.55 : 1}>
        <Petals fill={offline ? red : green} accent={offline ? undefined : red} redIndex={redIndex} />
        <circle cx="16" cy="16" r="4.6" fill={yellow} stroke="#000" strokeWidth="1.2" />
      </g>
      {tone === 'logo' || tone === 'online' || tone === 'offline' ? null : <Badge tone={tone} />}
    </svg>
  );
}
