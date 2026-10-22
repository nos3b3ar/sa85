import type { FriendStatus } from './data';

type FlowerTone = FriendStatus | 'logo';

const tones: Record<FlowerTone, { petal: string; center: string; ring: string }> = {
  logo: { petal: '#f4fff2', center: '#ffe14a', ring: '#0e6a24' },
  online: { petal: '#b8f7a4', center: '#2ea043', ring: '#0e6a24' },
  away: { petal: '#ffe7a3', center: '#e2a000', ring: '#7a5600' },
  na: { petal: '#ffc1c1', center: '#cc2222', ring: '#7a1010' },
  offline: { petal: '#e4e4e4', center: '#9a9a9a', ring: '#555555' },
};

type IcqFlowerProps = {
  size?: number;
  tone?: FlowerTone;
  className?: string;
};

export function IcqFlower({ size = 32, tone = 'logo', className }: IcqFlowerProps) {
  const { petal, center, ring } = tones[tone];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden focusable="false">
      {Array.from({ length: 8 }, (_, index) => (
        <ellipse
          key={index}
          cx="16"
          cy="7.2"
          rx="3.15"
          ry="5.15"
          fill={petal}
          stroke={ring}
          strokeWidth="0.7"
          transform={`rotate(${index * 45} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="4.2" fill={center} stroke={ring} strokeWidth="0.7" />
    </svg>
  );
}
