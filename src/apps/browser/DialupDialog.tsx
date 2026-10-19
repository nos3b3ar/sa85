import { Rnaui101 } from '@react95/icons/Rnaui101';
import { useEffect, useState } from 'react';
import { Button, Checkbox, TextInput, Window, WindowContent, WindowHeader } from 'react95';

type DialupDialogProps = {
  onConnect: (remember: boolean) => void;
  onOffline: () => void;
  onPrivacy: () => void;
};

const stepText = {
  dialing: 'Wählen...',
  check: 'Benutzername und Kennwort werden überprüft...',
  up: 'Verbunden mit 56.000 bps',
};

export function DialupDialog({ onConnect, onOffline, onPrivacy }: DialupDialogProps) {
  const [remember, setRemember] = useState(false);
  const [step, setStep] = useState<keyof typeof stepText | null>(null);

  useEffect(() => {
    if (!step) return;
    const delay = step === 'up' ? 500 : 700;
    const timer = window.setTimeout(() => {
      if (step === 'dialing') setStep('check');
      else if (step === 'check') setStep('up');
      else onConnect(remember);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [step, remember, onConnect]);

  return (
    <Window className="dialup">
      <WindowHeader active className="app-window-header">
        <span className="app-window-title">
          <Rnaui101 variant="16x16_4" />
          <span>Verbindung herstellen</span>
        </span>
      </WindowHeader>
      <WindowContent>
        <div className="dialup-body">
          <Rnaui101 variant="32x32_4" />
          <div className="dialup-copy">
            {step ? (
              <p className="dialup-status">{stepText[step]}</p>
            ) : (
              <>
                <label className="dialup-row">
                  <span>Benutzername:</span>
                  <TextInput value="gast" disabled fullWidth />
                </label>
                <label className="dialup-row">
                  <span>Wählen von:</span>
                  <TextInput value="Koblenz" disabled fullWidth />
                </label>
                <Checkbox
                  label="Automatisch verbinden"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <p className="dialup-note">
                  Inhalte kommen vom Internet Archive (USA) und von Retro-Seiten. Dabei wird Ihre IP-Adresse übertragen, und diese Seiten können Cookies setzen.{' '}
                  <button type="button" className="text-link" onClick={onPrivacy}>Datenschutz</button>
                </p>
              </>
            )}
          </div>
        </div>
        {step ? null : (
          <div className="dialup-actions">
            <Button onClick={() => setStep('dialing')}>Verbinden</Button>
            <Button onClick={onOffline}>Offline arbeiten</Button>
          </div>
        )}
      </WindowContent>
    </Window>
  );
}
