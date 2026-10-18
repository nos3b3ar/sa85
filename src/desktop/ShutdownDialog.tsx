import { Button, Window, WindowContent, WindowHeader } from 'react95';

type ShutdownDialogProps = {
  onShutdown: () => void;
  onRestart: () => void;
  onCancel: () => void;
};

export function ShutdownDialog({ onShutdown, onRestart, onCancel }: ShutdownDialogProps) {
  return (
    <div className="shutdown-anchor">
      <Window className="shutdown-window">
        <WindowHeader active className="app-window-header">
          <span className="app-window-title">Windows beenden</span>
          <Button size="sm" onClick={onCancel} aria-label="Schließen">
            <span className="title-close" />
          </Button>
        </WindowHeader>
        <WindowContent>
          <div className="message-body">
            <p>Möchten Sie den Computer jetzt herunterfahren?</p>
          </div>
          <div className="shutdown-actions">
            <Button onClick={onShutdown}>Herunterfahren</Button>
            <Button onClick={onRestart}>Neu starten</Button>
            <Button onClick={onCancel}>Abbrechen</Button>
          </div>
        </WindowContent>
      </Window>
    </div>
  );
}
