import { useEffect, useRef, useState } from 'react';

type PowerScreenProps = {
  onPower: () => void;
  onSkip: () => void;
};

export function PowerScreen({ onPower, onSkip }: PowerScreenProps) {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const onPowerRef = useRef(onPower);
  const onSkipRef = useRef(onSkip);
  onPowerRef.current = onPower;
  onSkipRef.current = onSkip;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onSkipRef.current();
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        power();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function power() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    onPowerRef.current();
  }

  return (
    <div className="power-screen">
      <div className="power-mark">SA85</div>
      <button className="power-btn" type="button" onClick={power} disabled={busy} aria-label="Einschalten">
        <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden>
          <path
            d="M21 6v14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M13 11a13 13 0 1 0 16 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <div>PRESS POWER</div>
      <div className="power-hint">ENTER startet · ESC überspringt den Start</div>
    </div>
  );
}
