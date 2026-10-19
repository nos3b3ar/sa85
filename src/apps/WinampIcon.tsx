type WinampIconProps = {
  variant?: '32x32_4' | '16x16_4';
  className?: string;
};

export function WinampIcon({ variant = '32x32_4', className }: WinampIconProps) {
  const size = variant === '16x16_4' ? 16 : 32;
  return <img src="/img/winamp.svg" width={size} height={size} className={className} alt="" aria-hidden draggable={false} />;
}
