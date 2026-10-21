import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { WebPage } from '../../content/web';
import { resolveAddress } from '../../content/web';
import { disconnect, isOnline, useOnline } from './connection';

export function useBrowser(home: WebPage) {
  const [history, setHistory] = useState<WebPage[]>([home]);
  const [index, setIndex] = useState(0);
  const [address, setAddress] = useState(home.url);
  const [loading, setLoading] = useState(() => home.builtin !== 'about');
  const [stopped, setStopped] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(() => !isOnline() && home.builtin !== 'about');
  const menuRef = useRef<HTMLDivElement>(null);
  const online = useOnline();
  const wasOnline = useRef(online);
  const page = history[index];
  const pageRef = useRef(page);
  pageRef.current = page;

  useEffect(() => {
    setAddress(page.url);
    if (page.builtin === 'about') {
      setLoading(false);
      setStopped(false);
      setPrompt(false);
      return;
    }
    setLoading(true);
    setStopped(false);
    if (!isOnline()) setPrompt(true);
  }, [page, reloadKey]);

  useEffect(() => {
    if (online) setPrompt(false);
    if (online && !wasOnline.current && pageRef.current.builtin !== 'about') {
      setLoading(true);
      setStopped(false);
    }
    wasOnline.current = online;
  }, [online]);

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

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = resolveAddress(address);
    if (next) navigate(next);
  };

  const goOffline = () => {
    disconnect();
    setPrompt(false);
    setOpenMenu(null);
    setLoading(false);
  };

  const stop = () => {
    setStopped(true);
    setLoading(false);
  };

  const reload = () => setReloadKey((value) => value + 1);
  const loaded = () => setLoading(false);

  return {
    home,
    history,
    index,
    setIndex,
    address,
    setAddress,
    loading,
    stopped,
    reloadKey,
    openMenu,
    setOpenMenu,
    prompt,
    setPrompt,
    menuRef,
    online,
    page,
    navigate,
    submit,
    goOffline,
    stop,
    reload,
    loaded,
  };
}

export type BrowserSession = ReturnType<typeof useBrowser>;
