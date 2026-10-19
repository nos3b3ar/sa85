import { useEffect, useRef, useState } from 'react';
import { PixelPowerButton } from './PixelPowerButton';

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
        <PixelPowerButton />
      </button>
      <div className="power-label">PRESS POWER</div>
      <div className="power-hint">ENTER startet · ESC überspringt den Start</div>
    </div>
  );
}
