import { useEffect, useRef, useState } from 'react';
import { playFloppySeek, startDiskBootFailureBeep } from '../audio/audio';
import { bootScript } from './bootScript';
import type { BootDevice } from './cmos';
import { SystemSummary } from './SystemSummary';
import './bios.css';

type BootFailureProps = {
  device: BootDevice | null;
  showSummary: boolean;
  onSetup: () => void;
};

const floppyWaitMs = 10000;

/**
 * Award-Meldung nach erfolgloser Boot-Sequenz. ENTER führt ins Setup, damit sich die Reihenfolge korrigieren lässt;
 * steht die Diskette vorn, wartet das Laufwerk vorher noch einmal auf eine Systemdiskette.
 */
export function BootFailure({ device, showSummary, onSetup }: BootFailureProps) {
  const [waiting, setWaiting] = useState(false);
  const onSetupRef = useRef(onSetup);
  onSetupRef.current = onSetup;
  const stopBeep = useRef<(() => void) | null>(null);
  const waitingRef = useRef(false);

  useEffect(() => {
    stopBeep.current = startDiskBootFailureBeep();
    return () => stopBeep.current?.();
  }, []);

  const silence = () => {
    stopBeep.current?.();
    stopBeep.current = null;
  };

  const proceed = () => {
    silence();
    if (device === 'Floppy' && !waitingRef.current) {
      waitingRef.current = true;
      setWaiting(true);
      playFloppySeek();
      return;
    }
    onSetupRef.current();
  };

  const proceedRef = useRef(proceed);
  proceedRef.current = proceed;

  useEffect(() => {
    if (!waiting) return;
    const seek = window.setInterval(playFloppySeek, 3300);
    const timer = window.setTimeout(() => onSetupRef.current(), floppyWaitMs);
    return () => {
      window.clearInterval(seek);
      window.clearTimeout(timer);
    };
  }, [waiting]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'F4') {
        event.preventDefault();
        silence();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        proceedRef.current();
      } else if (event.key === 'Delete') {
        event.preventDefault();
        silence();
        onSetupRef.current();
      } else if (event.key === 'Escape') {
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const message = (
    <div className="bootfail" onClick={() => proceedRef.current()}>
      <div className="summary-gap">{'\u00a0'}</div>
      <div>
        {bootScript.diskBootFailure}
        {waiting ? null : <span className="blink">_</span>}
      </div>
      {waiting ? <div><span className="blink">_</span></div> : null}
    </div>
  );

  if (showSummary) return <SystemSummary settled>{message}</SystemSummary>;
  return (
    <div className="bios-screen">
      <div className="bios-copy summary-copy">{message}</div>
    </div>
  );
}
