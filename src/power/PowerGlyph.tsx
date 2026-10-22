import type { BatteryInfo } from './battery';

/** Infobereich-Symbol im Stil der Windows-98-Energieanzeige: Stecker im Netzbetrieb, sonst Akku mit Füllstand. */
export function PowerGlyph({ info }: { info: BatteryInfo | null }) {
  if (!info || !info.present) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden>
        <path d="M5 1h1v4H5zM10 1h1v4h-1z" fill="#000" />
        <path d="M3 5h10v4h-1v2h-1v1H9v3H7v-3H5v-1H4V9H3z" fill="#000" />
        <path d="M4 6h8v2h-1v2h-1v1H6v-1H5V8H4z" fill="#c0c0c0" />
        <path d="M4 6h8v1H4z" fill="#fff" />
      </svg>
    );
  }
  const filled = Math.round(info.level * 10);
  const color = info.level <= 0.1 ? '#ff0000' : info.level <= 0.25 ? '#ffff00' : '#00ff00';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden>
      <path d="M6 1h4v2H6z" fill="#000" />
      <path d="M4 3h8v12H4z" fill="#000" />
      <path d="M5 4h6v10H5z" fill="#fff" />
      <rect x="5" y={14 - filled} width="6" height={filled} fill={color} />
      {info.charging ? <path d="M9 5 6 9h2l-1 4 3-5H8z" fill="#000" /> : null}
    </svg>
  );
}
