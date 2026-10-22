import { useEffect, useRef, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import {
  enterBiosSetupSounds,
  fadeOutFan,
  playStartupSound,
  startBootSounds,
  stopBootSounds,
  unlockAudio,
} from './audio/audio';
import { BiosSetup, type SetupAccess } from './boot/BiosSetup';
import { BootFailure } from './boot/BootFailure';
import { PasswordPrompt, SystemHalted, VirusWarning, type PasswordResult } from './boot/BootPrompts';
import { BootScreen } from './boot/BootScreen';
import { getCmos, resolveBoot, takeChecksumError, updateCmosQuietly, type BootDevice, type BootTarget } from './boot/cmos';
import { DosMode } from './boot/DosMode';
import { CursorHost } from './cursors/CursorHost';
import { PointerTrail } from './cursors/PointerTrail';
import { PowerScreen } from './boot/PowerScreen';
import { ScanDisk } from './boot/ScanDisk';
import { ShutdownScreen } from './boot/ShutdownScreen';
import { SystemSummary } from './boot/SystemSummary';
import { UsbBoot } from './boot/UsbBoot';
import { usbSupport as detectUsbSupport } from './boot/usbBoot';
import { Desktop } from './desktop/Desktop';
import { LegalLinks } from './desktop/LegalLinks';
import { SplashScreen } from './splash/SplashScreen';
import { useSettings } from './settings/settings';
import { GlobalStyles } from './styles/global';
import { themes } from './styles/themes';

type Phase =
  | 'power'
  | 'black'
  | 'post'
  | 'password'
  | 'setup'
  | 'scandisk'
  | 'summary'
  | 'bootfail'
  | 'usb'
  | 'viruswarn'
  | 'halted'
  | 'splash'
  | 'desktop'
  | 'shutdown'
  | 'dos';

const fanStopBeforeDesktopMs = 1000;
/** Phasen, in denen ESC/Leertaste nicht zum Desktop springen: dort gehören die Tasten dem BIOS bzw. dem Gast. */
const noSkipPhases: Phase[] = ['power', 'setup', 'scandisk', 'desktop', 'shutdown', 'dos', 'bootfail', 'usb', 'viruswarn', 'halted'];
const rebootPhases: Phase[] = ['bootfail', 'halted', 'usb', 'password', 'viruswarn', 'summary', 'post'];

function appFromLocation() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/impressum' || path === '/datenschutz') return path.slice(1);
  return null;
}

function needsPassword(mode: 'setup' | 'system') {
  const cmos = getCmos();
  if (!cmos.supervisorPassword && !cmos.userPassword) return false;
  return mode === 'setup' || cmos.values.securityOption === 'System';
}

export default function App() {
  const [bootApp, setBootApp] = useState<string | null>(appFromLocation);
  const [phase, setPhase] = useState<Phase>(bootApp ? 'desktop' : 'power');
  const [bootId, setBootId] = useState(0);
  const [afterShutdown, setAfterShutdown] = useState<'off' | 'restart'>('off');
  const [usbSupport] = useState(detectUsbSupport);
  const [checksumError, setChecksumError] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'setup' | 'system'>('system');
  const [setupAccess, setSetupAccess] = useState<SetupAccess>('supervisor');
  const [setupView, setSetupView] = useState<'main' | 'oem'>('main');
  const [target, setTarget] = useState<BootTarget>({ kind: 'hdd' });
  const bootOverride = useRef<BootDevice | undefined>(undefined);
  const jinglePlayed = useRef(false);
  const desktopTimer = useRef(0);
  const { look, locale } = useSettings();
  const usbAvailable = usbSupport !== 'none';

  const playJingle = () => {
    jinglePlayed.current = true;
    void playStartupSound(look === '95' ? 'win95' : 'win98');
  };

  const enterDesktop = () => {
    unlockAudio();
    window.clearTimeout(desktopTimer.current);
    stopBootSounds();
    if (!jinglePlayed.current) playJingle();
    setPhase('desktop');
  };

  /** Überspringen respektiert die Boot-Reihenfolge: ohne bootfähige Systemplatte kein Windows. */
  const skipToDesktop = () => {
    const next = resolveBoot(getCmos(), usbAvailable, bootOverride.current);
    if (next.kind === 'hdd') {
      enterDesktop();
      return;
    }
    unlockAudio();
    enterBiosSetupSounds();
    setTarget(next);
    setPhase(next.kind === 'usb' ? 'usb' : 'bootfail');
  };

  const openLegal = (appId: string) => {
    setBootApp(appId);
    enterDesktop();
  };

  const linkTone = phase === 'splash' || (phase === 'shutdown' && afterShutdown === 'restart')
    ? 'splash'
    : phase === 'setup' || phase === 'scandisk' || (phase === 'password' && passwordMode === 'setup') ? 'setup' : 'bios';

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
    bootOverride.current = undefined;
    setChecksumError(takeChecksumError());
    setBootId((id) => id + 1);
    setPhase('black');
  };

  const openSetup = (access: SetupAccess, view: 'main' | 'oem' = 'main') => {
    setSetupAccess(access);
    setSetupView(view);
    setPhase('setup');
  };

  const requestSetup = () => {
    enterBiosSetupSounds();
    if (needsPassword('setup')) {
      setPasswordMode('setup');
      setPhase('password');
      return;
    }
    openSetup('supervisor');
  };

  const finishBoot = () => {
    const next = resolveBoot(getCmos(), usbAvailable, bootOverride.current);
    setTarget(next);
    if (next.kind === 'usb') setPhase('usb');
    else if (next.kind === 'fail') setPhase('bootfail');
    else setPhase(getCmos().virusWarningPending ? 'viruswarn' : 'splash');
  };

  const continueBoot = () => {
    if (getCmos().values.summaryScreen === 'Enabled') setPhase('summary');
    else finishBoot();
  };

  const postDone = (override?: BootDevice) => {
    bootOverride.current = override;
    if (needsPassword('system')) {
      setPasswordMode('system');
      setPhase('password');
      return;
    }
    continueBoot();
  };

  const passwordAccepted = (result: PasswordResult) => {
    if (passwordMode === 'setup' || result === 'oem') {
      openSetup(result === 'user' ? 'user' : 'supervisor', result === 'oem' ? 'oem' : 'main');
      return;
    }
    continueBoot();
  };

  const passwordFailed = () => {
    // Am Setup-Prompt bootet der Rechner nach drei Fehlversuchen einfach weiter, beim System-Prompt hält er an.
    if (passwordMode === 'setup') continueBoot();
    else setPhase('halted');
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
      if (event.ctrlKey && event.altKey && event.key === 'Delete' && rebootPhases.includes(phase)) {
        event.preventDefault();
        boot(false);
        return;
      }
      if (noSkipPhases.includes(phase)) return;
      if (event.key !== 'Escape' && event.key !== ' ') return;
      if (phase === 'password' && event.key === ' ') return;
      if (phase === 'post' && event.key === 'Escape' && getCmos().values.multiBoot === 'Enabled') return;
      event.preventDefault();
      skipToDesktop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  useEffect(() => {
    document.documentElement.dataset.look = look;
  }, [look]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const showSummary = getCmos().values.summaryScreen === 'Enabled';

  return (
    <ThemeProvider theme={themes[look]}>
      <GlobalStyles />
      <CursorHost />
      <PointerTrail />
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
            checksumError={checksumError}
            usbAvailable={usbAvailable}
            onDone={postDone}
            onSetup={requestSetup}
          />
        ) : null}
        {phase === 'password' ? (
          <PasswordPrompt key={passwordMode} mode={passwordMode} onSuccess={passwordAccepted} onFail={passwordFailed} />
        ) : null}
        {phase === 'setup' ? (
          <BiosSetup
            access={setupAccess}
            initialView={setupView}
            usbSupport={usbSupport}
            onExit={() => boot(false)}
            onScanDisk={() => setPhase('scandisk')}
          />
        ) : null}
        {phase === 'scandisk' ? <ScanDisk onDone={continueBoot} /> : null}
        {phase === 'summary' ? <SystemSummary onDone={finishBoot} /> : null}
        {phase === 'bootfail' ? (
          <BootFailure
            device={target.kind === 'fail' ? target.device : null}
            showSummary={showSummary}
            onSetup={requestSetup}
          />
        ) : null}
        {phase === 'usb' && target.kind === 'usb' ? (
          <UsbBoot
            key={bootId}
            device={target.device}
            support={usbSupport}
            showSummary={showSummary}
            onFail={() => {
              setTarget({ kind: 'fail', device: target.device });
              setPhase('bootfail');
            }}
            onReboot={() => boot(false)}
          />
        ) : null}
        {phase === 'viruswarn' ? (
          <VirusWarning
            onAnswer={() => {
              updateCmosQuietly({ virusWarningPending: false });
              setPhase('splash');
            }}
          />
        ) : null}
        {phase === 'halted' ? <SystemHalted /> : null}
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
