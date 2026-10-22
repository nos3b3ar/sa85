import { useSyncExternalStore } from 'react';
import { machine } from './bootScript';

export const bootDevices = [
  'Floppy',
  'LS120',
  'HDD-0',
  'SCSI',
  'CDROM',
  'HDD-1',
  'ZIP100',
  'USB-ZIP',
  'USB-HDD',
  'LAN',
  'Disabled',
] as const;

export type BootDevice = (typeof bootDevices)[number];
export type UsbDevice = 'USB-HDD' | 'USB-ZIP';

export const quantumModel = 'QUANTUM FIREBALL CR6.4A';

/** Optimierte Werte (LOAD SETUP DEFAULTS); damit startet auch ein Erstbesucher. */
export const setupDefaults: Record<string, string> = {
  primaryMaster: 'Auto',
  hddModel: machine.hddModel,
  hddMode: 'LBA',
  primarySlave: 'None',
  secondaryMaster: 'Auto',
  secondarySlave: 'Auto',
  driveA: machine.driveA,
  driveB: machine.driveB,
  floppy3Mode: 'Disabled',
  video: machine.display,
  haltOn: 'All Errors',

  virusWarning: 'Disabled',
  internalCache: 'Enabled',
  externalCache: 'Enabled',
  l2Ecc: 'Enabled',
  quickPost: 'Enabled',
  firstBoot: 'HDD-0',
  secondBoot: 'CDROM',
  thirdBoot: 'Floppy',
  swapFloppy: 'Disabled',
  floppySeek: 'Disabled',
  numLock: 'On',
  gateA20: 'Fast',
  typematic: 'Disabled',
  typematicRate: '6',
  typematicDelay: '250',
  securityOption: 'Setup',
  setupPrompt: 'Enabled',
  summaryScreen: 'Enabled',
  paletteSnoop: 'Disabled',
  osSelect: 'Non-OS2',
  smart: 'Disabled',
  reportNoFdd: 'No',
  videoShadow: 'Enabled',
  shadowC8: 'Disabled',
  shadowCC: 'Disabled',
  shadowD0: 'Disabled',
  shadowD4: 'Disabled',
  shadowD8: 'Disabled',
  shadowDC: 'Disabled',

  rasToCas: '3',
  rasPrecharge: '3',
  casLatency: '3',
  sdramPrecharge: 'Disabled',
  dramIntegrity: 'Non-ECC',
  biosCacheable: 'Enabled',
  videoBiosCacheable: 'Enabled',
  videoRamCacheable: 'Enabled',
  io8Recovery: '1',
  io16Recovery: '1',
  memoryHole: 'Disabled',
  passiveRelease: 'Enabled',
  delayedTransaction: 'Enabled',
  agpAperture: '64',
  cpuWarningTemp: 'Disabled',

  acpi: 'Enabled',
  powerManagement: 'User Define',
  pmByApm: 'Yes',
  videoOffMethod: 'DPMS',
  videoOffAfter: 'Standby',
  modemIrq: '3',
  dozeMode: 'Disable',
  standbyMode: 'Disable',
  suspendMode: 'Disable',
  hddPowerDown: 'Disable',
  throttle: '62.5%',
  softOff: 'Instant-Off',
  resumeByRing: 'Disabled',
  resumeByAlarm: 'Disabled',
  wakeIrq: 'Enabled',
  wakeIde0: 'Enabled',
  wakeIde1: 'Enabled',
  wakeFloppy: 'Enabled',
  wakeSerial: 'Enabled',
  wakeParallel: 'Disabled',

  pnpOs: 'No',
  resources: 'Auto',
  resetConfig: 'Disabled',
  irqUsb: 'Enabled',
  irqVga: 'Enabled',
  irq3: 'Legacy ISA',
  irq4: 'Legacy ISA',
  irq5: 'PCI/ISA PnP',
  irq7: 'Legacy ISA',
  irq9: 'PCI/ISA PnP',
  irq10: 'PCI/ISA PnP',
  irq11: 'PCI/ISA PnP',
  irq12: 'PCI/ISA PnP',
  irq14: 'Legacy ISA',
  irq15: 'Legacy ISA',
  dma0: 'PCI/ISA PnP',
  dma1: 'PCI/ISA PnP',
  dma3: 'PCI/ISA PnP',
  ideMap: 'PCI-AUTO',

  ideBlockMode: 'Enabled',
  primaryPio: 'Auto',
  primaryUdma: 'Auto',
  onchipPrimaryIde: 'Enabled',
  onchipSecondaryIde: 'Enabled',
  usbController: 'Enabled',
  usbKeyboard: 'Disabled',
  initDisplay: 'AGP',
  powerOnFunction: 'Button Only',
  kbcClock: '8 MHz',
  onboardFdc: 'Enabled',
  serial1: '3F8/IRQ4',
  serial2: '2F8/IRQ3',
  uartMode: 'Standard',
  parallelPort: '378/IRQ7',
  parallelMode: 'SPP',

  color: '0',
  multiBoot: 'Disabled',
};

/** Fail-Safe-Werte (LOAD BIOS DEFAULTS): konservativ, aber weiterhin von HDD-0 bootfähig. */
export const biosDefaults: Record<string, string> = {
  ...setupDefaults,
  internalCache: 'Disabled',
  externalCache: 'Disabled',
  l2Ecc: 'Disabled',
  quickPost: 'Disabled',
  gateA20: 'Normal',
  rasToCas: '3',
  rasPrecharge: '3',
  casLatency: '3',
  biosCacheable: 'Disabled',
  videoBiosCacheable: 'Disabled',
  videoRamCacheable: 'Disabled',
  io8Recovery: '4',
  io16Recovery: '4',
  passiveRelease: 'Disabled',
  delayedTransaction: 'Disabled',
  powerManagement: 'Disabled',
  acpi: 'Disabled',
  primaryUdma: 'Disabled',
  ideBlockMode: 'Disabled',
};

export type Cmos = {
  values: Record<string, string>;
  supervisorPassword: string;
  userPassword: string;
  /** Minuten, um die die Setup-Uhr von der Browserzeit abweicht. */
  clockOffsetMinutes: number;
  /** Virus Warning wurde eingeschaltet und meldet sich beim nächsten Windows-Start einmal. */
  virusWarningPending: boolean;
};

const storageKey = 'sa85-cmos';
const writingKey = 'sa85-cmos-writing';
const saveDelayMs = 350;

export function defaultCmos(values = setupDefaults): Cmos {
  return {
    values: { ...values },
    supervisorPassword: '',
    userPassword: '',
    clockOffsetMinutes: 0,
    virusWarningPending: false,
  };
}

/** Wie das Award-CMOS: eine 16-Bit-Summe über den Inhalt. */
function checksum(text: string) {
  let sum = 0;
  for (let index = 0; index < text.length; index += 1) sum = (sum + text.charCodeAt(index) * (index % 7 + 1)) & 0xffff;
  return sum;
}

let checksumError = false;
let current: Cmos = load();
const listeners = new Set<() => void>();

function load(): Cmos {
  try {
    // Ein beim Speichern unterbrochener Schreibvorgang hinterlässt ein ungültiges CMOS.
    const interrupted = window.localStorage.getItem(writingKey) === '1';
    const raw = window.localStorage.getItem(storageKey);
    if (interrupted) {
      window.localStorage.removeItem(writingKey);
      checksumError = true;
      return defaultCmos();
    }
    if (!raw) return defaultCmos();
    const stored = JSON.parse(raw) as { data?: string; sum?: number };
    if (typeof stored.data !== 'string' || checksum(stored.data) !== stored.sum) {
      checksumError = true;
      return defaultCmos();
    }
    const data = JSON.parse(stored.data) as Partial<Cmos>;
    const values: Record<string, string> = { ...setupDefaults };
    for (const [key, value] of Object.entries(data.values ?? {})) {
      if (key in setupDefaults && typeof value === 'string') values[key] = value;
    }
    return {
      values,
      supervisorPassword: typeof data.supervisorPassword === 'string' ? data.supervisorPassword : '',
      userPassword: typeof data.userPassword === 'string' ? data.userPassword : '',
      clockOffsetMinutes: Number.isFinite(data.clockOffsetMinutes) ? Number(data.clockOffsetMinutes) : 0,
      virusWarningPending: data.virusWarningPending === true,
    };
  } catch {
    checksumError = true;
    return defaultCmos();
  }
}

function persist(cmos: Cmos) {
  const data = JSON.stringify(cmos);
  window.localStorage.setItem(storageKey, JSON.stringify({ data, sum: checksum(data) }));
}

function publish(next: Cmos) {
  current = next;
  listeners.forEach((listener) => listener());
}

export function getCmos() {
  return current;
}

/** SAVE to CMOS: das Schreiben dauert einen Moment; wer dabei die Seite schließt, erzeugt einen CMOS-Checksum-Fehler. */
export function saveCmos(next: Cmos) {
  const enablesVirusWarning = next.values.virusWarning === 'Enabled' && current.values.virusWarning !== 'Enabled';
  const saved = { ...next, virusWarningPending: next.values.virusWarning === 'Enabled' && (next.virusWarningPending || enablesVirusWarning) };
  publish(saved);
  try {
    window.localStorage.setItem(writingKey, '1');
    window.setTimeout(() => {
      try {
        persist(saved);
        window.localStorage.removeItem(writingKey);
      } catch {
        // Privater Modus: das CMOS gilt nur für diese Sitzung.
      }
    }, saveDelayMs);
  } catch {
    // Privater Modus: das CMOS gilt nur für diese Sitzung.
  }
}

export function updateCmosQuietly(patch: Partial<Cmos>) {
  const next = { ...current, ...patch };
  publish(next);
  try {
    persist(next);
  } catch {
    // Privater Modus: das CMOS gilt nur für diese Sitzung.
  }
}

/** Meldet einmalig, ob beim Laden ein Checksum-Fehler auftrat (POST zeigt dann „CMOS checksum error“). */
export function takeChecksumError() {
  const value = checksumError;
  checksumError = false;
  return value;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCmos() {
  return useSyncExternalStore(subscribe, getCmos);
}

export function isUsbDevice(device: string): device is UsbDevice {
  return device === 'USB-HDD' || device === 'USB-ZIP';
}

export function hddPresent(cmos: Cmos) {
  return cmos.values.primaryMaster !== 'None' && cmos.values.onchipPrimaryIde === 'Enabled';
}

/** Das Laufwerk, das die POST-Erkennung am Primary Master meldet. */
export function primaryMasterName(cmos: Cmos) {
  return hddPresent(cmos) ? cmos.values.hddModel : 'None';
}

export function floppyPresent(cmos: Cmos) {
  return cmos.values.onboardFdc === 'Enabled' && cmos.values.driveA !== 'None';
}

export type BootTarget =
  | { kind: 'hdd' }
  | { kind: 'usb'; device: UsbDevice }
  | { kind: 'fail'; device: BootDevice | null };

/**
 * Nur das erste Boot-Gerät zählt. Windows liegt ausschließlich auf der Projekt-Festplatte (HDD-0, ST34311A);
 * Diskette und CD-ROM sind leer, alle anderen Geräte gibt es in diesem Rechner nicht.
 */
export function resolveBoot(cmos: Cmos, usbAvailable: boolean, override?: BootDevice): BootTarget {
  const device = (override ?? cmos.values.firstBoot) as BootDevice;
  if (device === 'HDD-0') {
    return hddPresent(cmos) && cmos.values.hddModel === machine.hddModel ? { kind: 'hdd' } : { kind: 'fail', device };
  }
  if (isUsbDevice(device)) {
    return usbAvailable && cmos.values.usbController === 'Enabled' ? { kind: 'usb', device } : { kind: 'fail', device };
  }
  return { kind: 'fail', device: device === 'Disabled' ? null : device };
}
