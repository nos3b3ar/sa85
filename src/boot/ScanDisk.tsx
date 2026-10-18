import { useEffect, useRef, useState } from 'react';

type ScanDiskProps = {
  onDone: () => void;
};

const areas = [
  { label: 'Datenträger-Beschreibung', weight: 0.04 },
  { label: 'Dateizuordnungstabellen', weight: 0.08 },
  { label: 'Verzeichnisstruktur', weight: 0.16 },
  { label: 'Dateisystem', weight: 0.08 },
  { label: 'Freier Speicherplatz', weight: 0.06 },
  { label: 'Oberflächenanalyse', weight: 0.58 },
];

const finishedPauseMs = 1600;

export function ScanDisk({ onDone }: ScanDiskProps) {
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focus, setFocus] = useState(0);
  const durationMs = useRef(10000 + Math.random() * 20000);
  const pausedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  pausedRef.current = paused;

  const finished = progress >= 1;

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let value = 0;
    const step = (now: number) => {
      const delta = now - last;
      last = now;
      if (!pausedRef.current) {
        // Unregelmäßiges Tempo wie bei echten Sektor-Lesezugriffen.
        const jitter = 0.35 + Math.random() * 1.3;
        value = Math.min(1, value + (delta / durationMs.current) * jitter);
        setProgress(value);
      }
      if (value < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!finished) return;
    const timer = window.setTimeout(() => onDoneRef.current(), finishedPauseMs);
    return () => window.clearTimeout(timer);
  }, [finished]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'escape' || key === 'b') {
        event.preventDefault();
        onDoneRef.current();
      } else if (key === 'a' && !finished) {
        setPaused((value) => !value);
      } else if (key === 'arrowright' || key === 'tab') {
        event.preventDefault();
        setFocus((value) => (value === 0 ? 2 : 0));
      } else if (key === 'arrowleft') {
        setFocus((value) => (value === 2 ? 0 : 2));
      } else if (key === 'enter') {
        event.preventDefault();
        if (focus === 2 || finished) onDoneRef.current();
        else setPaused((value) => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focus, finished]);

  let threshold = 0;
  const states = areas.map((area) => {
    const start = threshold;
    threshold += area.weight;
    if (progress >= threshold) return 'done';
    if (progress >= start) return 'active';
    return 'pending';
  });

  const percent = Math.floor(progress * 100);

  return (
    <div className="scandisk">
      <div className="scandisk-title">Microsoft ScanDisk</div>
      <div className="scandisk-rule" />
      {finished ? (
        <p className="scandisk-text">ScanDisk hat auf Laufwerk C keine Fehler gefunden.</p>
      ) : (
        <p className="scandisk-text">ScanDisk untersucht folgende Bereiche von Laufwerk C:</p>
      )}
      <ul className="scandisk-areas">
        {areas.map((area, index) => (
          <li key={area.label} className={`is-${states[index]}`}>
            <span className="scandisk-mark">
              {states[index] === 'done' ? '♦' : states[index] === 'active' ? '»' : ''}
            </span>
            {area.label}
          </li>
        ))}
      </ul>
      <div className="scandisk-buttons">
        <DosButton
          label={paused ? 'Fortsetzen' : 'Anhalten'}
          focused={focus === 0}
          disabled={finished}
          onClick={() => {
            setFocus(0);
            setPaused((value) => !value);
          }}
        />
        <DosButton label="Details" focused={false} disabled onClick={() => undefined} />
        <DosButton
          label="Beenden"
          focused={focus === 2}
          onClick={() => onDoneRef.current()}
        />
      </div>
      <div className="scandisk-rule" />
      <div className="scandisk-status">
        <span>{paused ? 'Angehalten' : `${percent}% abgeschlossen`}</span>
        <span className="scandisk-bar">
          <span style={{ width: `${percent}%` }} />
        </span>
      </div>
    </div>
  );
}

type DosButtonProps = {
  label: string;
  focused: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function DosButton({ label, focused, disabled, onClick }: DosButtonProps) {
  const className = ['dos-button', focused ? 'is-focused' : '', disabled ? 'is-disabled' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={className} disabled={disabled} onClick={onClick}>
      <span className="dos-arrow">{focused ? '◄' : '<'}</span>
      {' '}
      <span className="dos-hotkey">{label[0]}</span>
      {label.slice(1)}
      {' '}
      <span className="dos-arrow">{focused ? '►' : '>'}</span>
    </button>
  );
}
