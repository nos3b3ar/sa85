import { useEffect, useRef, useState } from 'react';
import { playFloppySeek, playKeyPress, playPostBeep } from '../audio/audio';
import { BoardLogo } from './BoardLogo';
import { bootScript, formatMemory, machine } from './bootScript';
import { floppyPresent, getCmos, primaryMasterName, type BootDevice } from './cmos';
import { EnergyStarLogo } from './EnergyStarLogo';
import { wait, waitUntil } from './wait';

type BootScreenProps = {
  /** Beim Laden des CMOS wurde ein Checksum-Fehler festgestellt; die Defaults sind bereits aktiv. */
  checksumError: boolean;
  usbAvailable: boolean;
  onDone: (override?: BootDevice) => void;
  onSetup: () => void;
};

const floppySeekMs = 420;

export function BootScreen({ checksumError, usbAvailable, onDone, onSetup }: BootScreenProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [cursor, setCursor] = useState(false);
  const [footer, setFooter] = useState<string | null>(null);
  const [bootMenu, setBootMenu] = useState<{ devices: BootDevice[]; selected: number } | null>(null);
  const onDoneRef = useRef(onDone);
  const onSetupRef = useRef(onSetup);
  const continueRef = useRef<(() => void) | null>(null);
  onDoneRef.current = onDone;
  onSetupRef.current = onSetup;

  const cmos = getCmos();
  const showSetupPrompt = cmos.values.setupPrompt === 'Enabled';

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const { values } = getCmos();
    const quick = values.quickPost === 'Enabled';
    const scale = quick ? 0.55 : 1;
    const multiBoot = values.multiBoot === 'Enabled';
    const skipSlave = { current: false };
    const resume = { current: false };
    let entered = false;
    let setupRequested = false;
    let selfTestDone = false;
    let bootMenuRequested = false;
    let menu: { devices: BootDevice[]; selected: number } | null = null;

    const enterSetup = () => {
      if (entered || signal.aborted) return;
      entered = true;
      controller.abort();
      onSetupRef.current();
    };

    continueRef.current = () => {
      resume.current = true;
    };

    const onKey = (event: KeyboardEvent) => {
      if (menu) {
        handleMenuKey(event);
        return;
      }
      if (event.key === 'F4') skipSlave.current = true;
      if (event.key === 'F1') resume.current = true;
      if (event.key === 'Escape' && multiBoot) {
        event.preventDefault();
        bootMenuRequested = true;
        return;
      }
      const isDelete = event.key === 'Delete' || event.key === 'Backspace';
      if (!isDelete) return;
      event.preventDefault();
      if (!event.repeat) playKeyPress();
      setupRequested = true;
      if (selfTestDone) enterSetup();
    };

    const handleMenuKey = (event: KeyboardEvent) => {
      if (!menu) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        menu = { ...menu, selected: (menu.selected + step + menu.devices.length) % menu.devices.length };
        setBootMenu(menu);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const device = menu.devices[menu.selected];
        menu = null;
        setBootMenu(null);
        onDoneRef.current(device);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        menu = null;
        setBootMenu(null);
        onDoneRef.current();
      }
    };

    window.addEventListener('keydown', onKey);
    void run();

    return () => {
      controller.abort();
      continueRef.current = null;
      window.removeEventListener('keydown', onKey);
    };

    function replaceLast(text: string) {
      setLines((prev) => [...prev.slice(0, -1), text]);
    }

    function append(...text: string[]) {
      setLines((prev) => [...prev, ...text]);
    }

    async function animateMemory(durationMs: number) {
      await new Promise<void>((resolve, reject) => {
        const start = performance.now();
        let lastValue = -1;

        const step = (now: number) => {
          if (signal.aborted) {
            reject(new DOMException('aborted', 'AbortError'));
            return;
          }
          const progress = Math.min(1, (now - start) / durationMs);
          const value = Math.min(
            machine.totalMemoryK,
            Math.round((progress * machine.totalMemoryK) / 64) * 64,
          );
          if (value !== lastValue) {
            lastValue = value;
            const done = progress >= 1;
            replaceLast(formatMemory(done ? machine.totalMemoryK : value, done));
          }
          if (progress < 1) requestAnimationFrame(step);
          else resolve();
        };

        requestAnimationFrame(step);
      });
    }

    async function run() {
      try {
        const cmosNow = getCmos();
        setLines(bootScript.intro);
        await wait(bootScript.delays.beforeMemory, signal);

        append(formatMemory(0, false));
        await animateMemory(quick ? bootScript.quickMemoryDurationMs : bootScript.memoryDurationMs);
        replaceLast(formatMemory(machine.totalMemoryK, true));
        playPostBeep();
        selfTestDone = true;
        if (setupRequested) {
          await wait(400, signal);
          enterSetup();
          return;
        }

        if (values.floppySeek === 'Enabled' && floppyPresent(cmosNow)) {
          playFloppySeek();
          await wait(floppySeekMs, signal);
        }

        await wait(bootScript.delays.afterMemory * scale, signal);
        for (const line of bootScript.pnp) {
          append(line);
          await wait(bootScript.delays.pnpLine * scale, signal);
        }

        if (values.onchipPrimaryIde === 'Enabled') {
          append(bootScript.ideMaster);
          await wait(bootScript.delays.beforeMasterValue * scale, signal);
          replaceLast(bootScript.ideMaster + primaryMasterName(cmosNow));

          await wait(bootScript.delays.beforeSlave * scale, signal);
          append(`${bootScript.ideSlave}${bootScript.ideSlaveValue}`);
          setCursor(true);
          await waitUntil(() => skipSlave.current, bootScript.delays.slaveWait * scale, signal);
          setCursor(false);
        }

        if (checksumError) {
          append('', bootScript.checksumError);
          if (values.haltOn !== 'No Errors') {
            setFooter(bootScript.footerResume);
            await waitUntil(() => resume.current || setupRequested, 24 * 60 * 60 * 1000, signal);
            setFooter(null);
            if (setupRequested) {
              enterSetup();
              return;
            }
          }
        }

        await wait(bootScript.delays.beforeDone * scale, signal);
        if (signal.aborted) return;
        if (bootMenuRequested) {
          const devices: BootDevice[] = ['HDD-0', 'CDROM', 'Floppy'];
          if (usbAvailable) devices.push('USB-HDD');
          menu = { devices, selected: 0 };
          setBootMenu(menu);
          return;
        }
        onDoneRef.current();
      } catch (error) {
        if (signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        throw error;
      }
    }
  }, [checksumError, usbAvailable]);

  return (
    <div className="bios-screen" onClick={() => continueRef.current?.()}>
      <BoardLogo />
      <EnergyStarLogo />
      <div className="bios-copy">
        {lines.map((line, index) => (
          <div key={`${index}-${line}`} className={line.includes('GREEN AGP') ? 'bios-bright' : undefined}>
            {line || '\u00a0'}
            {cursor && index === lines.length - 1 ? <span className="blink">_</span> : null}
          </div>
        ))}
      </div>
      {bootMenu ? <BootMenu devices={bootMenu.devices} selected={bootMenu.selected} /> : null}
      <div className="bios-footer">
        <div>{footer ?? (showSetupPrompt ? bootScript.footerSetup : '\u00a0')}</div>
        <div>{bootScript.footerId}</div>
      </div>
    </div>
  );
}

function BootMenu({ devices, selected }: { devices: BootDevice[]; selected: number }) {
  const width = 30;
  const row = (text: string) => `\u2551 ${text.padEnd(width - 4)} \u2551`;
  return (
    <div className="boot-menu" role="menu" aria-label="Boot Menu">
      <div>{`\u2554${'\u2550'.repeat(9)} Boot Menu ${'\u2550'.repeat(width - 21)}\u2557`}</div>
      <div>{row('')}</div>
      {devices.map((device, index) => {
        const label = `${index + 1}. ${device === 'HDD-0' ? `HDD-0  ${machine.hddModel}` : device}`;
        return (
          <div key={device} className={index === selected ? 'boot-menu-item is-selected' : 'boot-menu-item'}>
            {row(label)}
          </div>
        );
      })}
      <div>{row('')}</div>
      <div>{`\u255a${'\u2550'.repeat(width - 2)}\u255d`}</div>
      <div>{'  \u2191\u2193 : Select    Enter : Boot'}</div>
    </div>
  );
}
