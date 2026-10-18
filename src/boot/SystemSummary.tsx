import { useEffect, useRef, useState } from 'react';
import { machine } from './bootScript';

type SystemSummaryProps = {
  onDone: () => void;
};

const devices = [
  ['0', '7', '1', '8086', '7111', 'IDE Controller', '14'],
  ['0', '7', '2', '8086', '7112', 'Serial Bus Controller', '10'],
  ['0', '13', '0', '1102', '0002', 'Multimedia Device', '11'],
  ['0', '13', '1', '1102', '7002', 'Input Device', 'NA'],
  ['1', '0', '0', '10DE', '0171', 'Display Controller', '5'],
];

const pciWidths = [8, 12, 10, 12, 12, 26, 5];

export function SystemSummary({ onDone }: SystemSummaryProps) {
  const [dots, setDots] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let count = 0;
    let finish = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setDots(count);
      if (count >= 10) {
        window.clearInterval(timer);
        finish = window.setTimeout(() => onDoneRef.current(), 800);
      }
    }, 160);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(finish);
    };
  }, []);

  const rows: Array<[string, string] | 'split'> = [
    [`CPU Type       : ${machine.cpuType}`, `Base Memory      : ${machine.baseMemory.padStart(8)}`],
    [`Co-Processor   : ${machine.coProcessor}`, `Extended Memory  : ${machine.extendedMemory.padStart(8)}`],
    [`CPU Clock      : ${machine.clock}`, `Cache Memory     : ${machine.cacheMemory.padStart(8)}`],
    'split',
    [`Diskette Drive A : ${machine.driveA}`, `Display Type     : ${machine.display.padStart(8)}`],
    [`Diskette Drive B : ${machine.driveB}`, `Serial Port(s)   : ${machine.serial.padStart(8)}`],
    [`IDE Pri. Master  : ${machine.ideMaster}`, `Parallel Port(s) : ${machine.parallel.padStart(8)}`],
    [`IDE Pri. Slave   : ${machine.ideSlave}`, `SDRAM at Row(s)  : ${machine.sdramRows.padStart(8)}`],
    [`IDE Sec. Master  : ${machine.ideSecMaster}`, ''],
    [`IDE Sec. Slave   : ${machine.ideSecSlave}`, ''],
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
        {devices.map((device) => (
          <div key={device.join('-')}>{pciRow(device)}</div>
        ))}
        <div className="summary-gap">{'\u00a0'}</div>
        <div>{`Verifying DMI Pool Data ${'.'.repeat(dots)}`}</div>
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
