import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, TextInput } from 'react95';
import { playIcqMessage, playIcqStartup, preloadIcqSounds } from '../audio/audio';
import { useLocaleTag } from '../i18n';
import type { AppProps } from './types';
import { loadNet, netConfigured } from './icq/config';
import {
  agents,
  awayMaxLength,
  hasAwayMessage,
  isOnline,
  pickReply,
  randomIdentity,
  replyDelay,
  statusOrder,
  type AwayStatus,
  type Status,
} from './icq/data';
import { IcqFloating, IcqPopup, type PopupEntry } from './icq/IcqFloating';
import { IcqFlower } from './icq/IcqFlower';
import { IcqLogin } from './icq/IcqLogin';
import { IcqMain, type MenuId, type NetState } from './icq/IcqMain';
import { IcqMessage } from './icq/IcqMessage';
import type { Connection, MessageRow, Presence, PresenceMap, VisitorRow } from './icq/net';
import { loadIcq, saveIcq, type FriendRef } from './icq/store';
import { setIcqTray } from './icq/tray';
import { useIcqLang, useIcqText } from './icq/strings';
import type { Contact, Identity, Line } from './icq/types';

type Phase = 'splash' | 'login' | 'main';
type Dialog =
  | { kind: 'about' | 'notice' | 'me' | 'add' }
  | { kind: 'info' | 'readAway'; key: string }
  | { kind: 'away'; status: AwayStatus };
type Popup = { entries: PopupEntry[]; x: number; y: number; above?: boolean; width?: number; compact?: boolean; label: string };

const retentionMs = 7 * 24 * 60 * 60 * 1000;
const sendGapMs = 1000;

function rowToLine(row: MessageRow, myId: string): Line {
  return { id: `m${row.id}`, from: row.sender === myId ? 'me' : 'them', text: row.body, at: Date.parse(row.created_at) };
}

function byPresence(a: Contact, b: Contact) {
  const online = Number(isOnline(b.status)) - Number(isOnline(a.status));
  return online !== 0 ? online : a.nick.localeCompare(b.nick);
}

function fallbackContact(ref: FriendRef): Contact {
  const [kind, id] = ref.key.split(':') as [Contact['kind'], string];
  return { key: ref.key, kind, id, nick: ref.nick, uin: ref.uin, status: 'offline' };
}

export function IcqApp({ onClose, setTitle }: AppProps) {
  const text = useIcqText();
  const lang = useIcqLang();
  const tag = useLocaleTag();
  const saved = useMemo(loadIcq, []);

  const [phase, setPhase] = useState<Phase>('splash');
  const [identity, setIdentity] = useState<Identity>(() =>
    saved.uin && saved.nick ? { uin: saved.uin, nick: saved.nick } : randomIdentity(),
  );
  const [optIn, setOptIn] = useState(saved.optIn);
  const [friends, setFriends] = useState<FriendRef[]>(saved.friends);
  const [openGroups, setOpenGroups] = useState<string[]>(saved.open);
  const [selfStatus, setSelfStatus] = useState<Status>('online');
  const [awayMessages, setAwayMessages] = useState(saved.awayMessages);
  const [netState, setNetState] = useState<NetState>('off');
  const [notice, setNotice] = useState('');
  const [visitors, setVisitors] = useState<VisitorRow[]>([]);
  const [presence, setPresence] = useState<PresenceMap>({});
  const [threads, setThreads] = useState<Record<string, Line[]>>({});
  const [unread, setUnread] = useState<Set<string>>(() => new Set());
  const [chats, setChats] = useState<string[]>([]);
  const [chatErrors, setChatErrors] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [query, setQuery] = useState('');

  const conn = useRef<Connection | null>(null);
  const ticket = useRef(0);
  const timers = useRef<number[]>([]);
  const lastReply = useRef<Record<string, string>>({});
  const lastSend = useRef(0);
  const historyLoaded = useRef(new Set<string>());
  const chatsRef = useRef(chats);
  chatsRef.current = chats;
  const visitorsRef = useRef(visitors);
  visitorsRef.current = visitors;

  useEffect(() => {
    setTitle?.(phase === 'main' ? identity.uin : text.loginTitle);
  }, [phase, identity.uin, text.loginTitle, setTitle]);

  useEffect(preloadIcqSounds, []);

  useEffect(() => {
    setIcqTray(phase === 'main' ? { status: netState === 'connecting' ? 'away' : selfStatus, unread: unread.size > 0 } : null);
  }, [phase, selfStatus, netState, unread]);

  useEffect(() => () => setIcqTray(null), []);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      ticket.current += 1;
      void conn.current?.disconnect();
      conn.current = null;
    },
    [],
  );

  useEffect(() => {
    if (unread.size === 0 && netState === 'on') saveIcq({ readUntil: new Date().toISOString() });
  }, [unread, threads, netState]);

  const appendLines = useCallback((key: string, lines: Line[]) => {
    setThreads((prev) => {
      const current = prev[key] ?? [];
      const ids = new Set(current.map((line) => line.id));
      const fresh = lines.filter((line) => !ids.has(line.id));
      if (fresh.length === 0) return prev;
      return { ...prev, [key]: [...current, ...fresh].sort((a, b) => a.at - b.at) };
    });
  }, []);

  const markUnread = useCallback((key: string) => {
    if (chatsRef.current.includes(key)) return;
    setUnread((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);

  const stopNet = useCallback(() => {
    ticket.current += 1;
    const current = conn.current;
    conn.current = null;
    void current?.disconnect();
    setNetState('off');
    setPresence({});
  }, []);

  const awayMessageFor = (status: AwayStatus) => awayMessages[status] ?? text.awayDefaults[status];
  const presenceFor = (status: Status): Presence =>
    hasAwayMessage(status) ? { status, awayMessage: awayMessageFor(status) } : { status };

  const startNet = useCallback(
    async (who: Identity, status: Presence, captchaToken?: string) => {
      const mine = ++ticket.current;
      setNetState('connecting');
      try {
        const net = await loadNet();
        try {
          let connection: Connection | null = null;
          const handlers = {
            onVisitors: setVisitors,
            onPresence: setPresence,
            onMessage: (row: MessageRow) => {
              if (!connection) return;
              const key = `visitor:${row.sender}`;
              appendLines(key, [rowToLine(row, connection.myId)]);
              markUnread(key);
              playIcqMessage();
              if (!visitorsRef.current.some((visitor) => visitor.id === row.sender)) void connection.refreshVisitors();
            },
          };
          try {
            connection = await net.connect(who, status, handlers, captchaToken);
          } catch (error) {
            if (!(error instanceof net.UinTakenError) || mine !== ticket.current) throw error;
            const fresh = { ...who, uin: randomIdentity().uin };
            setIdentity(fresh);
            saveIcq({ uin: fresh.uin });
            connection = await net.connect(fresh, status, handlers);
          }
          if (mine !== ticket.current) {
            void connection.disconnect();
            return;
          }
          conn.current = connection;
          setNetState('on');
          setNotice(text.noticeConnected);
          const since = loadIcq().readUntil ?? new Date(Date.now() - retentionMs).toISOString();
          const missed = await connection.unreadSince(since);
          if (missed.length > 0) playIcqMessage();
          missed.forEach((row) => {
            const key = `visitor:${row.sender}`;
            appendLines(key, [rowToLine(row, connection.myId)]);
            markUnread(key);
          });
        } catch (error) {
          if (mine !== ticket.current) return;
          setNetState('error');
          setNotice(error instanceof net.UinTakenError ? text.noticeUinTaken : text.noticeError);
        }
      } catch {
        if (mine !== ticket.current) return;
        setNetState('error');
        setNotice(text.noticeError);
      }
    },
    [appendLines, markUnread, text],
  );

  const login = (who: Identity, wantsNet: boolean, captchaToken?: string) => {
    setIdentity(who);
    setOptIn(wantsNet);
    saveIcq({ uin: who.uin, nick: who.nick, optIn: wantsNet });
    setSelfStatus('online');
    setPhase('main');
    if (wantsNet && netConfigured) void startNet(who, { status: 'online' }, captchaToken);
    else {
      setNetState('off');
      setNotice(text.noticeOffline);
    }
  };

  const relogin = () => {
    stopNet();
    setChats([]);
    setDialog(null);
    historyLoaded.current.clear();
    setPhase('login');
  };

  const publishStatus = (presence: Presence) => {
    if (!optIn || !netConfigured) return;
    if (conn.current) void conn.current.setStatus(presence);
    else if (netState !== 'connecting') void startNet(identity, presence);
  };

  const changeStatus = (next: Status) => {
    setSelfStatus(next);
    if (next === 'offline') {
      stopNet();
      setNotice(text.noticeOffline);
      return;
    }
    publishStatus(presenceFor(next));
    if (hasAwayMessage(next)) setDialog({ kind: 'away', status: next });
  };

  const saveAwayMessage = (status: AwayStatus, message: string) => {
    const next = { ...awayMessages, [status]: message.trim().slice(0, awayMaxLength) };
    setAwayMessages(next);
    saveIcq({ awayMessages: next });
    if (selfStatus === status) publishStatus({ status, awayMessage: next[status] });
  };

  const agentContacts = useMemo<Contact[]>(
    () =>
      agents.map((agent) => ({
        key: `agent:${agent.id}`,
        kind: 'agent',
        id: agent.id,
        nick: agent.nick,
        uin: agent.uin,
        status: agent.status,
        statusText: agent.statusText[lang],
      })),
    [lang],
  );

  const visitorContacts = useMemo<Contact[]>(
    () =>
      netState === 'on'
        ? visitors.map((visitor) => ({
          key: `visitor:${visitor.id}`,
          kind: 'visitor',
          id: visitor.id,
          nick: visitor.nick,
          uin: visitor.uin,
          status: presence[visitor.id]?.status ?? 'offline',
          statusText: presence[visitor.id]?.awayMessage,
          lastSeen: visitor.last_seen,
        }))
        : [],
    [visitors, presence, netState],
  );

  const contacts = useMemo(() => {
    const map = new Map<string, Contact>();
    [...agentContacts, ...visitorContacts].forEach((contact) => map.set(contact.key, contact));
    return map;
  }, [agentContacts, visitorContacts]);

  const contactFor = useCallback(
    (key: string): Contact | null => {
      const found = contacts.get(key);
      if (found) return selfStatus === 'offline' ? { ...found, status: 'offline' } : found;
      const ref = friends.find((friend) => friend.key === key);
      if (ref) return fallbackContact(ref);
      const [kind, id] = key.split(':');
      if (kind === 'visitor') return { key, kind: 'visitor', id, nick: '?', uin: '?', status: 'offline' };
      return null;
    },
    [contacts, friends, selfStatus],
  );

  const groups = useMemo(() => {
    const friendKeys = new Set(friends.map((friend) => friend.key));
    const needle = query.trim().toLowerCase();
    const shown = (list: Contact[]) =>
      list
        .map((contact) => (selfStatus === 'offline' ? { ...contact, status: 'offline' as Status } : contact))
        .filter((contact) => !needle || contact.nick.toLowerCase().includes(needle) || contact.uin.includes(needle));
    return [
      { id: 'friends' as const, contacts: shown(friends.map((ref) => contacts.get(ref.key) ?? fallbackContact(ref))).sort(byPresence) },
      {
        id: 'visitors' as const,
        contacts: shown(visitorContacts.filter((contact) => !friendKeys.has(contact.key))).sort(
          (a, b) => Number(isOnline(b.status)) - Number(isOnline(a.status)),
        ),
      },
      { id: 'agents' as const, contacts: shown(agentContacts.filter((contact) => !friendKeys.has(contact.key))).sort(byPresence) },
    ];
  }, [friends, contacts, visitorContacts, agentContacts, query, selfStatus]);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key];
      saveIcq({ open: next });
      return next;
    });
  };

  const setFriendList = (next: FriendRef[]) => {
    setFriends(next);
    saveIcq({ friends: next });
  };

  const addFriend = (contact: Contact) => {
    if (friends.some((friend) => friend.key === contact.key)) return;
    setFriendList([...friends, { key: contact.key, nick: contact.nick, uin: contact.uin }]);
  };

  const removeFriend = (key: string) => setFriendList(friends.filter((friend) => friend.key !== key));

  const openChat = (key: string) => {
    setChats((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setUnread((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    const contact = contactFor(key);
    const connection = conn.current;
    if (contact?.kind === 'visitor' && connection && !historyLoaded.current.has(key)) {
      historyLoaded.current.add(key);
      connection
        .history(contact.id)
        .then((rows) => appendLines(key, rows.map((row) => rowToLine(row, connection.myId))))
        .catch(() => historyLoaded.current.delete(key));
    }
  };

  const closeChat = (key: string) => setChats((prev) => prev.filter((item) => item !== key));

  const setChatError = (key: string, message?: string) =>
    setChatErrors((prev) => {
      if (!message) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: message };
    });

  const send = (key: string, value: string): boolean => {
    const contact = contactFor(key);
    if (!contact) return false;
    const now = Date.now();
    if (now - lastSend.current < sendGapMs) {
      setChatError(key, text.tooFast);
      return false;
    }
    lastSend.current = now;
    setChatError(key);

    if (contact.kind === 'agent') {
      appendLines(key, [{ id: `l${now}`, from: 'me', text: value, at: now }]);
      const timer = window.setTimeout(() => {
        const reply = pickReply(contact.id, lang, lastReply.current[contact.id]);
        lastReply.current[contact.id] = reply;
        appendLines(key, [{ id: `l${Date.now()}r`, from: 'them', text: reply, at: Date.now() }]);
        markUnread(key);
        playIcqMessage();
      }, replyDelay(contact.status));
      timers.current.push(timer);
      return true;
    }

    const connection = conn.current;
    if (!connection) {
      setChatError(key, text.visitorsOff);
      return false;
    }
    connection
      .send(contact.id, value)
      .then((row) => appendLines(key, [rowToLine(row, connection.myId)]))
      .catch(() => setChatError(key, text.sendFailed));
    return true;
  };

  const openMenu = (menu: MenuId, anchor: DOMRect) => {
    const at = { x: anchor.left, y: anchor.top, above: true };
    if (menu === 'status') {
      setPopup({
        ...at,
        width: anchor.width,
        compact: true,
        label: text.statusHeader,
        entries: [
          { kind: 'header', label: text.statusHeader },
          ...statusOrder.map<PopupEntry>((status) => ({
            kind: 'item',
            label: text.statuses[status],
            tone: status,
            onSelect: () => changeStatus(status),
          })),
          ...(hasAwayMessage(selfStatus)
            ? ([
              { kind: 'separator' },
              { kind: 'item', label: text.awayEdit, onSelect: () => setDialog({ kind: 'away', status: selfStatus }) },
            ] satisfies PopupEntry[])
            : []),
        ],
      });
      return;
    }
    if (menu === 'main') {
      setPopup({
        ...at,
        label: text.main,
        entries: [
          { kind: 'item', label: text.menuRelogin, onSelect: relogin },
          { kind: 'item', label: text.menuAbout, tone: 'logo', onSelect: () => setDialog({ kind: 'about' }) },
          { kind: 'separator' },
          { kind: 'item', label: text.menuExit, onSelect: onClose },
        ],
      });
      return;
    }
    if (menu === 'services') {
      setPopup({
        ...at,
        label: text.services,
        entries: [
          { kind: 'item', label: text.menuAddUsers, onSelect: () => setDialog({ kind: 'add' }) },
          { kind: 'item', label: text.menuNotice, onSelect: () => setDialog({ kind: 'notice' }) },
        ],
      });
      return;
    }
    setPopup({
      ...at,
      label: text.myIcq,
      entries: [
        { kind: 'item', label: text.menuMyDetails, tone: selfStatus, onSelect: () => setDialog({ kind: 'me' }) },
        { kind: 'item', label: text.menuRelogin, onSelect: relogin },
      ],
    });
  };

  const openContext = (key: string, x: number, y: number) => {
    const contact = contactFor(key);
    if (!contact) return;
    const isFriend = friends.some((friend) => friend.key === key);
    setPopup({
      x,
      y,
      label: contact.nick,
      entries: [
        { kind: 'item', label: text.ctxMessage, bold: true, onSelect: () => openChat(key) },
        ...(hasAwayMessage(contact.status)
          ? ([{ kind: 'item', label: text.ctxReadAway, tone: contact.status, onSelect: () => setDialog({ kind: 'readAway', key }) }] satisfies PopupEntry[])
          : []),
        { kind: 'separator' },
        isFriend
          ? { kind: 'item', label: text.ctxRemoveFriend, onSelect: () => removeFriend(key) }
          : { kind: 'item', label: text.ctxAddFriend, onSelect: () => addFriend(contact) },
        { kind: 'item', label: text.ctxInfo, onSelect: () => setDialog({ kind: 'info', key }) },
      ],
    });
  };

  const closeDialog = () => setDialog(null);
  const closePopup = useCallback(() => setPopup(null), []);

  return (
    <div className={phase === 'splash' ? 'icq-root is-splash' : 'icq-root'}>
      {phase === 'splash' ? <IcqSplash label={text.splashLabel} onDone={() => setPhase('login')} /> : null}
      {phase === 'login' ? (
        <IcqLogin initial={identity} initialOptIn={optIn} onLogin={login} onCancel={onClose} />
      ) : null}
      {phase === 'main' ? (
        <IcqMain
          selfStatus={selfStatus}
          groups={groups}
          open={openGroups}
          unread={unread}
          netState={netState}
          query={query}
          onQuery={setQuery}
          onToggle={toggleGroup}
          onOpen={openChat}
          onContext={openContext}
          onMenu={openMenu}
          onAddUsers={() => setDialog({ kind: 'add' })}
          onNotice={() => setDialog({ kind: 'notice' })}
          onWhatsNew={() => setDialog({ kind: 'about' })}
        />
      ) : null}

      {chats.map((key, index) => {
        const contact = contactFor(key);
        if (!contact) return null;
        return (
          <IcqMessage
            key={key}
            contact={contact}
            me={identity}
            lines={threads[key] ?? []}
            offset={index * 24}
            awayMessage={hasAwayMessage(contact.status) ? contact.statusText : undefined}
            error={chatErrors[key]}
            onSend={(value) => send(key, value)}
            onClose={() => closeChat(key)}
          />
        );
      })}

      {dialog?.kind === 'about' ? (
        <IcqFloating title={text.aboutTitle} width={300} closeLabel={text.close} onClose={closeDialog}>
          <div className="icq-dialog is-center">
            <IcqFlower size={48} />
            <p><b>ICQ 2001b</b></p>
            <p>{text.aboutText}</p>
            <Button onClick={closeDialog} style={{ minWidth: 84 }}>{text.ok}</Button>
          </div>
        </IcqFloating>
      ) : null}

      {dialog?.kind === 'notice' ? (
        <IcqFloating
          title={text.systemNotice}
          tone={netState === 'error' ? 'dnd' : 'logo'}
          width={300}
          closeLabel={text.close}
          onClose={closeDialog}
        >
          <div className="icq-dialog">
            <p>{notice || text.noticeOffline}</p>
            <div className="icq-dialog-actions">
              <Button onClick={closeDialog} style={{ minWidth: 84 }}>{text.ok}</Button>
            </div>
          </div>
        </IcqFloating>
      ) : null}

      {dialog?.kind === 'me' ? (
        <IcqFloating title={text.myDetailsTitle} tone={selfStatus} width={280} closeLabel={text.close} onClose={closeDialog}>
          <div className="icq-dialog">
            <dl className="icq-details">
              <dt>{text.nick}</dt>
              <dd>{identity.nick}</dd>
              <dt>{text.uin}</dt>
              <dd>{identity.uin}</dd>
              <dt>Status</dt>
              <dd>{text.statusShort[selfStatus]}</dd>
              {hasAwayMessage(selfStatus) ? (
                <>
                  <dt>{text.awayLabel}</dt>
                  <dd>{awayMessageFor(selfStatus) || text.awayNone}</dd>
                </>
              ) : null}
            </dl>
            <div className="icq-dialog-actions">
              <Button onClick={closeDialog} style={{ minWidth: 84 }}>{text.ok}</Button>
            </div>
          </div>
        </IcqFloating>
      ) : null}

      {dialog?.kind === 'away' ? (
        <AwayDialog
          key={dialog.status}
          status={dialog.status}
          initial={awayMessageFor(dialog.status)}
          onSave={(message) => saveAwayMessage(dialog.status, message)}
          onClose={closeDialog}
        />
      ) : null}

      {dialog?.kind === 'readAway' ? (
        <ReadAwayDialog contact={contactFor(dialog.key)} onClose={closeDialog} />
      ) : null}

      {dialog?.kind === 'info' ? (
        <InfoDialog contact={contactFor(dialog.key)} tag={tag} onClose={closeDialog} />
      ) : null}

      {dialog?.kind === 'add' ? (
        <AddUsersDialog
          candidates={[...contacts.values()].filter((contact) => !friends.some((friend) => friend.key === contact.key))}
          onAdd={addFriend}
          onClose={closeDialog}
        />
      ) : null}

      {popup ? (
        <IcqPopup
          x={popup.x}
          y={popup.y}
          above={popup.above}
          width={popup.width}
          compact={popup.compact}
          entries={popup.entries}
          label={popup.label}
          onClose={closePopup}
        />
      ) : null}
    </div>
  );
}

const splashMs = 2500;
const splashStepMs = 125;

/** Startbild von ICQ 2001b: das rote Blatt wandert im Uhrzeigersinn, dazu läuft der Startsound. */
function IcqSplash({ label, onDone }: { label: string; onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  const [step, setStep] = useState(0);

  useEffect(() => {
    playIcqStartup();
    const spin = window.setInterval(() => setStep((value) => value + 1), splashStepMs);
    const finish = window.setTimeout(() => done.current(), splashMs);
    return () => {
      window.clearInterval(spin);
      window.clearTimeout(finish);
    };
  }, []);

  return createPortal(
    <div className="icq-splash" role="status" aria-label={label}>
      <div className="icq-splash-sky">
        <IcqFlower size={84} redIndex={(5 + step) % 8} />
      </div>
      <div className="icq-splash-name">ICQ 2001b</div>
      <div className="icq-splash-loading">Now Loading...</div>
    </div>,
    document.querySelector('.desktop') ?? document.body,
  );
}

const awayAutoCloseSeconds = 10;

function AwayDialog({
  status,
  initial,
  onSave,
  onClose,
}: {
  status: AwayStatus;
  initial: string;
  onSave: (message: string) => void;
  onClose: () => void;
}) {
  const text = useIcqText();
  const [draft, setDraft] = useState(initial);
  const [seconds, setSeconds] = useState<number | null>(awayAutoCloseSeconds);
  const finish = useRef(() => {});
  finish.current = () => {
    onSave(draft);
    onClose();
  };

  useEffect(() => {
    if (seconds === null) return;
    if (seconds === 0) {
      finish.current();
      return;
    }
    const timer = window.setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  const hold = () => setSeconds(null);

  return (
    <IcqFloating title={text.awayTitle(text.statusShort[status])} tone={status} width={300} closeLabel={text.close} onClose={onClose}>
      <form
        className="icq-dialog"
        onSubmit={(event) => {
          event.preventDefault();
          finish.current();
        }}
      >
        <label className="icq-field" htmlFor="icq-away-text">
          <span>{text.awayPrompt}</span>
        </label>
        <textarea
          id="icq-away-text"
          className="icq-away-text"
          value={draft}
          rows={4}
          maxLength={awayMaxLength}
          onFocus={hold}
          onPointerDown={hold}
          onChange={(event) => setDraft(event.target.value)}
        />
        {seconds !== null ? <p className="icq-note">{text.awayAutoClose(seconds)}</p> : null}
        <div className="icq-dialog-actions">
          <Button type="button" onClick={onClose} style={{ minWidth: 84 }}>{text.cancel}</Button>
          <Button type="submit" primary style={{ minWidth: 84 }}>
            {seconds !== null ? `${text.ok} (${seconds})` : text.ok}
          </Button>
        </div>
      </form>
    </IcqFloating>
  );
}

function ReadAwayDialog({ contact, onClose }: { contact: Contact | null; onClose: () => void }) {
  const text = useIcqText();
  if (!contact) return null;
  return (
    <IcqFloating title={text.awayReadTitle(contact.nick)} tone={contact.status} width={280} closeLabel={text.close} onClose={onClose}>
      <div className="icq-dialog">
        <p>
          <b>{contact.nick}</b> · {text.statusShort[contact.status]}
        </p>
        <p className="icq-away-read">{contact.statusText || text.awayNone}</p>
        <div className="icq-dialog-actions">
          <Button onClick={onClose} style={{ minWidth: 84 }}>{text.ok}</Button>
        </div>
      </div>
    </IcqFloating>
  );
}

function InfoDialog({ contact, tag, onClose }: { contact: Contact | null; tag: string; onClose: () => void }) {
  const text = useIcqText();
  if (!contact) return null;
  return (
    <IcqFloating title={`${text.infoTitle} – ${contact.nick}`} tone={contact.status} width={280} closeLabel={text.close} onClose={onClose}>
      <div className="icq-dialog">
        <dl className="icq-details">
          <dt>{text.nick}</dt>
          <dd>{contact.nick}</dd>
          <dt>{text.uin}</dt>
          <dd>{contact.uin}</dd>
          <dt>Status</dt>
          <dd>{text.statusShort[contact.status]}</dd>
          <dt>{text.kindLabel}</dt>
          <dd>{text.kind[contact.kind]}</dd>
          {contact.statusText ? (
            <>
              <dt>{hasAwayMessage(contact.status) ? text.awayLabel : <>&nbsp;</>}</dt>
              <dd>„{contact.statusText}“</dd>
            </>
          ) : null}
          {contact.lastSeen ? (
            <>
              <dt>{text.lastSeen}</dt>
              <dd>{new Date(contact.lastSeen).toLocaleString(tag, { dateStyle: 'short', timeStyle: 'short' })}</dd>
            </>
          ) : null}
        </dl>
        <div className="icq-dialog-actions">
          <Button onClick={onClose} style={{ minWidth: 84 }}>{text.ok}</Button>
        </div>
      </div>
    </IcqFloating>
  );
}

function AddUsersDialog({
  candidates,
  onAdd,
  onClose,
}: {
  candidates: Contact[];
  onAdd: (contact: Contact) => void;
  onClose: () => void;
}) {
  const text = useIcqText();
  const [search, setSearch] = useState('');
  const needle = search.trim().toLowerCase();
  const matches = candidates
    .filter((contact) => !needle || contact.nick.toLowerCase().includes(needle) || contact.uin.includes(needle))
    .slice(0, 30);

  return (
    <IcqFloating title={text.addTitle} width={300} closeLabel={text.close} onClose={onClose}>
      <div className="icq-dialog">
        <label className="icq-field">
          <span>{text.addHint}</span>
          <TextInput value={search} onChange={(event) => setSearch(event.target.value)} fullWidth autoFocus />
        </label>
        <div className="icq-add-list" role="list">
          {matches.length === 0 ? <p className="icq-group-empty">{text.addNone}</p> : null}
          {matches.map((contact) => (
            <div key={contact.key} className="icq-add-row" role="listitem">
              <IcqFlower size={16} tone={contact.status} />
              <span className="icq-add-nick">
                {contact.nick}
                <small>
                  {contact.uin} · {text.kind[contact.kind]}
                </small>
              </span>
              <Button size="sm" onClick={() => onAdd(contact)}>{text.add}</Button>
            </div>
          ))}
        </div>
        <div className="icq-dialog-actions">
          <Button onClick={onClose} style={{ minWidth: 84 }}>{text.close}</Button>
        </div>
      </div>
    </IcqFloating>
  );
}
