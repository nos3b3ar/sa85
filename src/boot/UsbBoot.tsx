import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { UsbDevice } from './cmos';
import { SystemSummary } from './SystemSummary';
import { UsbConsent } from './UsbConsent';
import {
  extractZipEntry,
  findBootCandidates,
  openUsbVolume,
  padFloppy,
  type BootCandidate,
  type UsbSupport,
  type UsbVolume,
} from './usbBoot';
import { V86Screen } from './V86Screen';
import './bios.css';

type UsbBootProps = {
  device: UsbDevice;
  support: UsbSupport;
  showSummary: boolean;
  onFail: () => void;
  onReboot: () => void;
};

type Stage =
  | { name: 'consent' }
  | { name: 'reading' }
  | { name: 'select'; volume: UsbVolume; candidates: BootCandidate[]; selected: number }
  | { name: 'loading'; volume: UsbVolume; candidate: BootCandidate }
  | { name: 'dos'; candidate: Extract<BootCandidate, { kind: 'dos' | 'dos-folder' }> }
  | { name: 'v86'; image: ArrayBuffer; media: 'floppy' | 'hdd' | 'cdrom' };

type DosMessage = { type: 'sa85-dos'; event: string };

export function UsbBoot({ device, support, showSummary, onFail, onReboot }: UsbBootProps) {
  const [stage, setStage] = useState<Stage>({ name: 'consent' });
  const [lines, setLines] = useState<string[]>([`Boot from ${device} ...`]);
  const callbacks = useRef({ onFail, onReboot });
  callbacks.current = { onFail, onReboot };
  const stageRef = useRef(stage);
  stageRef.current = stage;

  const log = (...text: string[]) => setLines((current) => [...current, ...text]);

  const boot = async (volume: UsbVolume, candidate: BootCandidate) => {
    setStage({ name: 'loading', volume, candidate });
    log(`Booting ${candidate.label} ...`);
    if (candidate.kind === 'dos' || candidate.kind === 'dos-folder') {
      setStage({ name: 'dos', candidate });
      return;
    }
    const buffer = candidate.kind === 'image'
      ? await candidate.file.arrayBuffer()
      : await extractZipEntry(candidate.file, candidate.entry);
    if (!buffer) {
      log('Unsupported boot media');
      window.setTimeout(() => callbacks.current.onFail(), 1200);
      return;
    }
    setStage({ name: 'v86', image: candidate.media === 'floppy' ? padFloppy(buffer) : buffer, media: candidate.media });
  };

  const answer = (allow: boolean) => {
    if (stageRef.current.name !== 'consent') return;
    if (!allow) {
      callbacks.current.onFail();
      return;
    }
    setStage({ name: 'reading' });
    // Der Aufruf muss synchron in der Nutzergeste starten, sonst verweigert der Browser den Ordnerdialog.
    void openUsbVolume(support).then(async (volume) => {
      if (!volume || !volume.files.length) {
        callbacks.current.onFail();
        return;
      }
      log(`USB Mass Storage Device : ${volume.name}`, `  ${volume.files.length}${volume.truncated ? '+' : ''} file(s) found, read-only`);
      const candidates = await findBootCandidates(volume);
      if (!candidates.length) {
        window.setTimeout(() => callbacks.current.onFail(), 900);
        return;
      }
      if (candidates.length === 1) {
        void boot(volume, candidates[0]);
        return;
      }
      setStage({ name: 'select', volume, candidates, selected: 0 });
    });
  };

  const answerRef = useRef(answer);
  answerRef.current = answer;
  const bootRef = useRef(boot);
  bootRef.current = boot;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const current = stageRef.current;
      if (current.name === 'consent') {
        const key = event.key.toLowerCase();
        if (key === 'enter' || key === 'y') {
          event.preventDefault();
          answerRef.current(true);
        } else if (key === 'escape' || key === 'n') {
          event.preventDefault();
          answerRef.current(false);
        }
        return;
      }
      if (current.name === 'select') {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          const step = event.key === 'ArrowDown' ? 1 : -1;
          setStage({ ...current, selected: (current.selected + step + current.candidates.length) % current.candidates.length });
        } else if (event.key === 'Enter') {
          event.preventDefault();
          void bootRef.current(current.volume, current.candidates[current.selected]);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          callbacks.current.onFail();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (stage.name === 'dos') {
    return <UsbDos candidate={stage.candidate} onFail={() => callbacks.current.onFail()} onExit={() => callbacks.current.onReboot()} />;
  }
  if (stage.name === 'v86') {
    return (
      <div className="usb-run">
        <V86Screen image={stage.image} media={stage.media} onError={() => callbacks.current.onFail()} />
        <ResetButton onReset={() => callbacks.current.onReboot()} />
      </div>
    );
  }

  const text: ReactNode = (
    <>
      <div className="summary-gap">{'\u00a0'}</div>
      {lines.map((line, index) => <div key={`${index}-${line}`}>{line}</div>)}
      {stage.name === 'select' ? (
        <div className="usb-select">
          <div>{'\u00a0'}</div>
          <div>Boot images found on the device:</div>
          {stage.candidates.map((candidate, index) => (
            <button
              key={candidate.label}
              type="button"
              className={index === stage.selected ? 'usb-candidate is-selected' : 'usb-candidate'}
              onClick={() => void boot(stage.volume, candidate)}
            >
              {`  ${index + 1}. ${candidate.label}`}
            </button>
          ))}
          <div>{'\u00a0'}</div>
          <div>{'\u2191\u2193 : Select   Enter : Boot   Esc : Cancel'}</div>
        </div>
      ) : null}
      {stage.name === 'reading' || stage.name === 'loading' ? <div><span className="blink">_</span></div> : null}
    </>
  );

  return (
    <div className="usb-boot">
      {showSummary ? (
        <SystemSummary settled>{text}</SystemSummary>
      ) : (
        <div className="bios-screen"><div className="bios-copy summary-copy">{text}</div></div>
      )}
      {stage.name === 'consent' ? <UsbConsent device={device} onAnswer={answer} /> : null}
    </div>
  );
}

type UsbDosProps = {
  candidate: Extract<BootCandidate, { kind: 'dos' | 'dos-folder' }>;
  onFail: () => void;
  onExit: () => void;
};

function UsbDos({ candidate, onFail, onExit }: UsbDosProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const callbacks = useRef({ onFail, onExit });
  callbacks.current = { onFail, onExit };

  useEffect(() => {
    const onMessage = (event: MessageEvent<DosMessage>) => {
      if (event.source !== frameRef.current?.contentWindow || event.data?.type !== 'sa85-dos') return;
      if (event.data.event === 'started') frameRef.current?.focus();
      if (event.data.event === 'rejected') callbacks.current.onFail();
      if (event.data.event === 'exit') callbacks.current.onExit();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const send = () => {
    const target = frameRef.current?.contentWindow;
    if (!target) return;
    const message = candidate.kind === 'dos'
      ? { type: 'sa85-dos', action: 'load', file: candidate.file }
      : { type: 'sa85-dos', action: 'files', files: candidate.files, name: candidate.label };
    target.postMessage(message, window.location.origin);
  };

  return (
    <div className="usb-run">
      <div className="dos-mode">
        <iframe ref={frameRef} src="/dos/index.html?mode=usb" title="USB-Boot (DOS)" allow="fullscreen; autoplay" onLoad={send} />
      </div>
      <ResetButton onReset={() => callbacks.current.onExit()} />
    </div>
  );
}

/** Wie der Reset-Taster am Gehäuse; zusätzlich startet Ctrl+Alt+Del bzw. EXIT in DOS neu. */
function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button type="button" className="usb-reset" onClick={onReset} title="Neustart (Ctrl+Alt+Del)">
      RESET
    </button>
  );
}
