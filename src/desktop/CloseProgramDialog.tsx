import { useEffect, useState } from 'react';
import { Button, Window, WindowContent, WindowHeader } from 'react95';
import { useT } from '../i18n';

export type CloseProgramTask = {
  id: string;
  title: string;
};

type CloseProgramDialogProps = {
  tasks: CloseProgramTask[];
  initialId: string;
  onEndTask: (id: string) => void;
  onShutdown: () => void;
  onCancel: () => void;
};

export function CloseProgramDialog({ tasks, initialId, onEndTask, onShutdown, onCancel }: CloseProgramDialogProps) {
  const t = useT();
  const [selected, setSelected] = useState(initialId);
  const current = tasks.some((task) => task.id === selected) ? selected : tasks[0]?.id;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="close-program-anchor">
      <Window className="close-program-window" role="dialog" aria-labelledby="close-program-title">
        <WindowHeader active className="app-window-header">
          <span id="close-program-title" className="app-window-title">{t.closeProgram.title}</span>
        </WindowHeader>
        <WindowContent>
          <div
            className="close-program-list"
            role="listbox"
            aria-label={t.closeProgram.title}
            tabIndex={0}
            onKeyDown={(event) => {
              const index = tasks.findIndex((task) => task.id === current);
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelected(tasks[Math.min(tasks.length - 1, index + 1)]?.id ?? current);
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelected(tasks[Math.max(0, index - 1)]?.id ?? current);
              }
            }}
          >
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                role="option"
                aria-selected={task.id === current}
                className={task.id === current ? 'is-selected' : undefined}
                onClick={() => setSelected(task.id)}
                onDoubleClick={() => onEndTask(task.id)}
              >
                {task.title}
              </button>
            ))}
          </div>
          <p className="close-program-warning">{t.closeProgram.warning}</p>
          <div className="close-program-actions">
            <Button type="button" disabled={!current} onClick={() => current && onEndTask(current)}>
              {t.closeProgram.endTask}
            </Button>
            <Button type="button" onClick={onShutdown}>{t.closeProgram.shutdown}</Button>
            <Button type="button" onClick={onCancel}>{t.closeProgram.cancel}</Button>
          </div>
        </WindowContent>
      </Window>
    </div>
  );
}
