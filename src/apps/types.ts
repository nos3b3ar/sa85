import type { PointerEventHandler } from 'react';

export type WindowChrome = {
  active: boolean;
  dragHandlers: {
    onPointerDown: PointerEventHandler<HTMLElement>;
    onPointerMove: PointerEventHandler<HTMLElement>;
    onPointerUp: PointerEventHandler<HTMLElement>;
  };
  onMinimize: () => void;
  onClose: () => void;
};

export type AppProps = {
  onClose: () => void;
  openApp: (appId: string) => void;
  chrome?: WindowChrome;
  /** Ersetzt das Schließen über die Titelleiste, z. B. für eine Rückfrage. onClose schließt weiterhin sofort. */
  setCloseGuard?: (guard: (() => void) | null) => void;
};
