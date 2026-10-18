import { Ie } from '@react95/icons/Ie';
import { useEffect, useRef, useState } from 'react';
import { Button, Frame, MenuList, MenuListItem, Separator, TextInput } from 'react95';
import { bookmarks, homePages, resolveAddress, type WebPage } from '../content/web';
import { NetscapeIcon } from './NetscapeIcon';

type Flavor = 'ie' | 'netscape';

const labels = {
  ie: {
    menus: ['Datei', 'Bearbeiten', 'Ansicht', 'Favoriten', 'Extras', '?'],
    bookmarkMenu: 'Favoriten',
    back: 'Zurück',
    forward: 'Vorwärts',
    stop: 'Abbrechen',
    reload: 'Aktualisieren',
    home: 'Startseite',
    address: 'Adresse',
    go: 'Wechseln zu',
    product: 'Microsoft Internet Explorer',
  },
  netscape: {
    menus: ['Datei', 'Bearbeiten', 'Ansicht', 'Gehe', 'Communicator', 'Lesezeichen', 'Hilfe'],
    bookmarkMenu: 'Lesezeichen',
    back: 'Zurück',
    forward: 'Vor',
    stop: 'Stopp',
    reload: 'Neu laden',
    home: 'Anfang',
    address: 'Adresse:',
    go: 'Los',
    product: 'Netscape Navigator',
  },
};

type BrowserProps = {
  flavor: Flavor;
};

function BrowserApp({ flavor }: BrowserProps) {
  const text = labels[flavor];
  const home = homePages[flavor];
  const [history, setHistory] = useState<WebPage[]>([home]);
  const [index, setIndex] = useState(0);
  const [address, setAddress] = useState(home.url);
  const [loading, setLoading] = useState(true);
  const [stopped, setStopped] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const page = history[index];

  useEffect(() => {
    setAddress(page.url);
    setLoading(true);
    setStopped(false);
  }, [page, reloadKey]);

  useEffect(() => {
    if (!openMenu) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openMenu]);

  const navigate = (next: WebPage) => {
    setOpenMenu(null);
    setHistory((prev) => [...prev.slice(0, index + 1), next]);
    setIndex((value) => value + 1);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = resolveAddress(address);
    if (next) navigate(next);
  };

  const status = stopped
    ? 'Vorgang abgebrochen'
    : loading
      ? `Website wird geöffnet: ${page.url}`
      : 'Fertig';

  return (
    <div className={`browser browser-${flavor}`}>
      <div className="browser-menubar" ref={menuRef}>
        {text.menus.map((menu) => (
          <div key={menu} className="browser-menu-root">
            <button
              type="button"
              className={openMenu === menu ? 'browser-menu is-open' : 'browser-menu'}
              onClick={() => setOpenMenu((value) => (value === menu ? null : menu))}
            >
              {menu}
            </button>
            {openMenu === menu ? (
              <MenuList className="browser-dropdown">
                {menu === text.bookmarkMenu ? (
                  bookmarks.map((bookmark) => (
                    <MenuListItem key={bookmark.url} size="sm" onClick={() => navigate(bookmark)}>
                      {bookmark.title}
                    </MenuListItem>
                  ))
                ) : menu === '?' || menu === 'Hilfe' ? (
                  <MenuListItem size="sm" onClick={() => navigate(home)}>
                    Info über {text.product}
                  </MenuListItem>
                ) : (
                  <>
                    <MenuListItem size="sm" onClick={() => navigate(home)}>{text.home}</MenuListItem>
                    <MenuListItem size="sm" onClick={() => setReloadKey((value) => value + 1)}>
                      {text.reload}
                    </MenuListItem>
                  </>
                )}
              </MenuList>
            ) : null}
          </div>
        ))}
        <span className={loading && !stopped ? 'browser-throbber is-busy' : 'browser-throbber'} aria-hidden>
          {flavor === 'ie' ? <Ie variant="32x32_4" /> : <NetscapeIcon />}
        </span>
      </div>
      <div className="browser-toolbar">
        <Button variant="thin" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>
          ◄ {text.back}
        </Button>
        <Button
          variant="thin"
          disabled={index >= history.length - 1}
          onClick={() => setIndex((value) => value + 1)}
        >
          {text.forward} ►
        </Button>
        <Button
          variant="thin"
          disabled={!loading || stopped}
          onClick={() => {
            setStopped(true);
            setLoading(false);
          }}
        >
          {text.stop}
        </Button>
        <Button variant="thin" onClick={() => setReloadKey((value) => value + 1)}>{text.reload}</Button>
        <Button variant="thin" onClick={() => navigate(home)}>{text.home}</Button>
      </div>
      <Separator />
      <form className="browser-address" onSubmit={submit}>
        <label htmlFor={`address-${flavor}`}>{text.address}</label>
        <TextInput
          id={`address-${flavor}`}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          fullWidth
        />
        <Button type="submit" variant="thin">{text.go}</Button>
      </form>
      <Frame variant="field" className="browser-view">
        {stopped ? null : (
          <iframe
            key={`${page.src}-${reloadKey}`}
            title={page.title}
            src={page.src}
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => setLoading(false)}
          />
        )}
      </Frame>
      <Frame variant="status" className="browser-status">{status}</Frame>
    </div>
  );
}

export function InternetExplorerApp() {
  return <BrowserApp flavor="ie" />;
}

export function NetscapeApp() {
  return <BrowserApp flavor="netscape" />;
}
