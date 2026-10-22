import { useEffect, useRef, useState } from 'react';
import { oemPasswords } from './BiosSetup';
import { getCmos } from './cmos';
import './bios.css';

export type PasswordResult = 'supervisor' | 'user' | 'oem';

type PasswordPromptProps = {
  mode: 'setup' | 'system';
  onSuccess: (result: PasswordResult) => void;
  onFail: () => void;
};

const maxAttempts = 3;
// Die werkseitigen Generalpasswörter der Award-BIOSe jener Jahre.
const backdoors = ['AWARD_SW', 'j262', 'lkwpeter'];

export function checkPassword(value: string): PasswordResult | null {
  const { supervisorPassword, userPassword } = getCmos();
  if (oemPasswords.includes(value)) return 'oem';
  if (backdoors.includes(value)) return 'supervisor';
  if (supervisorPassword && value === supervisorPassword) return 'supervisor';
  if (userPassword && value === userPassword) return supervisorPassword ? 'user' : 'supervisor';
  return null;
}

export function PasswordPrompt({ mode, onSuccess, onFail }: PasswordPromptProps) {
  const [value, setValue] = useState('');
  const attempts = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;
  const callbacks = useRef({ onSuccess, onFail });
  callbacks.current = { onSuccess, onFail };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return;
      event.preventDefault();
      if (event.key === 'Enter') {
        const result = checkPassword(valueRef.current);
        if (result) {
          callbacks.current.onSuccess(result);
          return;
        }
        attempts.current += 1;
        setValue('');
        if (attempts.current >= maxAttempts) callbacks.current.onFail();
      } else if (event.key === 'Backspace') {
        setValue((current) => current.slice(0, -1));
      } else if (event.key.length === 1) {
        setValue((current) => (current.length < 8 ? current + event.key : current));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const prompt = (
    <p className="password-line">
      {'Enter Password: '}
      <span className="password-stars">{'*'.repeat(value.length)}</span>
      <span className="blink">_</span>
    </p>
  );

  if (mode === 'setup') {
    return (
      <div className="setup-screen">
        <div className="bios-box setup-confirm">{prompt}</div>
      </div>
    );
  }
  return (
    <div className="bios-screen">
      <div className="bios-copy summary-copy password-system">{prompt}</div>
    </div>
  );
}

/** Nach drei falschen Passwörtern bleibt der Rechner stehen; nur Ctrl+Alt+Del oder der Netzschalter helfen. */
export function SystemHalted() {
  return (
    <div className="bios-screen">
      <div className="bios-copy summary-copy"><span className="blink">_</span></div>
    </div>
  );
}

type VirusWarningProps = { onAnswer: (accept: boolean) => void };

export function VirusWarning({ onAnswer }: VirusWarningProps) {
  const onAnswerRef = useRef(onAnswer);
  onAnswerRef.current = onAnswer;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key !== 'y' && key !== 'n') return;
      event.preventDefault();
      onAnswerRef.current(key === 'y');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="bios-screen">
      <div className="bios-copy summary-copy">
        <div className="virus-warning">
          <div>{'                  ! WARNING !'}</div>
          <div>{'       Disk boot sector is to be modified'}</div>
          <div>
            {'  Type "'}
            <button type="button" className="virus-key" onClick={() => onAnswer(true)}>Y</button>
            {'" to accept write or "'}
            <button type="button" className="virus-key" onClick={() => onAnswer(false)}>N</button>
            {'" to abort write'}
          </div>
          <div>{'                                Award Software, Inc.'}</div>
        </div>
      </div>
    </div>
  );
}
