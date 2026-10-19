type SaForceIconProps = {
  variant?: '32x32_4' | '16x16_4';
  className?: string;
};

export function SaForceIcon({ variant = '32x32_4', className }: SaForceIconProps) {
  const size = variant === '16x16_4' ? 16 : 32;
  return (
    <img
      src="/img/saforce.png"
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'pixelated' }}
      alt=""
      aria-hidden
      draggable={false}
    />
  );
}
