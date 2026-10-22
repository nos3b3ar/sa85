import { useSyncExternalStore } from 'react';

type BatteryManager = EventTarget & {
  charging: boolean;
  level: number;
  chargingTime: number;
  dischargingTime: number;
};

export type BatteryInfo = {
  charging: boolean;
  /** 0 bis 1 */
  level: number;
  /** Sekunden, Infinity wenn unbekannt */
  chargingTime: number;
  dischargingTime: number;
  /** Desktop-PCs melden einen vollen Akku ohne Entladezeit, obwohl keiner verbaut ist. */
  present: boolean;
};

export type BatteryState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'unsupported' }
  | { status: 'ready'; info: BatteryInfo };

let state: BatteryState = { status: 'idle' };
let manager: BatteryManager | null = null;
const listeners = new Set<() => void>();

function emit(next: BatteryState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function read(battery: BatteryManager): BatteryInfo {
  const present = !(battery.charging && battery.level === 1 && battery.chargingTime === 0 && battery.dischargingTime === Infinity);
  return {
    charging: battery.charging,
    level: battery.level,
    chargingTime: battery.chargingTime,
    dischargingTime: battery.dischargingTime,
    present,
  };
}

/** navigator.getBattery() braucht keine Berechtigung, gibt es aber nur in Chromium-Browsern. */
export async function queryBattery() {
  const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
  if (typeof nav.getBattery !== 'function') {
    emit({ status: 'unsupported' });
    return;
  }
  if (manager) {
    emit({ status: 'ready', info: read(manager) });
    return;
  }
  emit({ status: 'loading' });
  try {
    const battery = await nav.getBattery();
    manager = battery;
    const update = () => emit({ status: 'ready', info: read(battery) });
    for (const name of ['chargingchange', 'levelchange', 'chargingtimechange', 'dischargingtimechange']) {
      battery.addEventListener(name, update);
    }
    update();
  } catch {
    emit({ status: 'unsupported' });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useBattery() {
  return useSyncExternalStore(subscribe, () => state);
}
