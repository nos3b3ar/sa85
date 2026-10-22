import { useEffect, useRef, useState } from 'react';
import { machine } from '../bootScript';
import { quantumModel, type Cmos } from '../cmos';
import { geometryColumns, hddGeometry } from './pages';

type IdeDetectProps = {
  cmos: Cmos;
  onDone: (patch: Record<string, string> | null) => void;
};

const channels = ['Primary Master', 'Primary Slave', 'Secondary Master', 'Secondary Slave'] as const;
const modes = [
  { key: '2', label: '2(Y)', mode: 'LBA' },
  { key: '1', label: ' 1  ', mode: 'NORMAL' },
  { key: '3', label: ' 3  ', mode: 'LARGE' },
];
/** Einmal in fünfzig Läufen meldet die Erkennung eine fremde Platte, von der nichts bootet. */
const ghostChance = 1 / 50;

export function IdeDetect({ cmos, onDone }: IdeDetectProps) {
  const [channel, setChannel] = useState(0);
  const [detecting, setDetecting] = useState(true);
  const [answer, setAnswer] = useState('N');
  const [model] = useState(() => (Math.random() < ghostChance ? quantumModel : machine.hddModel));
  const patch = useRef<Record<string, string>>({});
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const found = channel === 0 && cmos.values.onchipPrimaryIde === 'Enabled';

  useEffect(() => {
    setDetecting(true);
    setAnswer('N');
    const timer = window.setTimeout(() => {
      setDetecting(false);
      if (channel === 0) return;
      // Die übrigen Kanäle melden keine Festplatte; ATAPI-Laufwerke erkennt Auto Detection nicht.
      if (channel < channels.length - 1) setChannel(channel + 1);
      else onDoneRef.current(Object.keys(patch.current).length ? patch.current : null);
    }, channel === 0 ? 1400 : 700);
    return () => window.clearTimeout(timer);
  }, [channel]);

  const choose = (value: string) => {
    const choice = value.toUpperCase();
    if (choice === 'N') {
      patch.current = { primaryMaster: 'None' };
    } else {
      const mode = modes.find((item) => item.key === (choice === 'Y' ? '2' : choice));
      if (!mode) return;
      patch.current = { primaryMaster: 'User', hddModel: model, hddMode: mode.mode };
    }
    setChannel(1);
  };

  const chooseRef = useRef(choose);
  chooseRef.current = choose;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.length === 1 || ['Escape', 'Enter'].includes(event.key)) event.preventDefault();
      if (event.key === 'Escape') {
        onDoneRef.current(null);
        return;
      }
      if (channel !== 0 || detecting) return;
      if (!found) {
        if (event.key === 'Enter') setChannel(1);
        return;
      }
      const key = event.key.toUpperCase();
      if (['1', '2', '3', 'Y', 'N'].includes(key)) setAnswer(key);
      if (event.key === 'Enter') chooseRef.current(answer);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, channel, detecting, found]);

  const name = channels[channel];
  const showOptions = channel === 0 && !detecting && found;

  return (
    <div className="ide-detect">
      <div className="setup-row">{`${'HARD DISKS'.padEnd(19)}TYPE SIZE  CYLS HEAD PRECOMP LANDZ SECTOR  MODE`}</div>
      <div className="setup-row">{`${name.padEnd(16)} : ${detecting || showOptions ? '' : 'None'}`}</div>
      <div className="setup-row">{'\u00a0'}</div>
      {detecting ? (
        <div className="setup-row">{`Detecting HDD ${name} ...`}<span className="blink">_</span></div>
      ) : null}
      {showOptions ? (
        <>
          <div className="setup-row ide-prompt">
            {`Select ${name} Option (N=Skip) : `}
            <span className="setup-value is-selected">{answer}</span>
          </div>
          <div className="setup-row">{'\u00a0'}</div>
          <div className="setup-row">{` OPTIONS ${'SIZE'.padStart(5)}  CYLS HEAD PRECOMP LANDZ SECTOR  MODE`}</div>
          {modes.map((item) => (
            <button key={item.key} type="button" className="setup-row ide-option" onClick={() => choose(item.key)}>
              {`  ${item.label}  ${geometryColumns(hddGeometry(model, item.mode), item.mode)}`}
            </button>
          ))}
          <div className="setup-row">{'\u00a0'}</div>
          <div className="setup-row">{`  ${model}`}</div>
          <div className="setup-row">{'\u00a0'}</div>
          <div className="setup-row">Note: Some OSes (like SCO-UNIX) must use &quot;NORMAL&quot; for installation</div>
          <button type="button" className="setup-row ide-option" onClick={() => choose('N')}>{'  N = Skip'}</button>
        </>
      ) : null}
      {channel === 0 && !detecting && !found ? (
        <div className="setup-row">{'No IDE device found. Press ENTER to continue.'}</div>
      ) : null}
      <div className="ide-footer">ESC : Skip</div>
    </div>
  );
}
