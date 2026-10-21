import { Button, Window, WindowContent, WindowHeader } from 'react95';
import { useT } from '../i18n';

type AlertDialogProps = {
  title: string;
  message: string;
  onClose: () => void;
};

export function AlertDialog({ title, message, onClose }: AlertDialogProps) {
  const t = useT();
  return (
    <div className="modal-layer">
      <Window className="message-box">
        <WindowHeader active className="app-window-header">
          <span className="app-window-title">{title}</span>
          <Button size="sm" onClick={onClose} aria-label={t.common.close}>
            <span className="title-close" />
          </Button>
        </WindowHeader>
        <WindowContent>
          <div className="message-body">
            <p>{message}</p>
          </div>
          <div className="message-actions">
            <Button onClick={onClose}>{t.common.ok}</Button>
          </div>
        </WindowContent>
      </Window>
    </div>
  );
}
