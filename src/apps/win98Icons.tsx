import type { ComponentType } from 'react';
import { Computer } from '@react95/icons/Computer';
import { Desktop } from '@react95/icons/Desktop';
import { Folder } from '@react95/icons/Folder';
import { Ie } from '@react95/icons/Ie';
import { RecycleEmpty } from '@react95/icons/RecycleEmpty';
import { RecycleFull } from '@react95/icons/RecycleFull';
import { useSettings } from '../settings/settings';
import computer32 from '../assets/win98/my-computer.png';
import computer16 from '../assets/win98/my-computer-16.png';
import desktop32 from '../assets/win98/show-desktop.png';
import desktop16 from '../assets/win98/show-desktop-16.png';
import folder32 from '../assets/win98/folder.png';
import folder16 from '../assets/win98/folder-16.png';
import ie32 from '../assets/win98/internet-explorer.png';
import ie16 from '../assets/win98/internet-explorer-16.png';
import recycle32 from '../assets/win98/recycle-bin.png';
import recycle16 from '../assets/win98/recycle-bin-16.png';
import recycleFull32 from '../assets/win98/recycle-bin-full.png';
import recycleFull16 from '../assets/win98/recycle-bin-full-16.png';

type Variant = '32x32_4' | '16x16_4';

type Fallback = ComponentType<{ variant?: Variant }>;

/** Win98-Symbol aus src/assets/win98, im Win95-Look das react95-Original. */
function lookIcon(large: string, small: string, Fallback: Fallback) {
  return function Win98Icon({ variant = '32x32_4' }: { variant?: Variant }) {
    const { look } = useSettings();
    if (look !== '98') return <Fallback variant={variant} />;
    const size = variant === '16x16_4' ? 16 : 32;
    return (
      <img
        src={size === 16 ? small : large}
        width={size}
        height={size}
        alt=""
        aria-hidden
        draggable={false}
        style={{ imageRendering: 'pixelated' }}
      />
    );
  };
}

export const ComputerIcon = lookIcon(computer32, computer16, Computer);
export const FolderIcon = lookIcon(folder32, folder16, Folder);
export const IeIcon = lookIcon(ie32, ie16, Ie);
const RecycleEmptyIcon = lookIcon(recycle32, recycle16, RecycleEmpty);
const RecycleFullIcon = lookIcon(recycleFull32, recycleFull16, RecycleFull);

export function RecycleIcon({ variant }: { variant?: Variant }) {
  const { recycled } = useSettings();
  return recycled.length > 0 ? <RecycleFullIcon variant={variant} /> : <RecycleEmptyIcon variant={variant} />;
}
export const ShowDesktopIcon = lookIcon(desktop32, desktop16, Desktop);
