import { getSettings, updateSettings } from '../settings/settings';
import type { IconPoint } from './iconLayout';

export const recycleBinId = 'recycle';

export function canRecycle(id: string) {
  return id !== recycleBinId;
}

export function recycleApp(id: string) {
  const { recycled } = getSettings();
  if (!canRecycle(id) || recycled.includes(id)) return;
  updateSettings({ recycled: [...recycled, id] });
}

/** Ohne Position landet das Symbol wieder dort, wo es vor dem Löschen lag. */
export function restoreApp(id: string, position?: IconPoint) {
  const { recycled, iconPositions } = getSettings();
  updateSettings({
    recycled: recycled.filter((item) => item !== id),
    ...(position ? { iconPositions: { ...iconPositions, [id]: position } } : {}),
  });
}
