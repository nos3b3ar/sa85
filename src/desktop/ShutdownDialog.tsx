import { Computer } from '@react95/icons/Computer';
import { useState } from 'react';
import { Button, Radio, Window, WindowContent, WindowHeader } from 'react95';
import { useT } from '../i18n';
import { useSettings } from '../settings/settings';

export type ShutdownChoice = 'standby' | 'shutdown' | 'restart' | 'dos';

type ShutdownDialogProps = {
  onChoose: (choice: ShutdownChoice) => void;
  onCancel: () => void;
};

export function ShutdownDialog({ onChoose, onCancel }: ShutdownDialogProps) {
  const { look } = useSettings();
  const t = useT();
  const text = look === '98' ? t.shutdown.win98 : t.shutdown.win95;
  const ids: ShutdownChoice[] = look === '98' ? ['standby', 'shutdown', 'restart', 'dos'] : ['shutdown', 'restart', 'dos'];
  const variant = {
    question: text.question,
    ok: text.ok,
    cancel: text.cancel,
    choices: ids.map((id) => ({ id, label: id === 'standby' ? t.shutdown.win98.standby : text[id as Exclude<ShutdownChoice, 'standby'>] })),
  };
  const [choice, setChoice] = useState<ShutdownChoice>('shutdown');
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="shutdown-anchor">
      <Window className="shutdown-window">
        <WindowHeader active className="app-window-header">
          <span className="app-window-title">{t.shutdown.title}</span>
          <Button size="sm" onClick={onCancel} aria-label={t.common.close}>
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
            {helpOpen ? <p className="shutdown-help">{t.shutdown.help[choice]}</p> : null}
            <div className="shutdown-actions">
              <Button type="submit" primary>{variant.ok}</Button>
              <Button type="button" onClick={onCancel}>{variant.cancel}</Button>
              <Button type="button" active={helpOpen} onClick={() => setHelpOpen((open) => !open)}>{t.common.help}</Button>
            </div>
          </form>
        </WindowContent>
      </Window>
    </div>
  );
}
