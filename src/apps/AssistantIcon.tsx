type AssistantIconProps = {
  variant?: '32x32_4' | '16x16_4';
  className?: string;
};

export function AssistantIcon({ variant = '32x32_4', className }: AssistantIconProps) {
  const size = variant === '16x16_4' ? 16 : 32;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden shapeRendering="crispEdges">
      {/* Gelber Notizblock im Hintergrund */}
      <rect x="4" y="5" width="22" height="24" fill="#ffff99" stroke="#000" strokeWidth="1.5" />
      <line x1="7" y1="10" x2="22" y2="10" stroke="#c0c080" strokeWidth="1" />
      <line x1="7" y1="14" x2="22" y2="14" stroke="#c0c080" strokeWidth="1" />
      <line x1="7" y1="18" x2="22" y2="18" stroke="#c0c080" strokeWidth="1" />
      <line x1="7" y1="22" x2="22" y2="22" stroke="#c0c080" strokeWidth="1" />
      {/* Kleiner blauer Zauberhut oben rechts */}
      <polygon points="23,2 18,11 29,11" fill="#000080" stroke="#000" strokeWidth="1" />
      <circle cx="24" cy="8" r="1.2" fill="#ffff00" />
      {/* Büroklammer (Clippy) im Vordergrund */}
      <path
        d="M11 24 V11 C11 7.5 18 7.5 18 11 V23 C18 26.5 9 26.5 9 22 V13 C9 10.5 15 10.5 15 13 V21"
        fill="none"
        stroke="#404060"
        strokeWidth="3"
      />
      <path
        d="M11 24 V11 C11 7.5 18 7.5 18 11 V23 C18 26.5 9 26.5 9 22 V13 C9 10.5 15 10.5 15 13 V21"
        fill="none"
        stroke="#c0c0df"
        strokeWidth="1.4"
      />
      {/* Augen */}
      <circle cx="11" cy="13" r="2.2" fill="#fff" stroke="#000" strokeWidth="0.8" />
      <circle cx="16" cy="13" r="2.2" fill="#fff" stroke="#000" strokeWidth="0.8" />
      <circle cx="11.4" cy="13" r="0.9" fill="#000" />
      <circle cx="16.4" cy="13" r="0.9" fill="#000" />
    </svg>
  );
}
