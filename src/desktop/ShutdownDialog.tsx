import { Computer } from '@react95/icons/Computer';
import { useState } from 'react';
import { Button, Radio, Window, WindowContent, WindowHeader } from 'react95';

export type ShutdownChoice = 'standby' | 'shutdown' | 'restart' | 'dos';

type ShutdownDialogProps = {
  onChoose: (choice: ShutdownChoice) => void;
  onCancel: () => void;
};

const choices: { id: ShutdownChoice; label: string; help: string }[] = [
  { id: 'standby', label: 'Standby', help: 'Schaltet den Bildschirm ab. Ein Klick oder Tastendruck weckt den Computer wieder auf.' },
  { id: 'shutdown', label: 'Herunterfahren', help: 'Beendet Windows und schaltet den Computer aus.' },
  { id: 'restart', label: 'Neu starten', help: 'Beendet Windows und startet den Computer neu.' },
  { id: 'dos', label: 'Im MS-DOS-Modus neu starten', help: 'Startet MS-DOS im Vollbild ohne Windows. Mit EXIT kehren Sie zu Windows zurück.' },
];

export function ShutdownDialog({ onChoose, onCancel }: ShutdownDialogProps) {
  const [choice, setChoice] = useState<ShutdownChoice>('shutdown');
  const [helpOpen, setHelpOpen] = useState(false);
  const help = choices.find((item) => item.id === choice)?.help;

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
          <form
            className="shutdown-form"
            onSubmit={(event) => {
              event.preventDefault();
              onChoose(choice);
            }}
          >
            <Computer variant="32x32_4" width={32} height={32} className="shutdown-icon" />
            <fieldset className="shutdown-choices">
              <legend>Was soll der Computer jetzt tun?</legend>
              {choices.map((item) => (
                <Radio
                  key={item.id}
                  name="shutdown-choice"
                  value={item.id}
                  label={item.label}
                  checked={choice === item.id}
                  onChange={() => setChoice(item.id)}
                />
              ))}
            </fieldset>
            {helpOpen ? <p className="shutdown-help">{help}</p> : null}
            <div className="shutdown-actions">
              <Button type="submit" primary>OK</Button>
              <Button type="button" onClick={onCancel}>Abbrechen</Button>
              <Button type="button" active={helpOpen} onClick={() => setHelpOpen((open) => !open)}>Hilfe</Button>
            </div>
          </form>
        </WindowContent>
      </Window>
    </div>
  );
}
