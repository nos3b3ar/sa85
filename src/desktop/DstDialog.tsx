import { useEffect } from 'react';
import { Timedate } from '@react95/icons/Timedate';
import { Button, Window, WindowContent, WindowHeader } from 'react95';
import { useT } from '../i18n';
import { markDstSeen, type DstNotice } from '../utils/dst';

type DstDialogProps = {
  notice: DstNotice;
  onClose: () => void;
};

export function DstDialog({ notice, onClose }: DstDialogProps) {
  const t = useT();
  useEffect(() => {
    if (notice.key !== 'dst-preview') markDstSeen(notice.key);
  }, [notice.key]);

  return (
    <div className="dst-anchor">
      <Window className="dst-window">
        <WindowHeader active className="app-window-header">
          <span className="app-window-title">
            <Timedate variant="16x16_4" />
            <span>{t.datetime.dstTitle}</span>
          </span>
          <Button size="sm" onClick={onClose} aria-label={t.common.close}>
            <span className="title-close" />
          </Button>
        </WindowHeader>
        <WindowContent>
          <div className="dst-body">
            <Timedate variant="32x32_4" />
            <p>{t.datetime.dstText}</p>
          </div>
          <div className="message-actions">
            <Button onClick={onClose}>{t.common.ok}</Button>
          </div>
        </WindowContent>
      </Window>
    </div>
  );
}
