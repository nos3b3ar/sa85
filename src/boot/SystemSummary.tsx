import { useEffect, useRef, useState, type ReactNode } from 'react';
import { machine } from './bootScript';
import { getCmos, primaryMasterName, type Cmos } from './cmos';

type SystemSummaryProps = {
  onDone?: () => void;
  /** Endzustand ohne Animation, etwa unter einer DISK BOOT FAILURE-Meldung. */
  settled?: boolean;
  children?: ReactNode;
};

const pciWidths = [8, 12, 10, 12, 12, 26, 5];

function devices(cmos: Cmos) {
  const { values } = cmos;
  const rows = [
    ['0', '7', '1', '8086', '7111', 'IDE Controller', '14'],
    ['0', '7', '2', '8086', '7112', 'Serial Bus Controller', values.irqUsb === 'Enabled' ? '10' : 'NA'],
    ['0', '13', '0', '1102', '0002', 'Multimedia Device', '11'],
    ['0', '13', '1', '1102', '7002', 'Input Device', 'NA'],
    ['1', '0', '0', '10DE', '0171', 'Display Controller', values.irqVga === 'Enabled' ? '5' : 'NA'],
  ];
  return values.usbController === 'Enabled' ? rows : rows.filter((row) => row[5] !== 'Serial Bus Controller');
}

function ports(...settings: string[]) {
  const used = settings.filter((value) => value !== 'Disabled').map((value) => value.split('/')[0]);
  return used.length ? used.join(' ') : 'None';
}

export function SystemSummary({ onDone, settled = false, children }: SystemSummaryProps) {
  const [dots, setDots] = useState(settled ? 10 : 0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const [cmos] = useState(getCmos);
  const { values } = cmos;

  useEffect(() => {
    if (settled) return;
    let count = 0;
    let finish = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setDots(count);
      if (count >= 10) {
        window.clearInterval(timer);
        finish = window.setTimeout(() => onDoneRef.current?.(), 800);
      }
    }, 160);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(finish);
    };
  }, [settled]);

  const cache = values.externalCache === 'Enabled' ? machine.cacheMemory : 'Disabled';
  const master = primaryMasterName(cmos) === 'None' ? 'None' : machine.ideMaster.replace('4327MB', values.hddModel === machine.hddModel ? '4327MB' : '6149MB');
  const fdc = values.onboardFdc === 'Enabled';
  const secondary = values.onchipSecondaryIde === 'Enabled';

  const rows: Array<[string, string] | 'split'> = [
    [`CPU Type       : ${machine.cpuType}`, `Base Memory      : ${machine.baseMemory.padStart(8)}`],
    [`Co-Processor   : ${machine.coProcessor}`, `Extended Memory  : ${machine.extendedMemory.padStart(8)}`],
    [`CPU Clock      : ${machine.clock}`, `Cache Memory     : ${cache.padStart(8)}`],
    'split',
    [`Diskette Drive A : ${fdc ? values.driveA : 'None'}`, `Display Type     : ${values.video.padStart(8)}`],
    [`Diskette Drive B : ${fdc ? values.driveB : 'None'}`, `Serial Port(s)   : ${ports(values.serial1, values.serial2).padStart(8)}`],
    [`IDE Pri. Master  : ${master}`, `Parallel Port(s) : ${ports(values.parallelPort).padStart(8)}`],
    [`IDE Pri. Slave   : ${machine.ideSlave}`, `SDRAM at Row(s)  : ${machine.sdramRows.padStart(8)}`],
    [`IDE Sec. Master  : ${secondary && values.secondaryMaster !== 'None' ? machine.ideSecMaster : 'None'}`, ''],
    [`IDE Sec. Slave   : ${secondary && values.secondarySlave !== 'None' ? machine.ideSecSlave : 'None'}`, ''],
  ];

  return (
    <div className="bios-screen">
      <div className="bios-copy summary-copy">
        <div className="summary-box">
          {rows.map((row, index) => (
            row === 'split' ? (
              <div key="split" className="summary-split" />
            ) : (
              <div key={row[0] || index} className="summary-row">
                <span>{row[0]}</span>
                <span>{row[1] || '\u00a0'}</span>
              </div>
            )
          ))}
        </div>
        <div className="summary-gap">{'\u00a0'}</div>
        <div>PCI device listing ...</div>
        <div>{pciRow(['Bus No.', 'Device No.', 'Func No.', 'Vendor ID', 'Device ID', 'Device Class', 'IRQ'])}</div>
        {devices(cmos).map((device) => (
          <div key={device.join('-')}>{pciRow(device)}</div>
        ))}
        <div className="summary-gap">{'\u00a0'}</div>
        <div>{`Verifying DMI Pool Data ${'.'.repeat(dots)}`}</div>
        {children}
      </div>
    </div>
  );
}

function padEnd(text: string, width: number) {
  return text.length >= width ? text : text + ' '.repeat(width - text.length);
}

function pciRow(columns: string[]) {
  return columns.map((column, index) => padEnd(column, pciWidths[index] ?? 8)).join('');
}
