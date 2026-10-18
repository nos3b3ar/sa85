import { useEffect } from 'react';
import { Timedate } from '@react95/icons/Timedate';
import { Button, Window, WindowContent, WindowHeader } from 'react95';
import { markDstSeen, type DstNotice } from '../utils/dst';

type DstDialogProps = {
  notice: DstNotice;
  onClose: () => void;
};

export function DstDialog({ notice, onClose }: DstDialogProps) {
  useEffect(() => {
    if (notice.key !== 'dst-preview') markDstSeen(notice.key);
  }, [notice.key]);

  return (
    <div className="dst-anchor">
      <Window className="dst-window">
        <WindowHeader active className="app-window-header">
          <span className="app-window-title">
            <Timedate variant="16x16_4" />
            <span>Neue Einstellungen</span>
          </span>
          <Button size="sm" onClick={onClose} aria-label="Schließen">
            <span className="title-close" />
          </Button>
        </WindowHeader>
        <WindowContent>
          <div className="dst-body">
            <Timedate variant="32x32_4" />
            <p>Die Uhr wurde sommerzeitbedingt umgestellt. Prüfen Sie, ob die Einstellungen der Uhr richtig sind.</p>
          </div>
          <div className="message-actions">
            <Button onClick={onClose}>OK</Button>
          </div>
        </WindowContent>
      </Window>
    </div>
  );
}
