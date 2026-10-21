import { Ie } from '@react95/icons/Ie';
import { Button, Frame, MenuList, MenuListItem, Separator, TextInput } from 'react95';
import { bookmarks, homePages } from '../content/web';
import { connect } from './browser/connection';
import { DialupDialog } from './browser/DialupDialog';
import { NetscapeView } from './browser/NetscapeView';
import { useBrowser } from './browser/useBrowser';
import type { AppProps } from './types';

const ieLabels = {
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
};

export function InternetExplorerApp({ openApp }: AppProps) {
  const text = ieLabels;
  const browser = useBrowser(homePages.ie);
  const {
    home, index, setIndex, address, setAddress, loading, stopped, reloadKey,
    openMenu, setOpenMenu, prompt, setPrompt, menuRef, online, page,
    navigate, submit, goOffline, stop, reload, loaded,
  } = browser;

  const status = !online
    ? 'Offline'
    : stopped
      ? 'Vorgang abgebrochen'
      : loading
        ? `Website wird geöffnet: ${page.url}`
        : 'Fertig';

  return (
    <div className="browser browser-ie">
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
                ) : menu === '?' ? (
                  <MenuListItem size="sm" onClick={() => navigate(home)}>
                    Info über {text.product}
                  </MenuListItem>
                ) : menu === 'Datei' ? (
                  <>
                    <MenuListItem size="sm" onClick={() => navigate(home)}>{text.home}</MenuListItem>
                    {online ? (
                      <MenuListItem size="sm" onClick={goOffline}>Offline arbeiten</MenuListItem>
                    ) : (
                      <MenuListItem size="sm" onClick={() => { setPrompt(true); setOpenMenu(null); }}>
                        Verbinden...
                      </MenuListItem>
                    )}
                  </>
                ) : (
                  <>
                    <MenuListItem size="sm" onClick={() => navigate(home)}>{text.home}</MenuListItem>
                    <MenuListItem size="sm" onClick={reload}>{text.reload}</MenuListItem>
                  </>
                )}
              </MenuList>
            ) : null}
          </div>
        ))}
        <span className={loading && !stopped ? 'browser-throbber is-busy' : 'browser-throbber'} aria-hidden>
          <Ie variant="32x32_4" />
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
        <Button variant="thin" disabled={!loading || stopped} onClick={stop}>{text.stop}</Button>
        <Button variant="thin" onClick={reload}>{text.reload}</Button>
        <Button variant="thin" onClick={() => navigate(home)}>{text.home}</Button>
      </div>
      <Separator />
      <form className="browser-address" onSubmit={submit}>
        <label htmlFor="address-ie">{text.address}</label>
        <TextInput
          id="address-ie"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          fullWidth
        />
        <Button type="submit" variant="thin">{text.go}</Button>
      </form>
      <Frame variant="field" className="browser-view">
        {online && !stopped ? (
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
                <p>Es besteht keine Verbindung mit dem Internet.</p>
                <Button onClick={() => setPrompt(true)}>Verbinden</Button>
              </>
            )}
          </div>
        )}
      </Frame>
      <Frame variant="status" className="browser-status">{status}</Frame>
    </div>
  );
}

export function NetscapeApp({ onClose, openApp }: AppProps) {
  const browser = useBrowser(homePages.netscape);
  return <NetscapeView browser={browser} onClose={onClose} openApp={openApp} />;
}
