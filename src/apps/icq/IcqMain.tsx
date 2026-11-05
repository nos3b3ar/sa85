import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { isOnline, type Status } from './data';
import { IcqFlower, IcqMessageIcon } from './IcqFlower';
import { useIcqText } from './strings';
import type { Contact, GroupId } from './types';

export type MenuId = 'main' | 'status' | 'services' | 'myicq';
export type NetState = 'off' | 'connecting' | 'on' | 'error';

type MainProps = {
  selfStatus: Status;
  groups: { id: GroupId; contacts: Contact[] }[];
  open: string[];
  unread: Set<string>;
  netState: NetState;
  query: string;
  onQuery: (value: string) => void;
  onToggle: (key: string) => void;
  onOpen: (key: string) => void;
  onContext: (key: string, x: number, y: number) => void;
  onMenu: (menu: MenuId, anchor: DOMRect) => void;
  onAddUsers: () => void;
  onNotice: () => void;
  onWhatsNew: () => void;
};

type Section = 'online' | 'offline';
const sections: Section[] = ['online', 'offline'];

function ContactRow({
  contact,
  unread,
  selected,
  onSelect,
  onOpen,
  onContext,
}: {
  contact: Contact;
  unread: boolean;
  selected: boolean;
  onSelect: (key: string) => void;
  onOpen: (key: string) => void;
  onContext: (key: string, x: number, y: number) => void;
}) {
  const press = useRef<{ timer: number; fired: boolean } | null>(null);

  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current.timer);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'touch') return;
    const { clientX, clientY } = event;
    const state = { fired: false, timer: 0 };
    state.timer = window.setTimeout(() => {
      state.fired = true;
      onContext(contact.key, clientX, clientY);
    }, 550);
    press.current = state;
  };

  const online = isOnline(contact.status);
  return (
    <button
      type="button"
      role="listitem"
      className={['icq-contact', online ? '' : 'is-offline', unread ? 'is-unread' : '', selected ? 'is-selected' : '']
        .filter(Boolean)
        .join(' ')}
      title={contact.statusText ? `${contact.nick}: ${contact.statusText}` : contact.nick}
      onClick={() => {
        onSelect(contact.key);
        if (press.current?.fired) {
          press.current = null;
          return;
        }
        onOpen(contact.key);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onSelect(contact.key);
        onContext(contact.key, event.clientX, event.clientY);
      }}
      onPointerDown={onPointerDown}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
    >
      {unread ? (
        <span className="icq-unread-icon" aria-hidden>
          <IcqFlower size={16} tone={contact.status} />
          <IcqMessageIcon className="icq-unread-letter" />
        </span>
      ) : (
        <IcqFlower size={16} tone={contact.status} />
      )}
      <span className="icq-nick">{contact.nick}</span>
    </button>
  );
}

export function IcqMain({
  selfStatus,
  groups,
  open,
  unread,
  netState,
  query,
  onQuery,
  onToggle,
  onOpen,
  onContext,
  onMenu,
  onAddUsers,
  onNotice,
  onWhatsNew,
}: MainProps) {
  const text = useIcqText();
  const anchor = (menu: MenuId) => (event: React.MouseEvent<HTMLButtonElement>) => {
    const target = menu === 'status' ? (event.currentTarget.parentElement ?? event.currentTarget) : event.currentTarget;
    onMenu(menu, target.getBoundingClientRect());
  };

  const [selected, setSelected] = useState<string | null>(null);
  const shownStatus: Status = netState === 'connecting' ? 'away' : selfStatus;

  const emptyNote = (id: GroupId, total: number) => {
    if (id === 'visitors') return netState === 'on' ? text.visitorsEmpty : text.visitorsOff;
    if (id === 'friends' && total === 0 && !query) return text.friendsEmpty;
    return null;
  };

  return (
    <div className="icq-main">
      <button type="button" className="icq-whatsnew" onClick={onWhatsNew}>
        <IcqFlower size={24} />
        <span>{text.whatsNew}</span>
      </button>
      <div className="icq-toolbar">
        <button type="button" className="icq-tool" onClick={onAddUsers} title={text.menuAddUsers} aria-label={text.menuAddUsers}>
          <span className="icq-tool-find" aria-hidden />
        </button>
        <button type="button" className="icq-tool" onClick={onNotice} title={text.menuNotice} aria-label={text.menuNotice}>
          <span className="icq-tool-grid" aria-hidden />
        </button>
        <span className="icq-version">ICQ 2001b</span>
      </div>
      <div className="icq-list" role="list">
        {sections.map((section) => (
          <div key={section} className="icq-section" role="presentation">
            <div className="icq-section-head" role="presentation">
              {section === 'online' ? text.sectionOnline : text.sectionOffline}
            </div>
            {groups.map(({ id, contacts }) => {
              const key = `${section}:${id}`;
              const expanded = open.includes(key);
              const members = contacts.filter((contact) => isOnline(contact.status) === (section === 'online'));
              const empty = section === 'online' && members.length === 0 ? emptyNote(id, contacts.length) : null;
              return (
                <div key={key} className="icq-group" role="presentation">
                  <button
                    type="button"
                    className={selected === key ? 'icq-group-head is-selected' : 'icq-group-head'}
                    aria-expanded={expanded}
                    onClick={() => {
                      setSelected(key);
                      onToggle(key);
                    }}
                  >
                    <span className={`icq-arrow is-${section}${expanded ? ' is-open' : ''}`} aria-hidden />
                    <span>
                      {text.groups[id]} - {members.length}/{contacts.length}
                    </span>
                  </button>
                  {expanded
                    ? members.map((contact) => (
                      <ContactRow
                        key={contact.key}
                        contact={contact}
                        unread={unread.has(contact.key)}
                        selected={selected === contact.key}
                        onSelect={setSelected}
                        onOpen={onOpen}
                        onContext={onContext}
                      />
                    ))
                    : null}
                  {expanded && empty ? <p className="icq-group-empty">{empty}</p> : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <button type="button" className="icq-notice" onClick={onNotice}>
        <IcqFlower size={16} tone={netState === 'error' ? 'dnd' : 'logo'} />
        <span>{text.systemNotice}</span>
      </button>
      <button type="button" className="icq-big" onClick={onAddUsers}>
        {text.addUsers}
      </button>
      <div className="icq-pair">
        <button type="button" className="icq-big" onClick={anchor('services')}>
          {text.services}
        </button>
        <button type="button" className="icq-big" onClick={anchor('myicq')}>
          {text.myIcq}
        </button>
      </div>
      <div className="icq-pair">
        <button type="button" className="icq-big is-main" onClick={anchor('main')}>
          {text.main}
        </button>
        <button type="button" className="icq-big is-status" onClick={anchor('status')}>
          <IcqFlower size={16} tone={shownStatus} />
          <span>{netState === 'connecting' ? text.connecting : text.statusShort[selfStatus]}</span>
        </button>
      </div>
      <form
        className="icq-search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <input
          type="search"
          value={query}
          placeholder={text.searchPlaceholder}
          aria-label={text.searchPlaceholder}
          onChange={(event) => onQuery(event.target.value)}
        />
        <button type="submit" className="icq-go">
          {text.go}
        </button>
        <button type="button" className="icq-go-more" onClick={onAddUsers} title={text.menuAddUsers} aria-label={text.menuAddUsers}>
          <span aria-hidden />
        </button>
      </form>
    </div>
  );
}
