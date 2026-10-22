import { IcqFlower } from './icq/IcqFlower';

type IcqIconProps = {
  variant?: '32x32_4' | '16x16_4';
  className?: string;
};

export function IcqIcon({ variant = '32x32_4', className }: IcqIconProps) {
  const size = variant === '16x16_4' ? 16 : 32;
  return <IcqFlower size={size} className={className} />;
}
