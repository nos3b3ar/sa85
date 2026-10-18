import { useEffect, useRef } from 'react';
import { preloadManifest } from '../preload/manifest';
import { preloadAssets } from '../preload/preloadAssets';

type SplashScreenProps = {
  onSound: () => void;
  onDone: () => void;
};

const minimumMs = 3000;
const maximumMs = 10000;

export function SplashScreen({ onSound, onDone }: SplashScreenProps) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onSoundRef = useRef(onSound);
  onSoundRef.current = onSound;

  useEffect(() => {
    let cancelled = false;
    let finished = false;
    const started = performance.now();
    let restTimer = 0;

    const finish = () => {
      if (cancelled || finished) return;
      finished = true;
      window.clearTimeout(hardCap);
      window.clearTimeout(restTimer);
      window.clearTimeout(soundTimer);
      onDoneRef.current();
    };

    const soundTimer = window.setTimeout(() => onSoundRef.current(), minimumMs / 2);
    const hardCap = window.setTimeout(finish, maximumMs);
    void preloadAssets(preloadManifest).finally(() => {
      const elapsed = performance.now() - started;
      restTimer = window.setTimeout(finish, Math.max(0, minimumMs - elapsed));
    });

    return () => {
      cancelled = true;
      window.clearTimeout(hardCap);
      window.clearTimeout(restTimer);
      window.clearTimeout(soundTimer);
    };
  }, []);

  return (
    <div className="splash">
      <div className="splash-stage">
        <div className="splash-logo">
          <div className="splash-brand">Stefan<sup>®</sup></div>
          <div className="splash-word">
            <span>Andernach</span>
            <sup>®</sup>
            <span className="splash-number">85</span>
          </div>
        </div>
      </div>
      <div className="splash-bar" aria-hidden />
    </div>
  );
}
