type NetscapeIconProps = {
  variant?: '32x32_4' | '16x16_4';
  className?: string;
};

export function NetscapeWindowIcon({ className }: NetscapeIconProps) {
  return <img src="/img/netscape/window.png" width={16} height={16} alt="" className={className} draggable={false} />;
}

export function NetscapeIcon({ variant = '32x32_4', className }: NetscapeIconProps) {
  const size = variant === '16x16_4' ? 16 : 32;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden shapeRendering="crispEdges">
      <rect x="1" y="1" width="30" height="30" fill="#000080" />
      <rect x="1" y="1" width="30" height="30" fill="none" stroke="#000" strokeWidth="2" />
      <circle cx="25" cy="7" r="1.2" fill="#fff" />
      <circle cx="7" cy="25" r="0.9" fill="#9cf" />
      <path d="M2 20 L30 12 L30 15 L2 23 Z" fill="#008080" />
      <path d="M8 26 V6 H12 L20 19 V6 H24 V26 H20 L12 13 V26 Z" fill="#fff" stroke="#000" strokeWidth="0.8" />
    </svg>
  );
}
