import { useEffect, useRef } from 'react';

const wakeDelayMs = 600;

export function Standby({ onWake }: { onWake: () => void }) {
  const onWakeRef = useRef(onWake);
  onWakeRef.current = onWake;

  useEffect(() => {
    let armed = false;
    const arm = window.setTimeout(() => {
      armed = true;
    }, wakeDelayMs);
    const wake = (event: Event) => {
      if (!armed) return;
      event.preventDefault();
      event.stopPropagation();
      onWakeRef.current();
    };
    window.addEventListener('pointerdown', wake, true);
    window.addEventListener('keydown', wake, true);
    return () => {
      window.clearTimeout(arm);
      window.removeEventListener('pointerdown', wake, true);
      window.removeEventListener('keydown', wake, true);
    };
  }, []);

  return <div className="standby" aria-label="Standby" />;
}
