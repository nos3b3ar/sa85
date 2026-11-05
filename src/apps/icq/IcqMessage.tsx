import { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, GroupBox } from 'react95';
import { Unmute } from '@react95/icons/Unmute';
import { useLocaleTag } from '../../i18n';
import { IcqFloating } from './IcqFloating';
import { IcqFlower, IcqMessageIcon } from './IcqFlower';
import { useIcqText } from './strings';
import type { Contact, Identity, Line } from './types';

type MessageProps = {
  contact: Contact;
  me: Identity;
  lines: Line[];
  offset: number;
  awayMessage?: string;
  error?: string;
  onSend: (text: string) => boolean;
  onClose: () => void;
};

const maxLength = 240;

function Smiley() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="7" fill="#ffe21a" stroke="#000" />
      <circle cx="5.6" cy="6.3" r="1" fill="#000" />
      <circle cx="10.4" cy="6.3" r="1" fill="#000" />
      <path d="M4.6 9.4 Q8 12.8 11.4 9.4" fill="none" stroke="#000" strokeWidth="1.1" />
    </svg>
  );
}

/** Nachrichtenfenster im Stil der „Message Session“ von ICQ 2001b. */
export function IcqMessage({ contact, me, lines, offset, awayMessage, error, onSend, onClose }: MessageProps) {
  const text = useIcqText();
  const tag = useLocaleTag();
  const [draft, setDraft] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const stamp = (at: number) => new Date(at).toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' });

  const send = () => {
    const value = draft.trim();
    if (!value) return;
    if (onSend(value)) setDraft('');
    inputRef.current?.focus();
  };

  const addSmiley = () => {
    setDraft((value) => `${value}${value && !value.endsWith(' ') ? ' ' : ''}:-)`.slice(0, maxLength));
    inputRef.current?.focus();
  };

  return (
    <IcqFloating
      title={text.sessionTitle(contact.nick, text.statusShort[contact.status])}
      icon={<IcqMessageIcon />}
      width={540}
      offset={offset}
      closeLabel={text.close}
      onClose={onClose}
      className="icq-message"
    >
      <div className="icq-session-head">
        <span>{text.sessionTo}</span>
        <IcqFlower size={16} tone={contact.status} />
        <span className="icq-box is-uin">{contact.uin}</span>
        <span>{text.nick}:</span>
        <span className="icq-box is-nick">{contact.nick}</span>
        <span className="icq-session-email">{text.sessionEmail}</span>
        <span className="icq-box is-email">N\A</span>
      </div>

      <div className="icq-log" ref={logRef} role="log" aria-live="polite" aria-label={text.messageLog(contact.nick)}>
        {awayMessage ? (
          <p className="icq-away-banner">
            <b>{text.awayAuto}:</b> {awayMessage}
          </p>
        ) : null}
        {lines.length === 0 && !awayMessage ? <p className="icq-empty">{text.messageEmpty(contact.nick)}</p> : null}
        {lines.map((line) => (
          <div key={line.id} className={line.from === 'me' ? 'icq-line is-me' : 'icq-line'}>
            <b>
              {line.from === 'me' ? me.nick : contact.nick}({stamp(line.at)}) :
            </b>
            <span>{line.text}</span>
          </div>
        ))}
      </div>

      <div className="icq-session-split" aria-hidden />

      <div className="icq-session-tools">
        <span>{text.sessionChars}</span>
        <span className="icq-box is-count">{draft.length}</span>
        <span className="icq-tool-glyph" aria-hidden>
          <Unmute variant="16x16_4" />
        </span>
        <span className="icq-tool-sep" aria-hidden />
        <button type="button" className="icq-tool-glyph is-button" onClick={addSmiley} title={text.sessionSmiley} aria-label={text.sessionSmiley}>
          <Smiley />
        </button>
        <span className="icq-tool-sep" aria-hidden />
        <span className="icq-tool-glyph is-letter" aria-hidden>
          T
        </span>
        <span className="icq-tool-glyph is-letter is-red" aria-hidden>
          T
        </span>
        <span className="icq-session-tools-gap" />
        <Button size="sm" disabled>
          {text.sessionUserMenu}
        </Button>
        <Button size="sm" disabled>
          {text.sessionMsgMode}
        </Button>
        <Button size="sm" onClick={() => logRef.current?.scrollTo({ top: 0 })}>
          {text.sessionHistory}
        </Button>
      </div>

      <textarea
        id={`icq-draft-${contact.key}`}
        ref={inputRef}
        className="icq-session-input"
        aria-label={text.messageLabel}
        value={draft}
        rows={4}
        maxLength={maxLength}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
      />
      {error ? <p className="icq-note is-error">{error}</p> : null}

      <div className="icq-session-foot">
        <Button onClick={onClose} style={{ minWidth: 70 }}>
          {text.cancel}
        </Button>
        <Button disabled style={{ minWidth: 70 }}>
          {text.sessionTalk}
        </Button>
        <GroupBox label={text.sessionSendBy} className="icq-sendby">
          <Checkbox label="ICQ" checked readOnly />
          <Checkbox label="SMS" checked={false} disabled readOnly />
          <Checkbox label={text.sessionEmailOption} checked={false} disabled readOnly />
          <Button primary disabled={draft.trim().length === 0} onClick={send} style={{ minWidth: 76 }}>
            {text.send}
          </Button>
        </GroupBox>
        <span className="icq-session-avatar" aria-hidden>
          <IcqFlower size={40} tone={contact.status} />
        </span>
      </div>
    </IcqFloating>
  );
}
