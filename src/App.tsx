import { useEffect, useRef, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import original from 'react95/dist/themes/original';
import {
  enterBiosSetupSounds,
  fadeOutFan,
  playStartupSound,
  startBootSounds,
  stopBootSounds,
  unlockAudio,
} from './audio/audio';
import { BiosSetup } from './boot/BiosSetup';
import { BootScreen } from './boot/BootScreen';
import { DosMode } from './boot/DosMode';
import { PowerScreen } from './boot/PowerScreen';
import { ScanDisk } from './boot/ScanDisk';
import { ShutdownScreen } from './boot/ShutdownScreen';
import { SystemSummary } from './boot/SystemSummary';
import { Desktop } from './desktop/Desktop';
import { LegalLinks } from './desktop/LegalLinks';
import { SplashScreen } from './splash/SplashScreen';
import { GlobalStyles } from './styles/global';

type Phase =
  | 'power'
  | 'black'
  | 'post'
  | 'setup'
  | 'scandisk'
  | 'summary'
  | 'splash'
  | 'desktop'
  | 'shutdown'
  | 'dos';

const fanStopBeforeDesktopMs = 1000;

function appFromLocation() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/impressum' || path === '/datenschutz') return path.slice(1);
  return null;
}

export default function App() {
  const [bootApp, setBootApp] = useState<string | null>(appFromLocation);
  const [phase, setPhase] = useState<Phase>(bootApp ? 'desktop' : 'power');
  const [bootId, setBootId] = useState(0);
  const [afterShutdown, setAfterShutdown] = useState<'off' | 'restart'>('off');
  const jinglePlayed = useRef(false);
  const desktopTimer = useRef(0);

  const playJingle = () => {
    jinglePlayed.current = true;
    void playStartupSound('win98');
  };

  const skipToDesktop = () => {
    unlockAudio();
    window.clearTimeout(desktopTimer.current);
    stopBootSounds();
    if (!jinglePlayed.current) playJingle();
    setPhase('desktop');
  };

  const openLegal = (appId: string) => {
    setBootApp(appId);
    skipToDesktop();
  };

  const linkTone = phase === 'splash' || (phase === 'shutdown' && afterShutdown === 'restart')
    ? 'splash'
    : phase === 'setup' || phase === 'scandisk' ? 'setup' : 'bios';

  const shutDown = (choice: 'shutdown' | 'restart' | 'dos') => {
    stopBootSounds();
    if (choice === 'dos') {
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
      setPhase('dos');
      return;
    }
    setAfterShutdown(choice === 'restart' ? 'restart' : 'off');
    setPhase('shutdown');
  };

  const leaveDosMode = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    boot(false);
  };

  const boot = (withPowerButton: boolean) => {
    unlockAudio();
    window.clearTimeout(desktopTimer.current);
    startBootSounds({ withPowerButton });
    jinglePlayed.current = false;
    setBootId((id) => id + 1);
    setPhase('black');
  };

  useEffect(() => {
    if (phase !== 'black') return;
    let cancelled = false;
    const fontReady = Promise.race([
      document.fonts.load('16px "IBM VGA 8x16"').catch(() => undefined),
      new Promise((resolve) => window.setTimeout(resolve, 1200)),
    ]);
    const blackout = new Promise((resolve) => window.setTimeout(resolve, 1200));
    void Promise.all([fontReady, blackout]).then(() => {
      if (!cancelled) setPhase('post');
    });
    return () => {
      cancelled = true;
    };
  }, [phase, bootId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (['power', 'setup', 'scandisk', 'desktop', 'shutdown', 'dos'].includes(phase)) return;
      if (event.key !== 'Escape' && event.key !== ' ') return;
      event.preventDefault();
      skipToDesktop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  return (
    <ThemeProvider theme={original}>
      <GlobalStyles />
      <div className="shell">
        {phase === 'power' ? (
          <PowerScreen
            onPower={() => boot(true)}
            onSkip={skipToDesktop}
          />
        ) : null}
        {phase === 'post' ? (
          <BootScreen
            key={bootId}
            onDone={() => setPhase('summary')}
            onSetup={() => {
              enterBiosSetupSounds();
              setPhase('setup');
            }}
          />
        ) : null}
        {phase === 'setup' ? (
          <BiosSetup onExit={() => boot(false)} onScanDisk={() => setPhase('scandisk')} />
        ) : null}
        {phase === 'scandisk' ? <ScanDisk onDone={() => setPhase('summary')} /> : null}
        {phase === 'summary' ? <SystemSummary onDone={() => setPhase('splash')} /> : null}
        {phase === 'splash' ? (
          <SplashScreen
            onSound={playJingle}
            onDone={() => {
              fadeOutFan();
              desktopTimer.current = window.setTimeout(() => setPhase('desktop'), fanStopBeforeDesktopMs);
            }}
          />
        ) : null}
        {phase === 'desktop' ? (
          <Desktop
            initialApp={bootApp}
            onInitialAppOpened={() => setBootApp(null)}
            onShutdown={shutDown}
          />
        ) : null}
        {phase === 'shutdown' ? (
          <ShutdownScreen
            then={afterShutdown}
            onDone={() => (afterShutdown === 'restart' ? boot(false) : setPhase('power'))}
          />
        ) : null}
        {phase === 'dos' ? <DosMode onExit={leaveDosMode} /> : null}
        {phase === 'desktop' ? null : (
          <LegalLinks tone={linkTone} onOpen={openLegal} />
        )}
      </div>
    </ThemeProvider>
  );
}
