import { useEffect } from 'react';
import { cursorRoles, useSettings } from '../settings/settings';
import { cursorFrames, cursorValue, cursorVars } from './render';

const frameMs = 220;

/** Setzt die Zeiger der gewählten Schemas als CSS-Variablen auf :root. index.css liest sie über var(--cur-*). */
export function CursorHost() {
  const { mouse, desktopColor } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    const animated: { name: string; values: string[] }[] = [];
    for (const role of cursorRoles) {
      const frames = cursorFrames(role, mouse, desktopColor);
      const values = frames.map((frame) => cursorValue(frame, role));
      root.style.setProperty(cursorVars[role].name, values[0]);
      if (values.length > 1) animated.push({ name: cursorVars[role].name, values });
    }
    let timer = 0;
    if (animated.length > 0) {
      let tick = 0;
      timer = window.setInterval(() => {
        tick += 1;
        animated.forEach(({ name, values }) => root.style.setProperty(name, values[tick % values.length]));
      }, frameMs);
    }
    return () => {
      window.clearInterval(timer);
      cursorRoles.forEach((role) => root.style.removeProperty(cursorVars[role].name));
    };
  }, [mouse, desktopColor]);

  return null;
}
