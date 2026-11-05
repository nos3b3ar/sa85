import { PixelIcon } from './shared/PixelIcon';

type IcqIconProps = {
  variant?: '32x32_4' | '16x16_4';
  className?: string;
};

const palette = ['#000000', '#1f8f16', '#3fd12a', '#a6f27c', '#c4160f', '#ff3b2b', '#ffe21a', '#ffffff'];

function petal(index: number) {
  const red = index === 5;
  const fill = red ? '#d81e14' : '#3fd12a';
  const shine = red ? '#ff5a46' : '#a6f27c';
  return `<g transform="rotate(${index * 45} 32 32)">
    <ellipse cx="32" cy="13" rx="7.4" ry="11.4" fill="${fill}" stroke="#000" stroke-width="3.4"/>
    <ellipse cx="29.6" cy="10.4" rx="2.2" ry="5" fill="${shine}"/>
  </g>`;
}

const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  ${Array.from({ length: 8 }, (_, index) => petal(index)).join('')}
  <circle cx="32" cy="32" r="8.6" fill="#ffe21a" stroke="#000" stroke-width="3"/>
</svg>`;

export function IcqIcon({ variant = '32x32_4', className }: IcqIconProps) {
  return <PixelIcon svg={logo} size={variant === '16x16_4' ? 16 : 32} palette={palette} className={className} />;
}
