import { useSyncExternalStore } from 'react';
import { getSettings, updateSettings } from '../../settings/settings';

let online = getSettings().autoConnect;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function isOnline() {
  return online;
}

export function connect(remember: boolean) {
  online = true;
  if (remember) updateSettings({ autoConnect: true });
  emit();
}

export function disconnect() {
  online = false;
  if (getSettings().autoConnect) updateSettings({ autoConnect: false });
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useOnline() {
  return useSyncExternalStore(subscribe, isOnline);
}
