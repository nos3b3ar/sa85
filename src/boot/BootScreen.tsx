import { useEffect, useRef, useState } from 'react';
import { playKeyPress } from '../audio/audio';
import { BoardLogo } from './BoardLogo';
import { bootScript, formatMemory, machine } from './bootScript';
import { EnergyStarLogo } from './EnergyStarLogo';
import { wait, waitUntil } from './wait';

type BootScreenProps = {
  onDone: () => void;
  onSetup: () => void;
};

export function BootScreen({ onDone, onSetup }: BootScreenProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [cursor, setCursor] = useState(false);
  const onDoneRef = useRef(onDone);
  const onSetupRef = useRef(onSetup);
  onDoneRef.current = onDone;
  onSetupRef.current = onSetup;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const skipSlave = { current: false };
    let entered = false;
    let setupRequested = false;
    let selfTestDone = false;

    const enterSetup = () => {
      if (entered || signal.aborted) return;
      entered = true;
      controller.abort();
      onSetupRef.current();
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'F4') skipSlave.current = true;
      const isDelete = event.key === 'Delete' || event.key === 'Backspace';
      if (!isDelete) return;
      event.preventDefault();
      if (!event.repeat) playKeyPress();
      setupRequested = true;
      if (selfTestDone) enterSetup();
    };

    window.addEventListener('keydown', onKey);
    void run();

    return () => {
      controller.abort();
      window.removeEventListener('keydown', onKey);
    };

    function replaceLast(text: string) {
      setLines((prev) => [...prev.slice(0, -1), text]);
    }

    async function animateMemory() {
      await new Promise<void>((resolve, reject) => {
        const start = performance.now();
        let lastValue = -1;

        const step = (now: number) => {
          if (signal.aborted) {
            reject(new DOMException('aborted', 'AbortError'));
            return;
          }
          const progress = Math.min(1, (now - start) / bootScript.memoryDurationMs);
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
        setLines(bootScript.intro);
        await wait(bootScript.delays.beforeMemory, signal);

        setLines((prev) => [...prev, formatMemory(0, false)]);
        await animateMemory();
        replaceLast(formatMemory(machine.totalMemoryK, true));
        selfTestDone = true;
        if (setupRequested) {
          await wait(400, signal);
          enterSetup();
          return;
        }

        await wait(bootScript.delays.afterMemory, signal);
        for (const line of bootScript.pnp) {
          setLines((prev) => [...prev, line]);
          await wait(bootScript.delays.pnpLine, signal);
        }

        setLines((prev) => [...prev, bootScript.ideMaster]);
        await wait(bootScript.delays.beforeMasterValue, signal);
        replaceLast(bootScript.ideMaster + bootScript.ideMasterValue);

        await wait(bootScript.delays.beforeSlave, signal);
        setLines((prev) => [...prev, `${bootScript.ideSlave}${bootScript.ideSlaveValue}`]);
        setCursor(true);
        await waitUntil(() => skipSlave.current, bootScript.delays.slaveWait, signal);
        setCursor(false);
        await wait(bootScript.delays.beforeDone, signal);
        if (!signal.aborted) onDoneRef.current();
      } catch (error) {
        if (signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        throw error;
      }
    }
  }, []);

  return (
    <div className="bios-screen">
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
      <div className="bios-footer">
        <div>{bootScript.footerSetup}</div>
        <div>{bootScript.footerId}</div>
      </div>
    </div>
  );
}
