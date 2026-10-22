import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { ProgressBar } from 'react95';
import { useLocaleTag } from '../i18n';
import type { AppProps } from './types';
import {
  bootLines,
  friends,
  myNick,
  myUin,
  pickReply,
  replyDelay,
  statusLabel,
  type Friend,
  type FriendStatus,
} from './icq/data';
import { IcqFlower } from './icq/IcqFlower';

type Phase = 'boot' | 'list' | 'chat';
type SelfStatus = FriendStatus | 'invisible';
type Line = { id: number; from: 'me' | 'them'; text: string; at: number };

const selfStatusOptions: { value: SelfStatus; label: string }[] = [
  { value: 'online', label: 'Online' },
  { value: 'away', label: 'Abwesend' },
  { value: 'na', label: 'Beschäftigt' },
  { value: 'invisible', label: 'Unsichtbar' },
];

const groups: FriendStatus[] = ['online', 'away', 'na', 'offline'];

function IcqButton({
  children,
  disabled,
  onClick,
}: {
  children: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const fire = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    onClick();
  };
  return (
    <button type="button" className="icq-btn" disabled={disabled} onPointerDown={fire}>
      {children}
    </button>
  );
}

function HandyClock() {
  const tag = useLocaleTag();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const clock = new Date(now).toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' });
  return <time dateTime={new Date(now).toISOString()}>{clock}</time>;
}

export function IcqApp(_props: AppProps) {
  const [phase, setPhase] = useState<Phase>('boot');
  const [bootKey, setBootKey] = useState(0);
  const [friendId, setFriendId] = useState<string | null>(null);
  const [selfStatus, setSelfStatus] = useState<SelfStatus>('online');
  const [about, setAbout] = useState(false);
  const [threads, setThreads] = useState<Record<string, Line[]>>({});
  const [draft, setDraft] = useState('');
  const lineId = useRef(1);
  const lastReply = useRef<Record<string, string>>({});
  const timers = useRef<number[]>([]);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const active = friends.find((friend) => friend.id === friendId) ?? null;

  const showList = () => {
    setAbout(false);
    setPhase('list');
  };

  const reboot = () => {
    setAbout(false);
    setFriendId(null);
    setDraft('');
    setPhase('boot');
    setBootKey((key) => key + 1);
  };

  const openChat = (id: string) => {
    setAbout(false);
    setFriendId(id);
    setDraft('');
    setPhase('chat');
  };

  const pushLine = useCallback((id: string, from: Line['from'], text: string) => {
    const line: Line = { id: lineId.current++, from, text, at: Date.now() };
    setThreads((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), line] }));
  }, []);

  const send = () => {
    if (!active) return;
    const text = draft.trim();
    if (!text) return;
    const friend = active;
    pushLine(friend.id, 'me', text);
    setDraft('');
    const timer = window.setTimeout(() => {
      const reply = pickReply(friend.status, lastReply.current[friend.id]);
      lastReply.current[friend.id] = reply;
      pushLine(friend.id, 'them', reply);
    }, replyDelay(friend.status));
    timers.current.push(timer);
  };

  return (
    <div className="winmp">
      <div className="winmp-case">
        <div className="winmp-top">
          <span className="winmp-antenna" aria-hidden />
          <span className="winmp-brand">WinMP Handy</span>
          <span className={phase === 'boot' ? 'winmp-led is-busy' : 'winmp-led'} title={phase === 'boot' ? 'Verbindet' : 'Bereit'} />
          <HandyClock />
        </div>
        <div className="winmp-screen">
          {phase === 'boot' ? <IcqBoot key={bootKey} onDone={showList} /> : null}
          {phase === 'list' ? (
            <ContactList
              selfStatus={selfStatus}
              onStatus={setSelfStatus}
              onOpen={openChat}
              onAbout={() => setAbout(true)}
            />
          ) : null}
          {phase === 'chat' && active ? (
            <Chat
              friend={active}
              lines={threads[active.id] ?? []}
              draft={draft}
              onDraft={setDraft}
              onSend={send}
              onBack={showList}
              onAbout={() => setAbout(true)}
            />
          ) : null}
          {about ? <AboutIcq onClose={() => setAbout(false)} /> : null}
        </div>
        <div className="winmp-keys">
          <IcqButton disabled={phase !== 'chat'} onClick={showList}>Kontakte</IcqButton>
          <IcqButton disabled={phase === 'boot'} onClick={reboot}>Neu starten</IcqButton>
        </div>
      </div>
    </div>
  );
}

function IcqBoot({ onDone }: { onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const started = performance.now();
    const duration = 2800;
    let frame = 0;
    let finished = false;
    const tick = (now: number) => {
      const amount = Math.min(1, (now - started) / duration);
      setProgress(Math.round(amount * 100));
      setStep(Math.min(bootLines.length - 1, Math.floor(amount * bootLines.length)));
      if (amount < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      if (!finished) {
        finished = true;
        done.current();
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="icq-boot">
      <div className="icq-caption">
        <IcqFlower size={14} />
        <span>ICQ</span>
      </div>
      <div className="icq-boot-body">
        <IcqFlower size={72} />
        <h2>ICQ 99b</h2>
        <p>WinMP Handy</p>
        <div className="icq-boot-bar">
          <ProgressBar value={progress} />
        </div>
        <p className="icq-boot-line" aria-live="polite">{bootLines[step]}</p>
      </div>
    </div>
  );
}

function ContactList({
  selfStatus,
  onStatus,
  onOpen,
  onAbout,
}: {
  selfStatus: SelfStatus;
  onStatus: (status: SelfStatus) => void;
  onOpen: (id: string) => void;
  onAbout: () => void;
}) {
  const online = friends.filter((friend) => friend.status === 'online').length;
  return (
    <div className="icq-app">
      <div className="icq-caption">
        <IcqFlower size={14} />
        <span>ICQ</span>
      </div>
      <div className="menu-bar">
        <button type="button" className="menu-bar-item" onClick={onAbout}>Hilfe</button>
      </div>
      <div className="icq-me">
        <IcqFlower size={28} tone={selfStatus === 'invisible' ? 'offline' : selfStatus} />
        <div>
          <b>{myNick}</b>
          <div>UIN {myUin}</div>
        </div>
        <label className="icq-status-pick">
          Status
          <select value={selfStatus} onChange={(event) => onStatus(event.target.value as SelfStatus)}>
            {selfStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="icq-list" role="list">
        {groups.map((status) => {
          const group = friends.filter((friend) => friend.status === status);
          if (group.length === 0) return null;
          return (
            <div key={status}>
              <div className="icq-group">{statusLabel[status]} ({group.length})</div>
              {group.map((friend) => (
                <button key={friend.id} type="button" className="icq-contact" onClick={() => onOpen(friend.id)}>
                  <IcqFlower size={16} tone={friend.status} />
                  <span className="icq-nick">{friend.nick}</span>
                  <span className="icq-status-text">{friend.statusText}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <div className="status-bar icq-status-bar">
        <span>{online} online</span>
        <span>{friends.length} Kontakte</span>
      </div>
    </div>
  );
}

function Chat({
  friend,
  lines,
  draft,
  onDraft,
  onSend,
  onBack,
  onAbout,
}: {
  friend: Friend;
  lines: Line[];
  draft: string;
  onDraft: (value: string) => void;
  onSend: () => void;
  onBack: () => void;
  onAbout: () => void;
}) {
  const tag = useLocaleTag();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines]);

  const stamp = (at: number) => new Date(at).toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="icq-app">
      <div className="icq-caption">
        <IcqFlower size={14} tone={friend.status} />
        <span>{friend.nick}</span>
      </div>
      <div className="menu-bar">
        <button type="button" className="menu-bar-item" onClick={onAbout}>Hilfe</button>
      </div>
      <p className="icq-peer">
        {friend.nick} · UIN {friend.uin} · {statusLabel[friend.status]}
      </p>
      <div className="icq-log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions" aria-label={`Gespräch mit ${friend.nick}`}>
        {lines.length === 0 ? <p className="icq-empty">Noch keine Nachricht. Schreib {friend.nick} etwas.</p> : null}
        {lines.map((line) => (
          <p key={line.id} className={line.from === 'me' ? 'icq-line is-me' : 'icq-line'}>
            <b>{line.from === 'me' ? myNick : friend.nick} ({stamp(line.at)}):</b>
            <span>{line.text}</span>
          </p>
        ))}
      </div>
      <form
        className="icq-compose"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <label htmlFor="icq-draft">Nachricht</label>
        <textarea
          id="icq-draft"
          value={draft}
          rows={3}
          maxLength={240}
          onChange={(event) => onDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
        />
        <div className="icq-compose-actions">
          <IcqButton onClick={onBack}>Zurück</IcqButton>
          <IcqButton disabled={draft.trim().length === 0} onClick={onSend}>Senden</IcqButton>
        </div>
      </form>
    </div>
  );
}

function AboutIcq({ onClose }: { onClose: () => void }) {
  return (
    <div className="icq-about">
      <div className="icq-caption">
        <span>Über ICQ</span>
      </div>
      <div className="icq-about-body">
        <IcqFlower size={48} />
        <p><b>ICQ 99b</b></p>
        <p>Läuft auf dem WinMP Handy. Die fünf Nicknames sind erfunden, und keine Nachricht verlässt den Rechner.</p>
        <IcqButton onClick={onClose}>OK</IcqButton>
      </div>
    </div>
  );
}
