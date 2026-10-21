import { Computer } from '@react95/icons/Computer';
import { useState } from 'react';
import { Button, Radio, Window, WindowContent, WindowHeader } from 'react95';
import { useSettings, type Look } from '../settings/settings';

export type ShutdownChoice = 'standby' | 'shutdown' | 'restart' | 'dos';

type ShutdownDialogProps = {
  onChoose: (choice: ShutdownChoice) => void;
  onCancel: () => void;
};

const help: Record<ShutdownChoice, string> = {
  standby: 'Schaltet den Bildschirm ab. Ein Klick oder Tastendruck weckt den Computer wieder auf.',
  shutdown: 'Beendet Windows und schaltet den Computer aus.',
  restart: 'Beendet Windows und startet den Computer neu.',
  dos: 'Startet MS-DOS im Vollbild ohne Windows. Mit EXIT starten Sie Windows neu.',
};

const variants: Record<Look, { question: string; ok: string; cancel: string; choices: { id: ShutdownChoice; label: string }[] }> = {
  '98': {
    question: 'Was soll der Computer jetzt tun?',
    ok: 'OK',
    cancel: 'Abbrechen',
    choices: [
      { id: 'standby', label: 'Standby' },
      { id: 'shutdown', label: 'Herunterfahren' },
      { id: 'restart', label: 'Neu starten' },
      { id: 'dos', label: 'Im MS-DOS-Modus neu starten' },
    ],
  },
  '95': {
    question: 'Sind Sie sicher, dass Sie folgendes tun möchten:',
    ok: 'Ja',
    cancel: 'Nein',
    choices: [
      { id: 'shutdown', label: 'Den Computer herunterfahren?' },
      { id: 'restart', label: 'Den Computer neu starten?' },
      { id: 'dos', label: 'Den Computer im MS-DOS-Modus starten?' },
    ],
  },
};

export function ShutdownDialog({ onChoose, onCancel }: ShutdownDialogProps) {
  const { look } = useSettings();
  const variant = variants[look];
  const [choice, setChoice] = useState<ShutdownChoice>('shutdown');
  const [helpOpen, setHelpOpen] = useState(false);

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
              <legend>{variant.question}</legend>
              {variant.choices.map((item) => (
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
            {helpOpen ? <p className="shutdown-help">{help[choice]}</p> : null}
            <div className="shutdown-actions">
              <Button type="submit" primary>{variant.ok}</Button>
              <Button type="button" onClick={onCancel}>{variant.cancel}</Button>
              <Button type="button" active={helpOpen} onClick={() => setHelpOpen((open) => !open)}>Hilfe</Button>
            </div>
          </form>
        </WindowContent>
      </Window>
    </div>
  );
}
