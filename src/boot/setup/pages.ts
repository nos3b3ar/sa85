import { machine } from '../bootScript';
import { bootDevices, quantumModel, type Cmos } from '../cmos';

export type Values = Record<string, string>;

export type OptionField = {
  kind: 'option';
  id: string;
  label: string;
  options: readonly string[];
  help: string;
  enabled?: (values: Values) => boolean;
  /** Wert, den das BIOS bei gesperrtem Feld anzeigt (etwa die Zeiten eines Power-Management-Profils). */
  preset?: (values: Values) => string | null;
  suffix?: (cmos: Cmos) => string;
};

export type ClockField = { kind: 'clock'; id: 'date' | 'time'; label: string; help: string };

export type InfoField = { kind: 'info'; label: string; value: (cmos: Cmos, tick: number) => string };

export type TextField = { kind: 'text'; text: string };

export type Field = OptionField | ClockField | InfoField | TextField;

export type SetupPage = {
  id: string;
  title: string;
  columns: [Field[], Field[]];
  labelWidth: [number, number];
  /** Rechte Spalte als Info-Block unten rechts statt als zweite Feldspalte (STANDARD CMOS SETUP). */
  asideBottom?: boolean;
};

const enabledDisabled = ['Enabled', 'Disabled'] as const;
const disabledEnabled = ['Disabled', 'Enabled'] as const;

function option(id: string, label: string, options: readonly string[], help: string, extra: Partial<OptionField> = {}): OptionField {
  return { kind: 'option', id, label, options, help, ...extra };
}

const text = (value = ''): TextField => ({ kind: 'text', text: value });

const userDefine = (values: Values) => values.powerManagement === 'User Define';
const pmPreset = (values: Values) => {
  if (values.powerManagement === 'Max Saving') return '1 Min';
  if (values.powerManagement === 'Min Saving') return '1 Hour';
  if (values.powerManagement === 'Disabled') return 'Disable';
  return null;
};
const pmTimes = ['Disable', '1 Min', '2 Min', '4 Min', '8 Min', '12 Min', '20 Min', '30 Min', '40 Min', '1 Hour'];
const manualResources = (values: Values) => values.resources === 'Manual';
const typematicOn = (values: Values) => values.typematic === 'Enabled';

type Geometry = { size: number; cyls: number; head: number; precomp: number; landz: number; sector: number };

const geometries: Record<string, Record<string, Geometry>> = {
  [machine.hddModel]: {
    LBA: { size: 4327, cyls: 526, head: 255, precomp: 0, landz: 525, sector: 63 },
    NORMAL: { size: 4327, cyls: 8944, head: 15, precomp: 65535, landz: 8943, sector: 63 },
    LARGE: { size: 4327, cyls: 1052, head: 128, precomp: 65535, landz: 1051, sector: 63 },
  },
  [quantumModel]: {
    LBA: { size: 6149, cyls: 784, head: 255, precomp: 0, landz: 783, sector: 63 },
    NORMAL: { size: 6149, cyls: 12712, head: 15, precomp: 65535, landz: 12711, sector: 63 },
    LARGE: { size: 6149, cyls: 794, head: 240, precomp: 65535, landz: 793, sector: 63 },
  },
};

export function hddGeometry(model: string, mode: string) {
  return geometries[model]?.[mode] ?? geometries[machine.hddModel].LBA;
}

export function geometryColumns(geometry: Geometry | null, mode: string) {
  const g = geometry ?? { size: 0, cyls: 0, head: 0, precomp: 0, landz: 0, sector: 0 };
  return [
    String(g.size).padStart(5),
    String(g.cyls).padStart(6),
    String(g.head).padStart(5),
    String(g.precomp).padStart(8),
    String(g.landz).padStart(6),
    String(g.sector).padStart(7),
    `  ${geometry ? mode : '------'}`,
  ].join('');
}

const masterSuffix = (cmos: Cmos) => {
  const { values } = cmos;
  if (values.primaryMaster === 'None') return geometryColumns(null, '');
  return geometryColumns(hddGeometry(values.hddModel, values.hddMode), values.hddMode);
};
const emptySuffix = () => geometryColumns(null, '');

const floppyTypes = ['None', '360K, 5.25 in.', '1.2M, 5.25 in.', '720K, 3.5 in.', '1.44M, 3.5 in.', '2.88M, 3.5 in.'];

/** Pseudo-Messwerte der Hardware-Überwachung, die sekündlich minimal schwanken. */
function sensor(base: number, spread: number, tick: number, salt: number) {
  const noise = Math.sin(tick * 1.7 + salt * 3.1) + Math.sin(tick * 0.43 + salt);
  return base + Math.round(noise * spread * 50) / 100;
}

function celsius(value: number) {
  const c = Math.round(value);
  return `${c}\u00b0C/${Math.round(c * 1.8 + 32)}\u00b0F`;
}

export function bootDeviceOptions(usbAvailable: boolean) {
  return bootDevices.filter((device) => usbAvailable || !device.startsWith('USB-'));
}

export function createPages(usbAvailable: boolean): SetupPage[] {
  const devices = bootDeviceOptions(usbAvailable);
  const bootHelp = usbAvailable
    ? 'Select the boot device. HDD-0 holds the system (ST34311A). USB-HDD / USB-ZIP boot from a USB stick; press ENTER on a USB entry to detect the device.'
    : 'Select the boot device. HDD-0 holds the system (ST34311A).';

  return [
    {
      id: 'standard',
      title: 'STANDARD CMOS SETUP',
      labelWidth: [16, 16],
      asideBottom: true,
      columns: [
        [
          { kind: 'clock', id: 'date', label: 'Date (mm:dd:yy)', help: 'Set the system date. PU/PD/+/- changes the day.' },
          { kind: 'clock', id: 'time', label: 'Time (hh:mm:ss)', help: 'Set the system time. PU/PD/+/- changes the minutes.' },
          text(),
          text(`${'HARD DISKS'.padEnd(19)}TYPE${' SIZE'}${'  CYLS'}${' HEAD'}${' PRECOMP'}${' LANDZ'}${' SECTOR'}  MODE`),
          option('primaryMaster', 'Primary Master', ['Auto', 'User', 'None'], 'Type of the IDE drive at the primary master channel. None removes the system disk.', { suffix: masterSuffix }),
          option('primarySlave', 'Primary Slave', ['None', 'Auto'], 'No drive is connected at this channel.', { suffix: emptySuffix }),
          option('secondaryMaster', 'Secondary Master', ['Auto', 'None'], 'ATAPI CD-ROM drive. ATAPI devices report no geometry.', { suffix: emptySuffix }),
          option('secondarySlave', 'Secondary Slave', ['Auto', 'None'], 'ATAPI CD-ROM drive. ATAPI devices report no geometry.', { suffix: emptySuffix }),
          text(),
          option('driveA', 'Drive A', floppyTypes, 'Type of floppy drive A:.'),
          option('driveB', 'Drive B', floppyTypes, 'Type of floppy drive B:.'),
          option('floppy3Mode', 'Floppy 3 Mode Support', ['Disabled', 'Drive A', 'Drive B', 'Both'], 'Japanese 1.2 MB 3.5 in. floppy format.'),
          text(),
          option('video', 'Video', ['EGA/VGA', 'CGA 40', 'CGA 80', 'MONO'], 'Primary display adapter.'),
          option('haltOn', 'Halt On', ['All Errors', 'No Errors', 'All,But Keyboard', 'All,But Diskette', 'All,But Disk/Key'], 'Errors that stop the POST until F1 is pressed.'),
        ],
        [
          { kind: 'info', label: 'Base Memory', value: () => machine.baseMemory.padStart(7) },
          { kind: 'info', label: 'Extended Memory', value: () => machine.extendedMemory.padStart(7) },
          { kind: 'info', label: 'Other Memory', value: () => '384K'.padStart(7) },
          text('\u2500'.repeat(26)),
          { kind: 'info', label: 'Total Memory', value: () => `${machine.totalMemoryK}K`.padStart(7) },
        ],
      ],
    },
    {
      id: 'features',
      title: 'BIOS FEATURES SETUP',
      labelWidth: [26, 18],
      columns: [
        [
          option('virusWarning', 'Virus Warning', disabledEnabled, 'Warns when the boot sector or partition table of the hard disk is to be written.'),
          option('internalCache', 'CPU Internal Cache', enabledDisabled, 'CPU level 1 cache.'),
          option('externalCache', 'External Cache', enabledDisabled, 'Level 2 cache (512K).'),
          option('l2Ecc', 'CPU L2 Cache ECC Checking', enabledDisabled, 'ECC checking of the level 2 cache.', { enabled: (v) => v.externalCache === 'Enabled' }),
          option('quickPost', 'Quick Power On Self Test', enabledDisabled, 'Enabled skips some POST tests and shortens the memory test.'),
          option('firstBoot', 'First Boot Device', devices, bootHelp),
          option('secondBoot', 'Second Boot Device', devices, bootHelp),
          option('thirdBoot', 'Third Boot Device', devices, bootHelp),
          option('swapFloppy', 'Swap Floppy Drive', disabledEnabled, 'Exchange drive letters A: and B:.'),
          option('floppySeek', 'Boot Up Floppy Seek', enabledDisabled, 'Seek floppy drive A: during POST to determine the drive type.'),
          option('numLock', 'Boot Up NumLock Status', ['On', 'Off'], 'NumLock state after boot.'),
          option('gateA20', 'Gate A20 Option', ['Normal', 'Fast'], 'Fast lets the chipset control Gate A20.'),
          option('typematic', 'Typematic Rate Setting', disabledEnabled, 'Program the keyboard repeat rate and delay.'),
          option('typematicRate', 'Typematic Rate (Chars/Sec)', ['6', '8', '10', '12', '15', '20', '24', '30'], 'Characters per second while a key is held.', { enabled: typematicOn }),
          option('typematicDelay', 'Typematic Delay (Msec)', ['250', '500', '750', '1000'], 'Delay before a held key starts repeating.', { enabled: typematicOn }),
          option('securityOption', 'Security Option', ['Setup', 'System'], 'Setup: password is required to enter SETUP. System: password is required at every boot.'),
          option('paletteSnoop', 'PCI/VGA Palette Snoop', disabledEnabled, 'For ISA video capture cards.'),
          option('osSelect', 'OS Select For DRAM > 64MB', ['Non-OS2', 'OS2'], 'Select OS2 only when running OS/2 with more than 64MB.'),
          option('smart', 'HDD S.M.A.R.T. capability', disabledEnabled, 'Self-Monitoring, Analysis and Reporting Technology.'),
          option('reportNoFdd', 'Report No FDD For WIN 95', ['No', 'Yes'], 'Release IRQ6 when no floppy drive is installed.'),
        ],
        [
          option('setupPrompt', 'Show Setup Prompt', enabledDisabled, 'Show "Press DEL to enter SETUP" during POST. DEL works in either case.'),
          option('summaryScreen', 'Summary Screen', enabledDisabled, 'Show the system configuration summary after POST.'),
          text(),
          option('videoShadow', 'Video BIOS Shadow', enabledDisabled, 'Copy the video BIOS to RAM.'),
          option('shadowC8', 'C8000-CBFFF Shadow', disabledEnabled, 'Shadow option ROMs in this segment.'),
          option('shadowCC', 'CC000-CFFFF Shadow', disabledEnabled, 'Shadow option ROMs in this segment.'),
          option('shadowD0', 'D0000-D3FFF Shadow', disabledEnabled, 'Shadow option ROMs in this segment.'),
          option('shadowD4', 'D4000-D7FFF Shadow', disabledEnabled, 'Shadow option ROMs in this segment.'),
          option('shadowD8', 'D8000-DBFFF Shadow', disabledEnabled, 'Shadow option ROMs in this segment.'),
          option('shadowDC', 'DC000-DFFFF Shadow', disabledEnabled, 'Shadow option ROMs in this segment.'),
        ],
      ],
    },
    {
      id: 'chipset',
      title: 'CHIPSET FEATURES SETUP',
      labelWidth: [26, 24],
      columns: [
        [
          option('rasToCas', 'SDRAM RAS-to-CAS Delay', ['2', '3'], 'Clocks between RAS and CAS.'),
          option('rasPrecharge', 'SDRAM RAS Precharge Time', ['2', '3'], 'Clocks for RAS precharge.'),
          option('casLatency', 'SDRAM CAS latency Time', ['2', '3'], 'CAS latency of the installed SDRAM.'),
          option('sdramPrecharge', 'SDRAM Precharge Control', disabledEnabled, 'Let the chipset issue precharge commands.'),
          option('dramIntegrity', 'DRAM Data Integrity Mode', ['Non-ECC', 'ECC'], 'ECC requires ECC memory modules.'),
          option('biosCacheable', 'System BIOS Cacheable', enabledDisabled, 'Cache the system BIOS at F0000h.'),
          option('videoBiosCacheable', 'Video BIOS Cacheable', enabledDisabled, 'Cache the video BIOS at C0000h.'),
          option('videoRamCacheable', 'Video RAM Cacheable', enabledDisabled, 'Cache the video memory at A0000h.'),
          option('io8Recovery', '8 Bit I/O Recovery Time', ['1', '2', '3', '4', '5', '6', '7', '8', 'NA'], 'ISA 8-bit I/O recovery in bus clocks.'),
          option('io16Recovery', '16 Bit I/O Recovery Time', ['1', '2', '3', '4', 'NA'], 'ISA 16-bit I/O recovery in bus clocks.'),
          option('memoryHole', 'Memory Hole At 15M-16M', ['Disabled', '15M-16M'], 'Reserve 15M-16M for old ISA cards.'),
          option('passiveRelease', 'Passive Release', enabledDisabled, 'PCI passive release for ISA masters.'),
          option('delayedTransaction', 'Delayed Transaction', enabledDisabled, 'PCI 2.1 delayed transactions.'),
          option('agpAperture', 'AGP Aperture Size (MB)', ['4', '8', '16', '32', '64', '128', '256'], 'Memory window for AGP graphics.'),
          { kind: 'info', label: 'SDRAM at Row(s)', value: () => machine.sdramRows },
        ],
        [
          option('cpuWarningTemp', 'CPU Warning Temperature', ['Disabled', '50\u00b0C/122\u00b0F', '53\u00b0C/127\u00b0F', '56\u00b0C/133\u00b0F', '60\u00b0C/140\u00b0F', '63\u00b0C/145\u00b0F', '66\u00b0C/151\u00b0F', '70\u00b0C/158\u00b0F'], 'Alarm temperature of the CPU.'),
          { kind: 'info', label: 'Current System Temp.', value: (_cmos, tick) => celsius(sensor(30, 0.6, tick, 1)) },
          { kind: 'info', label: 'Current CPU Temperature', value: (_cmos, tick) => celsius(sensor(41, 0.8, tick, 2)) },
          { kind: 'info', label: 'Current CPUFAN1 Speed', value: (_cmos, tick) => `${Math.round(sensor(4687, 40, tick, 3) / 10) * 10} RPM` },
          { kind: 'info', label: 'Current CPUFAN2 Speed', value: () => '0 RPM' },
          { kind: 'info', label: 'IN0 (V)', value: (_cmos, tick) => `${sensor(2.0, 0.02, tick, 4).toFixed(2)} V` },
          { kind: 'info', label: 'IN1 (V)', value: (_cmos, tick) => `${sensor(1.5, 0.01, tick, 5).toFixed(2)} V` },
          { kind: 'info', label: 'IN2 (V)', value: (_cmos, tick) => `${sensor(3.47, 0.02, tick, 6).toFixed(2)} V` },
          { kind: 'info', label: '+ 5 V', value: (_cmos, tick) => `${sensor(5.05, 0.03, tick, 7).toFixed(2)} V` },
          { kind: 'info', label: '+12 V', value: (_cmos, tick) => `${sensor(12.16, 0.06, tick, 8).toFixed(2)} V` },
          { kind: 'info', label: '-12 V', value: (_cmos, tick) => `${sensor(-12.04, 0.06, tick, 9).toFixed(2)} V` },
          { kind: 'info', label: '- 5 V', value: (_cmos, tick) => `${sensor(-5.02, 0.03, tick, 10).toFixed(2)} V` },
        ],
      ],
    },
    {
      id: 'power',
      title: 'POWER MANAGEMENT SETUP',
      labelWidth: [22, 20],
      columns: [
        [
          option('acpi', 'ACPI function', enabledDisabled, 'Advanced Configuration and Power Interface.'),
          option('powerManagement', 'Power Management', ['User Define', 'Min Saving', 'Max Saving', 'Disabled'], 'Green PC power saving profile. User Define enables the timers below.'),
          option('pmByApm', 'PM Control by APM', ['Yes', 'No'], 'Let the operating system control power management via APM.'),
          option('videoOffMethod', 'Video Off Method', ['V/H SYNC+Blank', 'Blank Screen', 'DPMS'], 'How the monitor is turned off.'),
          option('videoOffAfter', 'Video Off After', ['NA', 'Doze', 'Standby', 'Suspend'], 'Power state that turns the monitor off.'),
          option('modemIrq', 'MODEM Use IRQ', ['NA', '3', '4', '5', '7', '9', '10', '11'], 'IRQ of the modem for wake-up.'),
          option('dozeMode', 'Doze Mode', pmTimes, 'Idle time until the CPU clock slows down.', { enabled: userDefine, preset: pmPreset }),
          option('standbyMode', 'Standby Mode', pmTimes, 'Idle time until monitor and hard disk turn off.', { enabled: userDefine, preset: pmPreset }),
          option('suspendMode', 'Suspend Mode', pmTimes, 'Idle time until all devices except the CPU turn off.', { enabled: userDefine, preset: pmPreset }),
          option('hddPowerDown', 'HDD Power Down', ['Disable', '1 Min', '2 Min', '3 Min', '4 Min', '5 Min', '10 Min', '15 Min'], 'Idle time until the hard disk spins down.', { enabled: userDefine, preset: pmPreset }),
          option('throttle', 'Throttle Duty Cycle', ['12.5%', '25.0%', '37.5%', '50.0%', '62.5%', '75.0%'], 'CPU speed in doze mode.'),
          option('softOff', 'Soft-Off by PWR-BTTN', ['Instant-Off', 'Delay 4 Sec.'], 'Behaviour of the power button.'),
          option('resumeByRing', 'Resume by Ring', disabledEnabled, 'Power on when the modem rings.'),
          option('resumeByAlarm', 'Resume by Alarm', disabledEnabled, 'Power on at a set date and time.'),
        ],
        [
          text('** Reload Global Timer Events **'),
          option('wakeIrq', 'IRQ[3-7,9-15],NMI', enabledDisabled, 'Activity on these IRQs resets the timers.'),
          option('wakeIde0', 'Primary IDE 0', enabledDisabled, 'Activity resets the timers.'),
          option('wakeIde1', 'Primary IDE 1', enabledDisabled, 'Activity resets the timers.'),
          option('wakeFloppy', 'Floppy Disk', enabledDisabled, 'Activity resets the timers.'),
          option('wakeSerial', 'Serial Port', enabledDisabled, 'Activity resets the timers.'),
          option('wakeParallel', 'Parallel Port', disabledEnabled, 'Activity resets the timers.'),
        ],
      ],
    },
    {
      id: 'pnp',
      title: 'PNP/PCI CONFIGURATION',
      labelWidth: [22, 22],
      columns: [
        [
          option('pnpOs', 'PNP OS Installed', ['No', 'Yes'], 'Yes lets a Plug and Play operating system assign resources.'),
          option('resources', 'Resources Controlled By', ['Auto', 'Manual'], 'Auto assigns IRQs and DMAs. Manual enables the assignments below.'),
          option('resetConfig', 'Reset Configuration Data', disabledEnabled, 'Clear the ESCD area at the next boot.'),
          text(),
          ...[3, 4, 5, 7, 9, 10, 11, 12, 14, 15].map((irq) => option(
            `irq${irq}`,
            `IRQ-${irq} assigned to`.replace(/^IRQ-(\d) /, 'IRQ-$1  '),
            ['PCI/ISA PnP', 'Legacy ISA'],
            'Legacy ISA reserves the IRQ for a non-PnP ISA card.',
            { enabled: manualResources },
          )),
          ...[0, 1, 3].map((dma) => option(`dma${dma}`, `DMA-${dma}  assigned to`, ['PCI/ISA PnP', 'Legacy ISA'], 'Legacy ISA reserves the DMA channel for a non-PnP ISA card.', { enabled: manualResources })),
        ],
        [
          option('irqUsb', 'Assign IRQ For USB', enabledDisabled, 'Disabled frees the IRQ of the USB controller.'),
          option('irqVga', 'Assign IRQ For VGA', enabledDisabled, 'Disabled frees the IRQ of the AGP card.'),
          option('ideMap', 'PCI IDE IRQ Map To', ['PCI-AUTO', 'PCI-SLOT1', 'PCI-SLOT2', 'PCI-SLOT3', 'PCI-SLOT4', 'ISA'], 'Routing of PCI IDE interrupts.'),
          text(),
          text('PCI IRQ Routing      Bus Dev IRQ'),
          { kind: 'info', label: 'IDE Controller', value: () => '0   7  14' },
          { kind: 'info', label: 'Serial Bus (USB)', value: (cmos) => `0   7  ${cmos.values.irqUsb === 'Enabled' ? '10' : 'NA'}` },
          { kind: 'info', label: 'Multimedia Device', value: () => '0  13  11' },
          { kind: 'info', label: 'Display Controller', value: (cmos) => `1   0  ${cmos.values.irqVga === 'Enabled' ? ' 5' : 'NA'}` },
        ],
      ],
    },
    {
      id: 'peripherals',
      title: 'INTEGRATED PERIPHERALS',
      labelWidth: [26, 22],
      columns: [
        [
          option('ideBlockMode', 'IDE HDD Block Mode', enabledDisabled, 'Multi-sector transfers.'),
          option('primaryPio', 'IDE Primary Master PIO', ['Auto', 'Mode 0', 'Mode 1', 'Mode 2', 'Mode 3', 'Mode 4'], 'PIO mode of the primary master.'),
          option('primaryUdma', 'IDE Primary Master UDMA', ['Auto', 'Disabled'], 'Ultra DMA/33 for the primary master.'),
          option('onchipPrimaryIde', 'On-Chip Primary PCI IDE', enabledDisabled, 'Disabled turns off the channel of the system disk.'),
          option('onchipSecondaryIde', 'On-Chip Secondary PCI IDE', enabledDisabled, 'Channel of the CD-ROM drives.'),
          option('usbController', 'USB Controller', enabledDisabled, 'Onboard USB controller. Required for USB-HDD / USB-ZIP boot.'),
          option('usbKeyboard', 'USB Keyboard Support', disabledEnabled, 'Legacy support for USB keyboards.', { enabled: (v) => v.usbController === 'Enabled' }),
          option('initDisplay', 'Init Display First', ['AGP', 'PCI Slot'], 'Which display adapter is initialised first.'),
          option('powerOnFunction', 'POWER ON Function', ['Button Only', 'Keyboard 98', 'Hot KEY', 'Mouse Left', 'Mouse Right', 'Password'], 'How the system is powered on.'),
          option('kbcClock', 'KBC input clock', ['6 MHz', '8 MHz', '12 MHz', '16 MHz'], 'Keyboard controller clock.'),
        ],
        [
          option('onboardFdc', 'Onboard FDC Controller', enabledDisabled, 'Floppy disk controller. Disabled also skips the floppy seek.'),
          option('serial1', 'Onboard Serial Port 1', ['Disabled', '3F8/IRQ4', '2F8/IRQ3', '3E8/IRQ4', '2E8/IRQ3', 'Auto'], 'Address and IRQ of COM1.'),
          option('serial2', 'Onboard Serial Port 2', ['Disabled', '3F8/IRQ4', '2F8/IRQ3', '3E8/IRQ4', '2E8/IRQ3', 'Auto'], 'Address and IRQ of COM2.'),
          option('uartMode', 'UART Mode Select', ['Standard', 'HPSIR', 'ASKIR'], 'Infrared mode of the second UART.'),
          option('parallelPort', 'Onboard Parallel Port', ['Disabled', '378/IRQ7', '278/IRQ5', '3BC/IRQ7'], 'Address and IRQ of LPT1.'),
          option('parallelMode', 'Parallel Port Mode', ['SPP', 'EPP', 'ECP', 'ECP+EPP'], 'Operating mode of LPT1.'),
        ],
      ],
    },
  ];
}

export const oemPage: SetupPage = {
  id: 'oem',
  title: 'OEM INFORMATION',
  labelWidth: [30, 0],
  columns: [
    [
      { kind: 'info', label: 'BIOS Version', value: () => 'Award Modular BIOS v4.51PG' },
      { kind: 'info', label: 'BIOS String', value: () => `${machine.biosDate}-${machine.biosId}` },
      { kind: 'info', label: 'BIOS Part No.', value: () => '2A69KA1J' },
      { kind: 'info', label: 'OEM Build', value: () => 'sa85 rev. 0426, 2Mbit Flash ROM' },
      { kind: 'info', label: 'Chipset', value: () => 'Intel 82440BX / 82371EB, Winbond W83977' },
      { kind: 'info', label: 'CPU', value: () => `${machine.cpuType} ${machine.clock}` },
      text(),
      { kind: 'info', label: 'Board', value: () => 'GREEN AGP/PCI/ISA SYSTEM' },
      { kind: 'info', label: 'Assembled by', value: () => 'Stefan Andernach (sa85)' },
      text(),
      option('multiBoot', 'Boot Menu (ESC during POST)', disabledEnabled, 'Hidden OEM feature: ESC during POST shows a boot device menu instead of skipping the start.'),
    ],
    [],
  ],
};

export const mainMenuHelp: Record<string, string> = {
  'STANDARD CMOS SETUP': 'Time, Date, Hard Disk Type...',
  'BIOS FEATURES SETUP': 'Virus Warning, Boot Sequence, Quick POST...',
  'CHIPSET FEATURES SETUP': 'SDRAM Timing, Cache, Hardware Monitor...',
  'POWER MANAGEMENT SETUP': 'Green PC, Doze, Standby, Suspend...',
  'PNP/PCI CONFIGURATION': 'IRQ and DMA Assignment, PCI Routing...',
  'LOAD BIOS DEFAULTS': 'Load Fail-Safe Values (Minimal Performance)',
  'LOAD SETUP DEFAULTS': 'Load Optimized Values (Maximal Performance)',
  'INTEGRATED PERIPHERALS': 'Onboard IDE, USB, FDC, Serial and Parallel Ports...',
  'SUPERVISOR PASSWORD': 'Change/Set/Disable Supervisor Password',
  'USER PASSWORD': 'Change/Set/Disable User Password',
  'IDE HDD AUTO DETECTION': 'Detect IDE Hard Disk Parameters',
  'MICROSOFT SCANDISK': 'Check Drive C: for Errors',
  'SAVE & EXIT SETUP': 'Save Data to CMOS & Exit SETUP',
  'EXIT WITHOUT SAVING': 'Abandon all Datas & Exit SETUP',
};
