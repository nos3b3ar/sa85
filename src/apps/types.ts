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
};
