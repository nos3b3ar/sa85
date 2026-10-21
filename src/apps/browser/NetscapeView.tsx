import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MenuList, MenuListItem, Separator } from 'react95';
import { bookmarks, homePages, netscapeNetcenter, type WebPage } from '../../content/web';
import { connect } from './connection';
import { DialupDialog } from './DialupDialog';
import { NetscapeAbout } from './NetscapeAbout';
import type { BrowserSession } from './useBrowser';

const google = bookmarks.find((page) => page.url.includes('google.com')) ?? netscapeNetcenter;
const yahoo = bookmarks.find((page) => page.url.includes('yahoo.com')) ?? netscapeNetcenter;
const geocities = bookmarks.find((page) => page.url.includes('geocities.com')) ?? netscapeNetcenter;

const menus = ['File', 'Edit', 'View', 'Go', 'Window', 'Help'] as const;

type NetscapeViewProps = {
  browser: BrowserSession;
  onClose: () => void;
  openApp: (appId: string) => void;
};

function Img({ name, width, height }: { name: string; width: number; height: number }) {
  return <img src={`/img/netscape/${name}.png`} width={width} height={height} alt="" draggable={false} />;
}

export function NetscapeView({ browser, onClose, openApp }: NetscapeViewProps) {
  const {
    home, history, index, setIndex, address, setAddress, loading, stopped, reloadKey,
    openMenu, setOpenMenu, prompt, setPrompt, menuRef, online, page,
    navigate, submit, goOffline, stop, reload, loaded,
  } = browser;
  const [popup, setPopup] = useState<'bookmarks' | 'history' | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const about = page.builtin === 'about';
  const busy = loading && !stopped;
  const canBack = index > 0;
  const canForward = index < history.length - 1;

  useEffect(() => {
    if (!popup) return;
    const close = (event: MouseEvent) => {
      if (!popupRef.current?.contains(event.target as Node)) setPopup(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [popup]);

  const go = (next: WebPage) => {
    setNote(null);
    setPopup(null);
    navigate(next);
  };

  const documentStatus = note
    ?? (!online && !about
      ? 'Offline'
      : stopped
        ? 'Transfer interrupted!'
        : loading
          ? 'Document: Loading...'
          : 'Document: Done');

  return (
    <div className="browser-netscape">
      <div className="ns-menubar" ref={menuRef}>
        {menus.map((menu) => (
          <div key={menu} className="browser-menu-root">
            <button
              type="button"
              className={openMenu === menu ? 'ns-menu is-open' : 'ns-menu'}
              onClick={() => {
                setPopup(null);
                setOpenMenu((value) => (value === menu ? null : menu));
              }}
            >
              <u>{menu[0]}</u>{menu.slice(1)}
            </button>
            {openMenu === menu ? (
              <MenuList className="browser-dropdown">
                {menu === 'File' ? (
                  <>
                    <MenuListItem size="sm" onClick={() => { setOpenMenu(null); locationRef.current?.select(); }}>Open Page...</MenuListItem>
                    <MenuListItem size="sm" onClick={() => go(home)}>Navigator Home</MenuListItem>
                    <Separator />
                    {online ? (
                      <MenuListItem size="sm" onClick={goOffline}>Go Offline</MenuListItem>
                    ) : (
                      <MenuListItem size="sm" onClick={() => { setPrompt(true); setOpenMenu(null); }}>Go Online...</MenuListItem>
                    )}
                    <Separator />
                    <MenuListItem size="sm" onClick={onClose}>Close</MenuListItem>
                  </>
                ) : null}
                {menu === 'Edit' ? (
                  <>
                    <MenuListItem size="sm" disabled>Cut</MenuListItem>
                    <MenuListItem size="sm" disabled>Copy</MenuListItem>
                    <MenuListItem size="sm" disabled>Paste</MenuListItem>
                  </>
                ) : null}
                {menu === 'View' ? (
                  <>
                    <MenuListItem size="sm" onClick={() => { setOpenMenu(null); reload(); }}>Reload</MenuListItem>
                    <MenuListItem size="sm" disabled={!busy} onClick={() => { setOpenMenu(null); stop(); }}>Stop Loading</MenuListItem>
                  </>
                ) : null}
                {menu === 'Go' ? (
                  <>
                    <MenuListItem size="sm" disabled={!canBack} onClick={() => { setOpenMenu(null); setIndex((value) => value - 1); }}>Back</MenuListItem>
                    <MenuListItem size="sm" disabled={!canForward} onClick={() => { setOpenMenu(null); setIndex((value) => value + 1); }}>Forward</MenuListItem>
                    <MenuListItem size="sm" onClick={() => go(home)}>Home</MenuListItem>
                    <Separator />
                    {bookmarks.map((bookmark) => (
                      <MenuListItem key={bookmark.url} size="sm" onClick={() => go(bookmark)}>{bookmark.title}</MenuListItem>
                    ))}
                  </>
                ) : null}
                {menu === 'Window' ? (
                  <MenuListItem size="sm" disabled>Navigator</MenuListItem>
                ) : null}
                {menu === 'Help' ? (
                  <MenuListItem size="sm" onClick={() => go(homePages.netscape)}>About Communicator</MenuListItem>
                ) : null}
              </MenuList>
            ) : null}
          </div>
        ))}
      </div>

      <div className="ns-bar ns-nav">
        <span className="ns-grip is-tall" aria-hidden />
        <Tool label="Back" icon={canBack ? 'back' : 'back-off'} disabled={!canBack} onClick={() => setIndex((value) => value - 1)} />
        <Tool label="Forward" icon={canForward ? 'forward' : 'forward-off'} disabled={!canForward} onClick={() => setIndex((value) => value + 1)} />
        <Tool label="Reload" icon="reload" onClick={reload} />
        <Tool label="Home" icon="home" onClick={() => go(home)} />
        <Tool label="Search" icon="search" onClick={() => go(google)} />
        <Tool label="Guide" icon="guide" onClick={() => go(netscapeNetcenter)} />
        <Tool label="Print" icon="print" onClick={() => setNote('No printer is installed.')} />
        <Tool label="Security" icon="security" onClick={() => setNote('This document is not encrypted.')} />
        <Tool label="Stop" icon="stop" onClick={() => { if (busy) stop(); }} />
        <button
          type="button"
          className={busy ? 'ns-throbber is-busy' : 'ns-throbber'}
          aria-label="Netscape"
          onClick={() => go(home)}
        >
          <img
            src="/img/netscape.gif"
            width={32}
            height={32}
            alt=""
            draggable={false}
          />
        </button>
      </div>

      <div className="ns-bar ns-location-bar" ref={popupRef}>
        <span className="ns-grip" aria-hidden />
        <div className="browser-menu-root">
          <button
            type="button"
            className="ns-flat ns-bookmarks"
            onClick={() => {
              setOpenMenu(null);
              setPopup((value) => (value === 'bookmarks' ? null : 'bookmarks'));
            }}
          >
            <Img name="bookmarks" width={30} height={19} />
            Bookmarks
          </button>
          {popup === 'bookmarks' ? (
            <MenuList className="browser-dropdown">
              {bookmarks.map((bookmark) => (
                <MenuListItem key={bookmark.url} size="sm" onClick={() => go(bookmark)}>{bookmark.title}</MenuListItem>
              ))}
            </MenuList>
          ) : null}
        </div>
        <span className="ns-proxy" aria-hidden>
          <Img name="location" width={15} height={19} />
        </span>
        <form className="ns-location" onSubmit={submit}>
          <label htmlFor="ns-location">Location:</label>
          <div className="ns-location-field">
            <input
              id="ns-location"
              ref={locationRef}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="button"
              className="ns-drop"
              aria-label="History"
              onClick={() => {
                setOpenMenu(null);
                setPopup((value) => (value === 'history' ? null : 'history'));
              }}
            />
            {popup === 'history' ? (
              <ul className="ns-combo-list" role="listbox">
                {history.map((entry, entryIndex) => (
                  <li
                    key={`${entry.url}-${entryIndex}`}
                    role="option"
                    aria-selected={entryIndex === index}
                    className={entryIndex === index ? 'is-current' : undefined}
                    onClick={() => { setIndex(entryIndex); setPopup(null); }}
                  >
                    {entry.url}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </form>
      </div>

      <div className="ns-bar ns-personal">
        <span className="ns-grip" aria-hidden />
        <Personal icon="message" onClick={() => setNote('Instant Message is not installed.')}>Instant Message</Personal>
        <Personal icon="internet" onClick={() => go(netscapeNetcenter)}>Internet</Personal>
        <Personal icon="lookup" onClick={() => go(yahoo)}>Lookup</Personal>
        <Personal icon="new" onClick={() => go(geocities)}>New&amp;Cool</Personal>
      </div>

      <div className="ns-view">
        {about ? (
          <NetscapeAbout onLicense={() => openApp('impressum')} />
        ) : online && !stopped ? (
          <iframe
            key={`${page.src}-${reloadKey}`}
            title={page.title}
            src={page.src}
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={loaded}
          />
        ) : (
          <div className="browser-offline">
            {prompt ? (
              <DialupDialog
                onConnect={connect}
                onOffline={goOffline}
                onPrivacy={() => openApp('datenschutz')}
              />
            ) : (
              <>
                <p>There is no connection to the Internet.</p>
                <button type="button" className="ns-connect" onClick={() => setPrompt(true)}>Go Online</button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="ns-status">
        <span className="ns-cell ns-cell-lock">
          <Img name="status-lock" width={16} height={14} />
        </span>
        <span className={busy ? 'ns-cell ns-progress is-busy' : 'ns-cell ns-progress'} />
        <span className="ns-cell ns-status-text">{documentStatus}</span>
      </div>
    </div>
  );
}

function Tool({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="ns-tool" disabled={disabled} onClick={onClick}>
      <Img name={icon} width={23} height={23} />
      <span>{label}</span>
    </button>
  );
}

function Personal({ icon, onClick, children }: { icon: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="ns-flat ns-personal-item" onClick={onClick}>
      <Img name={icon} width={icon === 'lookup' ? 17 : 16} height={17} />
      {children}
    </button>
  );
}
