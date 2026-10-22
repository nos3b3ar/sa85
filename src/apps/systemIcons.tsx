import { Main100 } from '@react95/icons/Main100';
import { Wab321019 } from '@react95/icons/Wab321019';
import type { ComponentType } from 'react';
import type { IconVariant } from './registry';

type LargeOnlyIcon = ComponentType<{ variant?: '32x32_4'; width?: number; height?: number }>;

/** Einige Symbole gibt es nur in 32x32. Für Titelleiste und Taskleiste werden sie verkleinert. */
function withSmallVariant(Icon: LargeOnlyIcon) {
  return function SystemIcon({ variant }: { variant?: IconVariant }) {
    return variant === '16x16_4' ? <Icon variant="32x32_4" width={16} height={16} /> : <Icon variant="32x32_4" />;
  };
}

export const MouseIcon = withSmallVariant(Main100);
export const UsersIcon = withSmallVariant(Wab321019);
