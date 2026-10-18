import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { getApp } from '../apps/registry';

export type WindowRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ManagedWindow = WindowRect & {
  id: string;
  appId: string;
  title: string;
  z: number;
  minimized: boolean;
  maximized: boolean;
};

export const minWindowSize = { width: 200, height: 120 };

const cascadeStep = 24;

function taskbarHeight() {
  const desktop = document.querySelector('.desktop') ?? document.documentElement;
  const value = getComputedStyle(desktop).getPropertyValue('--taskbar-height');
  return Number.parseFloat(value) || 40;
}

type WindowManagerValue = {
  windows: ManagedWindow[];
  openApp: (appId: string) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, rect: WindowRect) => void;
  toggleMaximize: (id: string) => void;
  toggleTask: (id: string) => void;
  toggleDesktop: () => void;
};

const WindowManagerContext = createContext<WindowManagerValue | null>(null);

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<ManagedWindow[]>([]);
  const zRef = useRef(1);
  const windowsRef = useRef(windows);
  windowsRef.current = windows;
  const hiddenByDesktop = useRef<string[]>([]);

  const openApp = useCallback((appId: string) => {
    const app = getApp(appId);
    if (!app) return;
    if (app.kind === 'link') {
      if (app.url) window.open(app.url, '_blank', 'noopener,noreferrer');
      return;
    }
    setWindows((prev) => {
      const existing = prev.find((item) => item.appId === appId);
      const z = ++zRef.current;
      if (existing) {
        return prev.map((item) => (item.id === existing.id ? { ...item, z, minimized: false } : item));
      }
      const width = Math.min(app.defaultSize?.width ?? 480, Math.max(280, window.innerWidth - 24));
      const height = Math.min(app.defaultSize?.height ?? 340, Math.max(180, window.innerHeight - 72));
      const desktopHeight = window.innerHeight - taskbarHeight();
      let x = Math.max(0, Math.round((window.innerWidth - width) / 2));
      let y = Math.max(0, Math.round((desktopHeight - height) / 2));
      while (prev.some((item) => item.x === x && item.y === y)) {
        x += cascadeStep;
        y += cascadeStep;
      }
      return [
        ...prev,
        {
          id: `${appId}-${z}`,
          appId,
          title: app.title,
          x,
          y,
          width,
          height,
          z,
          minimized: false,
          maximized: false,
        },
      ];
    });
  }, []);

  const close = useCallback((id: string) => {
    setWindows((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const focus = useCallback((id: string) => {
    const z = ++zRef.current;
    setWindows((prev) => prev.map((item) => (item.id === id ? { ...item, z, minimized: false } : item)));
  }, []);

  const minimize = useCallback((id: string) => {
    setWindows((prev) => prev.map((item) => (item.id === id ? { ...item, minimized: true } : item)));
  }, []);

  const move = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const maxX = window.innerWidth - 96;
      const maxY = window.innerHeight - 56;
      return {
        ...item,
        x: Math.min(maxX, Math.max(-item.width + 140, x)),
        y: Math.min(maxY, Math.max(0, y)),
      };
    }));
  }, []);

  const resize = useCallback((id: string, rect: WindowRect) => {
    setWindows((prev) => prev.map((item) => (item.id === id ? { ...item, ...rect } : item)));
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    const z = ++zRef.current;
    setWindows((prev) => prev.map((item) => (
      item.id === id ? { ...item, maximized: !item.maximized, minimized: false, z } : item
    )));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setWindows((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target) return prev;
      const active = [...prev].filter((item) => !item.minimized).sort((a, b) => b.z - a.z)[0];
      if (!target.minimized && active?.id === id) {
        return prev.map((item) => (item.id === id ? { ...item, minimized: true } : item));
      }
      const z = ++zRef.current;
      return prev.map((item) => (item.id === id ? { ...item, minimized: false, z } : item));
    });
  }, []);

  const toggleDesktop = useCallback(() => {
    const current = windowsRef.current;
    const visible = current.filter((item) => !item.minimized);
    if (visible.length > 0) {
      hiddenByDesktop.current = visible.map((item) => item.id);
      setWindows(current.map((item) => ({ ...item, minimized: true })));
      return;
    }
    const restore = new Set(hiddenByDesktop.current);
    hiddenByDesktop.current = [];
    setWindows(current.map((item) => (restore.has(item.id) ? { ...item, minimized: false } : item)));
  }, []);

  const value = useMemo(
    () => ({ windows, openApp, close, focus, minimize, move, resize, toggleMaximize, toggleTask, toggleDesktop }),
    [windows, openApp, close, focus, minimize, move, resize, toggleMaximize, toggleTask, toggleDesktop],
  );

  return <WindowManagerContext.Provider value={value}>{children}</WindowManagerContext.Provider>;
}

export function useWindows() {
  const value = useContext(WindowManagerContext);
  if (!value) throw new Error('useWindows braucht einen WindowManagerProvider');
  return value;
}
