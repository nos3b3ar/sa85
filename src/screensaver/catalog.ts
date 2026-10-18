import type { SaverId } from '../settings/settings';
import type { SaverStart } from './loop';

export type SaverDef = {
  id: Exclude<SaverId, 'none'>;
  name: string;
  textOption?: 'saverText3d' | 'saverMarqueeText';
  load: () => Promise<{ default: SaverStart }>;
};

export const savers: SaverDef[] = [
  { id: 'pipes', name: '3D-Röhren', load: () => import('./savers/pipes') },
  { id: 'starfield', name: 'Starfield-Simulation', load: () => import('./savers/starfield') },
  { id: 'text3d', name: '3D-Text', textOption: 'saverText3d', load: () => import('./savers/text3d') },
  { id: 'bezier', name: 'Bezier', load: () => import('./savers/bezier') },
  { id: 'marquee', name: 'Marquee', textOption: 'saverMarqueeText', load: () => import('./savers/marquee') },
  { id: 'mystify', name: 'Mystify', load: () => import('./savers/mystify') },
  { id: 'buckett', name: '3D Buckett', load: () => import('./savers/buckett') },
  { id: 'flyingWindows', name: 'Flying Windows', load: () => import('./savers/flyingWindows') },
  { id: 'maze', name: '3D-Labyrinth', load: () => import('./savers/maze') },
  { id: 'objects3d', name: '3D-Objekte', load: () => import('./savers/objects3d') },
];

export function getSaver(id: SaverId) {
  return savers.find((saver) => saver.id === id);
}
