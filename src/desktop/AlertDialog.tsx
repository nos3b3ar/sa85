import { Button, Window, WindowContent, WindowHeader } from 'react95';

type AlertDialogProps = {
  title: string;
  message: string;
  onClose: () => void;
};

export function AlertDialog({ title, message, onClose }: AlertDialogProps) {
  return (
    <div className="modal-layer">
      <Window className="message-box">
        <WindowHeader active className="app-window-header">
          <span className="app-window-title">{title}</span>
          <Button size="sm" onClick={onClose} aria-label="Schließen">
            <span className="title-close" />
          </Button>
        </WindowHeader>
        <WindowContent>
          <div className="message-body">
            <p>{message}</p>
          </div>
          <div className="message-actions">
            <Button onClick={onClose}>OK</Button>
          </div>
        </WindowContent>
      </Window>
    </div>
  );
}
