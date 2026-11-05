import { useSyncExternalStore } from 'react';
import type { Status } from './data';

/** Was ICQ im Infobereich der Taskleiste zeigt; null, solange ICQ nicht angemeldet ist. */
export type IcqTrayState = { status: Status; unread: boolean } | null;

let state: IcqTrayState = null;
const listeners = new Set<() => void>();

export function setIcqTray(next: IcqTrayState) {
  if (state === next || (state && next && state.status === next.status && state.unread === next.unread)) return;
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIcqTray() {
  return useSyncExternalStore(subscribe, () => state);
}
