export const machine = {
  cpuType: 'PENTIUM II',
  clock: '450MHz',
  coProcessor: 'Installed',
  baseMemory: '640K',
  extendedMemory: '64512K',
  cacheMemory: '512K',
  totalMemoryK: 65536,
  driveA: '1.44M, 3.5 in.',
  driveB: 'None',
  ideMaster: 'LBA,UDMA 33, 4327MB',
  ideSlave: 'None',
  ideSecMaster: 'CDROM, Mode 4',
  ideSecSlave: 'CDROM, UDMA 33',
  display: 'EGA/VGA',
  serial: '3F8 2F8',
  parallel: '378',
  sdramRows: '2 3 4 5',
  hddModel: 'ST34311A',
  hddSize: '4327 MB',
  biosDate: '04/26/2000',
  biosId: 'i440BX-W977-2A69KA1JC-QR',
};

export const bootScript = {
  intro: [
    'Award Modular BIOS v4.51PG, An Energy Star Ally',
    'Copyright (C) 1984-99, Award Software, Inc.',
    '',
    'GREEN AGP/PCI/ISA SYSTEM',
    '',
    `${machine.cpuType} CPU at ${machine.clock}`,
  ],
  memoryLabel: 'Memory Test :  ',
  memoryDurationMs: 2800,
  pnp: [
    '',
    'Award Plug and Play BIOS Extension v1.0A',
    'Copyright (C) 1999, Award Software, Inc.',
  ],
  ideMaster: 'Detecting IDE Primary Master  ... ',
  ideMasterValue: machine.hddModel,
  ideSlave: 'Detecting IDE Primary Slave   ... ',
  ideSlaveValue: '[Press F4 to skip]',
  footerSetup: 'Press DEL to enter SETUP',
  footerId: `${machine.biosDate}-${machine.biosId}`,
  delays: {
    beforeMemory: 450,
    afterMemory: 400,
    pnpLine: 260,
    beforeMasterValue: 700,
    beforeSlave: 320,
    slaveWait: 1500,
    beforeDone: 800,
  },
};

export function formatMemory(kilobytes: number, done: boolean) {
  const value = String(kilobytes).padStart(6, ' ');
  return `${bootScript.memoryLabel}${value}K${done ? ' OK' : ''}`;
}

export const setupMenu = {
  left: [
    'STANDARD CMOS SETUP',
    'BIOS FEATURES SETUP',
    'CHIPSET FEATURES SETUP',
    'POWER MANAGEMENT SETUP',
    'PNP/PCI CONFIGURATION',
    'LOAD BIOS DEFAULTS',
    'LOAD SETUP DEFAULTS',
  ],
  right: [
    'INTEGRATED PERIPHERALS',
    'SUPERVISOR PASSWORD',
    'USER PASSWORD',
    'IDE HDD AUTO DETECTION',
    'MICROSOFT SCANDISK',
    'SAVE & EXIT SETUP',
    'EXIT WITHOUT SAVING',
  ],
};
