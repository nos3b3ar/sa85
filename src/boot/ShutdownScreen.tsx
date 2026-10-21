import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../settings/settings';
import { SplashStage } from '../splash/SplashScreen';

type ShutdownScreenProps = {
  /** Bei „off“ folgt nach dem Herunterfahren der Hinweis zum Ausschalten. */
  then: 'off' | 'restart';
  onDone: () => void;
};

const waitMs = 2800;
const offMs = 5000;

export function ShutdownScreen({ then, onDone }: ShutdownScreenProps) {
  const { look } = useSettings();
  const [stage, setStage] = useState<'wait' | 'off'>('wait');
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const timer = window.setTimeout(() => (then === 'off' ? setStage('off') : onDoneRef.current()), waitMs);
    return () => window.clearTimeout(timer);
  }, [then]);

  useEffect(() => {
    if (stage !== 'off') return;
    const done = () => onDoneRef.current();
    const timer = window.setTimeout(done, offMs);
    window.addEventListener('pointerdown', done);
    window.addEventListener('keydown', done);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', done);
      window.removeEventListener('keydown', done);
    };
  }, [stage]);

  if (stage === 'off') {
    return (
      <div className="shutdown-off">
        <p>Sie können den Computer jetzt ausschalten.</p>
      </div>
    );
  }

  return (
    <div className="splash shutdown-wait">
      <SplashStage>
        <p className="shutdown-wait-text">
          {look === '95' ? 'Bitte warten Sie, während der Computer heruntergefahren wird.' : 'Windows wird heruntergefahren.'}
        </p>
      </SplashStage>
    </div>
  );
}
