import { PixelIcon } from './shared/PixelIcon';

type NapsterIconProps = {
  variant?: '32x32_4' | '16x16_4';
  className?: string;
};

const palette = ['#000000', '#0b1f6e', '#1c46c8', '#4f86f0', '#ffffff', '#c8d0dc', '#6f7f8f', '#3a8f5a'];

const kitty = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M8 34 A24 24 0 0 1 56 34" fill="none" stroke="#0b1f6e" stroke-width="7"/>
  <path d="M8 34 A24 24 0 0 1 56 34" fill="none" stroke="#4f86f0" stroke-width="3"/>
  <circle cx="32" cy="36" r="23" fill="#1c46c8" stroke="#0b1f6e" stroke-width="3"/>
  <ellipse cx="26" cy="27" rx="12" ry="8" fill="#4f86f0" opacity="0.8"/>
  <path d="M17 50 L15 22 L25 31 Q32 28 39 31 L49 22 L47 50 Q32 58 17 50 Z" fill="#fff" stroke="#000" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="M21 38 L29 40 L21 42 Z" fill="#3a8f5a" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M43 38 L35 40 L43 42 Z" fill="#3a8f5a" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M30 46 L34 46 L32 49 Z" fill="#000"/>
  <path d="M25 50 Q32 54 39 50" fill="none" stroke="#6f7f8f" stroke-width="1.6"/>
  <rect x="3" y="30" width="9" height="16" rx="3" fill="#0b1f6e" stroke="#000" stroke-width="2"/>
  <rect x="52" y="30" width="9" height="16" rx="3" fill="#0b1f6e" stroke="#000" stroke-width="2"/>
</svg>`;

export function NapsterIcon({ variant = '32x32_4', className }: NapsterIconProps) {
  return <PixelIcon svg={kitty} size={variant === '16x16_4' ? 16 : 32} palette={palette} className={className} />;
}
