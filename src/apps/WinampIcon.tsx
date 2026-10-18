import { useId } from 'react';

type WinampIconProps = {
  variant?: '32x32_4' | '16x16_4';
  className?: string;
};

export function WinampIcon({ variant = '32x32_4', className }: WinampIconProps) {
  const size = variant === '16x16_4' ? 16 : 32;
  const gradientId = `winamp-bolt-${useId()}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff36b" />
          <stop offset="0.55" stopColor="#f5a623" />
          <stop offset="1" stopColor="#c85a00" />
        </linearGradient>
      </defs>
      <path
        d="M19 1 L5 18 H14 L10 31 L27 12 H17.5 L22 1 Z"
        fill={`url(#${gradientId})`}
        stroke="#3a2200"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M17.5 4 L9 15 H12" fill="none" stroke="#fffbd0" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
