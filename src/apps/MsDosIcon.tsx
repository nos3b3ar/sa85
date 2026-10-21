export function MsDosIcon({ variant = '32x32_4' }: { variant?: '32x32_4' | '16x16_4' }) {
  const size = variant === '16x16_4' ? 16 : 32;
  return (
    <img
      src={`/img/ms-dos-${size}.png`}
      srcSet={`/img/ms-dos-${size * 2}.png 2x`}
      width={size}
      height={size}
      alt=""
      draggable={false}
    />
  );
}
