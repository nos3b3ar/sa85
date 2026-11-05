import { FormEvent, useState } from 'react';
import { Mailnews2 } from '@react95/icons/Mailnews2';
import { Button, TextInput } from 'react95';
import { ContactSendError, sendContact, type ContactError } from '../contact/sendContact';
import { profile } from '../content/profile';
import { AlertDialog } from '../desktop/AlertDialog';
import { useSettings } from '../settings/settings';
import { Turnstile } from './shared/Turnstile';
import type { AppProps } from './types';

type Notice = {
  title: string;
  message: string;
};

const errorText: Record<ContactError, string> = {
  captcha: 'Die Sicherheitsprüfung ist abgelaufen oder fehlgeschlagen. Bitte bestätigen Sie sie erneut.',
  invalid: 'Bitte prüfen Sie Ihre Angaben.',
  rate: 'Von dieser Verbindung sind heute schon zwei Nachrichten angekommen. Bitte versuchen Sie es morgen erneut oder schreiben Sie direkt an ',
  mail: 'Die Nachricht konnte nicht gesendet werden. Bitte schreiben Sie direkt an ',
};

export function ContactApp({ onClose, openApp }: AppProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);
  const { locale } = useSettings();

  const resetCaptcha = () => {
    setToken(null);
    setCaptchaKey((key) => key + 1);
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (company.trim()) {
      setNotice({ title: 'Kontakt', message: 'Die Nachricht wurde in den Postausgang gelegt.' });
      return;
    }
    const error = validate(name, email, subject, message);
    if (error) {
      setNotice({ title: 'Kontakt', message: error });
      return;
    }
    if (!token) {
      setNotice({ title: 'Kontakt', message: 'Bitte bestätigen Sie zuerst die Sicherheitsprüfung unter der Nachricht.' });
      return;
    }
    setSending(true);
    try {
      await sendContact({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        company: '',
        token,
      });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setNotice({
        title: 'Kontakt',
        message: 'Die Nachricht wurde gesendet.',
      });
    } catch (error) {
      const reason = error instanceof ContactSendError ? error.reason : 'mail';
      const withAddress = reason === 'mail' || reason === 'rate';
      setNotice({ title: 'Kontakt', message: withAddress ? `${errorText[reason]}${profile.email}.` : errorText[reason] });
    } finally {
      setSending(false);
      resetCaptcha();
    }
  }

  return (
    <form className="mail-compose" onSubmit={(event) => void onSubmit(event)}>
      <div className="mail-toolbar">
        <Button type="submit" variant="thin" disabled={sending || !token} className="mail-tool">
          <Mailnews2 variant="32x32_4" />
          <span>{sending ? 'Sende...' : 'Senden'}</span>
        </Button>
        <Button type="button" variant="thin" onClick={onClose} className="mail-tool">
          <span className="mail-tool-cancel" aria-hidden="true">×</span>
          <span>Abbrechen</span>
        </Button>
      </div>
      <p className="form-note mail-privacy">
        Ihre Angaben werden nur zur Bearbeitung Ihrer Anfrage verwendet. Zum Schutz vor Spam prüft Cloudflare Turnstile die Anfrage. Details:{' '}
        <button type="button" className="text-link" onClick={() => openApp('datenschutz')}>Datenschutz</button>
      </p>
      <div className="mail-headers">
        <label className="form-row">
          <span>An:</span>
          <TextInput value={profile.email} readOnly fullWidth />
        </label>
        <label className="form-row">
          <span>Von:</span>
          <TextInput value={name} onChange={(event) => setName(event.target.value)} fullWidth placeholder="Ihr Name" />
        </label>
        <label className="form-row">
          <span>E-Mail:</span>
          <TextInput value={email} onChange={(event) => setEmail(event.target.value)} fullWidth type="email" />
        </label>
        <label className="form-row">
          <span>Betreff:</span>
          <TextInput value={subject} onChange={(event) => setSubject(event.target.value)} fullWidth />
        </label>
      </div>
      <TextInput
        className="mail-body"
        multiline
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        fullWidth
        aria-label="Nachricht"
      />
      <div className="mail-captcha">
        {captchaFailed ? (
          <p className="form-note">
            Die Sicherheitsprüfung von Cloudflare konnte nicht geladen werden. Bitte schreiben Sie direkt an {profile.email}.
          </p>
        ) : (
          <Turnstile
            key={captchaKey}
            language={locale}
            size="normal"
            className="mail-captcha-widget"
            onToken={(value) => {
              setToken(value);
              if (value) setCaptchaFailed(false);
            }}
            onError={() => setCaptchaFailed(true)}
          />
        )}
      </div>
      <div className="hp" aria-hidden="true">
        <label>
          Firma
          <input value={company} onChange={(event) => setCompany(event.target.value)} tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {notice ? (
        <AlertDialog title={notice.title} message={notice.message} onClose={() => setNotice(null)} />
      ) : null}
    </form>
  );
}

function validate(name: string, email: string, subject: string, message: string) {
  if (!name.trim()) return 'Bitte geben Sie einen Namen ein.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
  if (!subject.trim()) return 'Bitte geben Sie einen Betreff ein.';
  if (message.trim().length < 10) return 'Die Nachricht sollte etwas länger sein.';
  return null;
}
