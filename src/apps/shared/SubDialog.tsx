import type { ReactNode } from 'react';
import { Button, Window, WindowContent, WindowHeader } from 'react95';
import { useT } from '../../i18n';

type SubDialogProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
};

/** Modaler Unterdialog innerhalb eines Eigenschaftenfensters, z. B. "Eigenschaften von TCP/IP". */
export function SubDialog({ title, onClose, children, width = 380 }: SubDialogProps) {
  const t = useT();
  return (
    <div className="sub-dialog-layer" onKeyDown={(event) => event.key === 'Escape' && onClose()}>
      <Window className="sub-dialog" style={{ width }}>
        <WindowHeader active className="app-window-header sub-dialog-header">
          <span className="app-window-title">
            <span>{title}</span>
          </span>
          <Button size="sm" onClick={onClose} aria-label={t.common.close} title={t.common.close}>
            <span className="title-close" />
          </Button>
        </WindowHeader>
        <WindowContent className="sub-dialog-body">{children}</WindowContent>
      </Window>
    </div>
  );
}

export function MessageDialog({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  const t = useT();
  return (
    <SubDialog title={title} onClose={onClose} width={340}>
      <p className="sub-dialog-message">{message}</p>
      <div className="dialog-footer">
        <Button onClick={onClose} style={{ minWidth: 84 }}>{t.common.ok}</Button>
      </div>
    </SubDialog>
  );
}
