import { useEffect, useState, type FormEvent } from 'react';
import { Button, Checkbox, TextInput } from 'react95';
import { loadNet, netConfigured } from './config';
import { nickPattern, randomIdentity, uinPattern } from './data';
import { IcqFlower } from './IcqFlower';
import { useIcqLang, useIcqText } from './strings';
import { Turnstile } from '../shared/Turnstile';
import type { Identity } from './types';

type LoginProps = {
  initial: Identity;
  initialOptIn: boolean;
  onLogin: (identity: Identity, optIn: boolean, captchaToken?: string) => void;
  onCancel: () => void;
};

type Captcha = 'unknown' | 'needed' | 'skip' | 'failed';

export function IcqLogin({ initial, initialOptIn, onLogin, onCancel }: LoginProps) {
  const text = useIcqText();
  const lang = useIcqLang();
  const [uin, setUin] = useState(initial.uin);
  const [nick, setNick] = useState(initial.nick);
  const [optIn, setOptIn] = useState(initialOptIn && netConfigured);
  const [captcha, setCaptcha] = useState<Captcha>('unknown');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!optIn || captcha !== 'unknown') return;
    let cancelled = false;
    loadNet()
      .then((net) => net.hasSession())
      .then((has) => !cancelled && setCaptcha(has ? 'skip' : 'needed'))
      .catch(() => !cancelled && setCaptcha('needed'));
    return () => {
      cancelled = true;
    };
  }, [optIn, captcha]);

  const valid = uinPattern.test(uin) && nickPattern.test(nick.trim());
  const waiting = optIn && (captcha === 'unknown' || (captcha === 'needed' && !token));
  const blocked = optIn && captcha === 'failed';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid || waiting || blocked) return;
    onLogin({ uin, nick: nick.trim() }, optIn, captcha === 'needed' ? token ?? undefined : undefined);
  };

  return (
    <form className="icq-login" onSubmit={submit}>
      <div className="icq-login-head">
        <IcqFlower size={40} />
        <div>
          <b>ICQ 2001b</b>
          <p>{text.loginIntro}</p>
        </div>
      </div>
      <label className="icq-field">
        <span>{text.uin}</span>
        <TextInput
          value={uin}
          inputMode="numeric"
          maxLength={9}
          onChange={(event) => setUin(event.target.value.replace(/\D/g, ''))}
          fullWidth
        />
      </label>
      <label className="icq-field">
        <span>{text.nick}</span>
        <TextInput value={nick} maxLength={20} onChange={(event) => setNick(event.target.value)} fullWidth />
      </label>
      <Button
        type="button"
        className="icq-reroll"
        onClick={() => {
          const next = randomIdentity();
          setUin(next.uin);
          setNick(next.nick);
        }}
      >
        {text.reroll}
      </Button>
      <div className="icq-optin">
        <Checkbox
          label={text.optIn}
          checked={optIn}
          disabled={!netConfigured}
          onChange={(event) => {
            setOptIn(event.target.checked);
            if (captcha === 'failed') setCaptcha('unknown');
          }}
        />
        <p className="icq-note">{netConfigured ? text.optInNote : text.optInOff}</p>
        {optIn && captcha === 'needed' ? (
          <>
            {!token ? <p className="icq-note">{text.captchaWait}</p> : null}
            <Turnstile language={lang} onToken={setToken} onError={() => setCaptcha('failed')} />
          </>
        ) : null}
        {blocked ? <p className="icq-note is-error">{text.captchaFailed}</p> : null}
      </div>
      <div className="icq-login-actions">
        <Button type="submit" primary disabled={!valid || waiting || blocked} style={{ minWidth: 84 }}>
          {text.connect}
        </Button>
        <Button type="button" onClick={onCancel} style={{ minWidth: 84 }}>
          {text.cancel}
        </Button>
      </div>
    </form>
  );
}
