import { useEffect, useMemo, useRef, useState } from 'react';
import { setupMenu } from './bootScript';
import { biosDefaults, getCmos, isUsbDevice, saveCmos, setupDefaults, type Cmos, type UsbDevice } from './cmos';
import { IdeDetect } from './setup/IdeDetect';
import { createPages, mainMenuHelp, oemPage, type Field, type SetupPage } from './setup/pages';
import { isSelectable, SetupPageView, type Cursor } from './setup/SetupPageView';
import { UsbConsent } from './UsbConsent';
import { findBootCandidates, openUsbVolume, type UsbSupport } from './usbBoot';
import './bios.css';

export type SetupAccess = 'supervisor' | 'user';

type BiosSetupProps = {
  access: SetupAccess;
  initialView?: 'main' | 'oem';
  usbSupport: UsbSupport;
  onExit: () => void;
  onScanDisk: () => void;
};

type Dialog =
  | { type: 'confirm'; text: string; answer: 'Y' | 'N'; onYes: () => void; save?: boolean }
  | { type: 'password'; target: 'supervisor' | 'user'; stage: 'enter' | 'confirm'; value: string; first: string }
  | { type: 'message'; lines: string[] }
  | { type: 'help'; lines: string[] }
  | { type: 'welcome' }
  | { type: 'usb'; device: UsbDevice; stage: 'consent' | 'reading' };

const items = [
  ...setupMenu.left.map((label, index) => ({ label, column: 0, row: index })),
  ...setupMenu.right.map((label, index) => ({ label, column: 1, row: index })),
];

const pageByMenu: Record<string, string> = {
  'STANDARD CMOS SETUP': 'standard',
  'BIOS FEATURES SETUP': 'features',
  'CHIPSET FEATURES SETUP': 'chipset',
  'POWER MANAGEMENT SETUP': 'power',
  'PNP/PCI CONFIGURATION': 'pnp',
  'INTEGRATED PERIPHERALS': 'peripherals',
};

const userItems = new Set(['USER PASSWORD', 'SAVE & EXIT SETUP', 'EXIT WITHOUT SAVING']);
const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
export const oemPasswords = ['sa85', '90s'];
const colorSchemes = 4;
const maxPasswordLength = 8;

export function BiosSetup({ access, initialView = 'main', usbSupport, onExit, onScanDisk }: BiosSetupProps) {
  const pages = useMemo(() => [...createPages(usbSupport !== 'none'), oemPage], [usbSupport]);
  const [saved] = useState<Cmos>(getCmos);
  const [draft, setDraft] = useState<Cmos>(getCmos);
  const [view, setView] = useState<string>(initialView);
  const [selected, setSelected] = useState(0);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [tick, setTick] = useState(0);
  const konamiProgress = useRef(0);
  const typematic = useRef({ pressedAt: 0, lastAt: 0 });

  const page = pages.find((item) => item.id === view) ?? null;

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const cursorFor = (target: SetupPage): Cursor => cursors[target.id] ?? firstCursor(target, draft.values);

  const setValue = (id: string, value: string) => {
    setDraft((current) => ({ ...current, values: { ...current.values, [id]: value } }));
  };

  const modify = (target: SetupPage, cursor: Cursor, direction: 1 | -1) => {
    const field = target.columns[cursor.column][cursor.row];
    if (!field || !isSelectable(field, draft.values)) return;
    if (field.kind === 'clock') {
      const minutes = field.id === 'date' ? 24 * 60 : 1;
      setDraft((current) => ({ ...current, clockOffsetMinutes: current.clockOffsetMinutes + direction * minutes }));
      return;
    }
    if (field.kind !== 'option') return;
    const index = field.options.indexOf(draft.values[field.id]);
    const next = field.options[(index + direction + field.options.length) % field.options.length];
    setValue(field.id, next);
  };

  const pageIds = (target: SetupPage) => target.columns.flat().flatMap((field) => (field.kind === 'option' ? [field.id] : []));

  const loadDefaults = (source: Record<string, string>, target: SetupPage | null) => {
    setDraft((current) => {
      const ids = target ? pageIds(target) : Object.keys(source).filter((id) => id !== 'color' && id !== 'multiBoot');
      const values = { ...current.values };
      ids.forEach((id) => {
        values[id] = source[id];
      });
      if (!target) {
        values.hddModel = source.hddModel;
        values.hddMode = source.hddMode;
      }
      return { ...current, values };
    });
  };

  const askSave = () => setDialog({
    type: 'confirm',
    text: 'SAVE to CMOS and EXIT (Y/N)? ',
    answer: 'Y',
    save: true,
    onYes: () => {
      saveCmos(draft);
      onExit();
    },
  });

  const askQuit = () => setDialog({ type: 'confirm', text: 'Quit Without Saving (Y/N)? ', answer: 'N', onYes: onExit });

  const askDefaults = (kind: 'bios' | 'setup', target: SetupPage | null) => setDialog({
    type: 'confirm',
    text: kind === 'bios' ? 'Load BIOS Defaults (Y/N)? ' : 'Load SETUP Defaults (Y/N)? ',
    answer: 'N',
    onYes: () => loadDefaults(kind === 'bios' ? biosDefaults : setupDefaults, target),
  });

  const cycleColor = () => setValue('color', String((Number(draft.values.color) + 1) % colorSchemes));

  const startUsbProbe = (device: UsbDevice) => {
    if (usbSupport === 'none') {
      setDialog({ type: 'message', lines: [`${device} : No USB device found`] });
      return;
    }
    setDialog({ type: 'usb', device, stage: 'consent' });
  };

  const answerUsb = (device: UsbDevice, allow: boolean) => {
    if (!allow) {
      setDialog(null);
      return;
    }
    setDialog({ type: 'usb', device, stage: 'reading' });
    void openUsbVolume(usbSupport).then(async (volume) => {
      if (!volume) {
        setDialog({ type: 'message', lines: [`${device} : No USB device found`] });
        return;
      }
      const candidates = await findBootCandidates(volume);
      setDialog({
        type: 'message',
        lines: [
          `${device} : ${volume.name}`,
          `${volume.files.length}${volume.truncated ? '+' : ''} file(s), ${candidates.length} bootable image(s)`,
          candidates.length ? 'Select it as boot device and SAVE to boot.' : 'Device is not bootable.',
        ],
      });
    });
  };

  const openMenuItem = (index: number) => {
    const label = items[index]?.label;
    if (!label) return;
    if (access === 'user' && !userItems.has(label)) return;
    if (pageByMenu[label]) {
      setView(pageByMenu[label]);
      return;
    }
    switch (label) {
      case 'LOAD BIOS DEFAULTS':
        askDefaults('bios', null);
        break;
      case 'LOAD SETUP DEFAULTS':
        askDefaults('setup', null);
        break;
      case 'SUPERVISOR PASSWORD':
        setDialog({ type: 'password', target: 'supervisor', stage: 'enter', value: '', first: '' });
        break;
      case 'USER PASSWORD':
        setDialog({ type: 'password', target: 'user', stage: 'enter', value: '', first: '' });
        break;
      case 'IDE HDD AUTO DETECTION':
        setView('ide');
        break;
      case 'MICROSOFT SCANDISK':
        onScanDisk();
        break;
      case 'SAVE & EXIT SETUP':
        askSave();
        break;
      case 'EXIT WITHOUT SAVING':
        askQuit();
        break;
      default:
        break;
    }
  };

  const submitPassword = (current: Extract<Dialog, { type: 'password' }>) => {
    const key = current.target === 'supervisor' ? 'supervisorPassword' : 'userPassword';
    if (current.stage === 'enter') {
      if (!current.value) {
        setDraft((state) => ({ ...state, [key]: '' }));
        setDialog({ type: 'message', lines: ['PASSWORD DISABLED !!!', 'Press any key to continue...'] });
        return;
      }
      if (current.target === 'supervisor' && oemPasswords.includes(current.value)) {
        setDialog(null);
        setView('oem');
        return;
      }
      setDialog({ ...current, stage: 'confirm', value: '', first: current.value });
      return;
    }
    if (current.value !== current.first) {
      setDialog({ type: 'message', lines: ['Password does not match !', 'Press any key to continue...'] });
      return;
    }
    setDraft((state) => ({ ...state, [key]: current.value }));
    setDialog(null);
  };

  const handleDialogKey = (event: KeyboardEvent, current: Dialog) => {
    const key = event.key;
    if (current.type === 'confirm') {
      event.preventDefault();
      if (key === 'F10' && current.save) {
        setDialog({ type: 'welcome' });
      } else if (key.toLowerCase() === 'y' || key.toLowerCase() === 'n') {
        setDialog({ ...current, answer: key.toUpperCase() as 'Y' | 'N' });
      } else if (key === 'Enter') {
        setDialog(null);
        if (current.answer === 'Y') current.onYes();
      } else if (key === 'Escape') {
        setDialog(null);
      }
      return;
    }
    if (current.type === 'password') {
      event.preventDefault();
      if (key === 'Escape') setDialog(null);
      else if (key === 'Enter') submitPassword(current);
      else if (key === 'Backspace') setDialog({ ...current, value: current.value.slice(0, -1) });
      else if (key.length === 1 && current.value.length < maxPasswordLength) setDialog({ ...current, value: current.value + key });
      return;
    }
    if (current.type === 'usb') {
      event.preventDefault();
      if (current.stage !== 'consent') return;
      if (key === 'Enter' || key.toLowerCase() === 'y') answerUsb(current.device, true);
      else if (key === 'Escape' || key.toLowerCase() === 'n') answerUsb(current.device, false);
      return;
    }
    if (current.type === 'help' && !['Escape', 'Enter', 'F1'].includes(key)) return;
    event.preventDefault();
    setDialog(null);
  };

  const acceptTypematic = (event: KeyboardEvent) => {
    const { values } = getCmos();
    if (values.typematic !== 'Enabled') return true;
    const now = performance.now();
    if (!event.repeat) {
      typematic.current = { pressedAt: now, lastAt: now };
      return true;
    }
    if (now - typematic.current.pressedAt < Number(values.typematicDelay)) return false;
    if (now - typematic.current.lastAt < 1000 / Number(values.typematicRate)) return false;
    typematic.current.lastAt = now;
    return true;
  };

  const handleKey = (event: KeyboardEvent) => {
    if (view === 'ide') return;
    if (dialog) {
      handleDialogKey(event, dialog);
      return;
    }
    if (!acceptTypematic(event)) {
      event.preventDefault();
      return;
    }
    const key = event.key;
    if (key === 'F2' && event.shiftKey) {
      event.preventDefault();
      cycleColor();
      return;
    }
    if (key === 'F10') {
      event.preventDefault();
      askSave();
      return;
    }
    if (page) {
      handlePageKey(event, page);
      return;
    }

    konamiProgress.current = key === konami[konamiProgress.current] || key.toLowerCase() === konami[konamiProgress.current]
      ? konamiProgress.current + 1
      : key === konami[0] ? 1 : 0;
    if (konamiProgress.current === konami.length) {
      konamiProgress.current = 0;
      setDialog({ type: 'welcome' });
      return;
    }

    if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      askQuit();
    } else if (key === 'Enter') {
      event.preventDefault();
      openMenuItem(selected);
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      setSelected((current) => moveVertical(current, key === 'ArrowDown' ? 1 : -1));
    } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault();
      setSelected((current) => moveHorizontal(current, key === 'ArrowRight' ? 1 : -1));
    }
  };

  const handlePageKey = (event: KeyboardEvent, target: SetupPage) => {
    const key = event.key;
    const cursor = cursorFor(target);
    const setCursor = (next: Cursor) => setCursors((current) => ({ ...current, [target.id]: next }));
    const field = target.columns[cursor.column][cursor.row];
    const handled = () => event.preventDefault();

    if (key === 'Escape') {
      handled();
      event.stopPropagation();
      setView('main');
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      handled();
      setCursor(moveInColumn(target, draft.values, cursor, key === 'ArrowDown' ? 1 : -1));
    } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
      handled();
      setCursor(switchColumn(target, draft.values, cursor, key === 'ArrowRight' ? 1 : -1));
    } else if (key === 'PageUp' || key === '+') {
      handled();
      modify(target, cursor, 1);
    } else if (key === 'PageDown' || key === '-') {
      handled();
      modify(target, cursor, -1);
    } else if (key === 'F1') {
      handled();
      setDialog({ type: 'help', lines: helpLines(field) });
    } else if (key === 'F5') {
      handled();
      loadDefaults(saved.values, target);
    } else if (key === 'F6' && target.id !== 'oem') {
      handled();
      askDefaults('bios', target);
    } else if (key === 'F7' && target.id !== 'oem') {
      handled();
      askDefaults('setup', target);
    } else if (key === 'Enter') {
      handled();
      if (field?.kind === 'option' && /Boot$/.test(field.id) && isUsbDevice(draft.values[field.id])) {
        startUsbProbe(draft.values[field.id] as UsbDevice);
      }
    }
  };

  const handleKeyRef = useRef(handleKey);
  handleKeyRef.current = handleKey;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => handleKeyRef.current(event);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const color = Number(draft.values.color) % colorSchemes;
  const selectedLabel = items[selected]?.label ?? '';

  return (
    <div className={`setup-screen setup-color-${color}${view === 'oem' ? ' is-oem' : ''}`}>
      <div className="setup-title">
        <p>ROM PCI/ISA BIOS ({'2A69KA1J'})</p>
        <p>{page ? page.title : view === 'ide' ? 'IDE HDD AUTO DETECTION' : 'CMOS SETUP UTILITY'}</p>
        <p>AWARD SOFTWARE, INC.</p>
      </div>
      {view === 'main' ? (
        <>
          <div className="setup-columns">
            {[0, 1].map((column) => (
              <div key={column}>
                {items.filter((item) => item.column === column).map((item) => {
                  const index = item.column * setupMenu.left.length + item.row;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={index === selected ? 'setup-item is-selected' : 'setup-item'}
                      onClick={() => {
                        setSelected(index);
                        openMenuItem(index);
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="setup-footer setup-main-footer">
            <div className="setup-footer-keys">
              <button type="button" className="setup-key" onClick={askQuit}>Esc : Quit</button>
              <span>{'\u2191 \u2193 \u2192 \u2190   : Select Item'}</span>
              <button type="button" className="setup-key" onClick={askSave}>F10 : Save &amp; Exit Setup</button>
              <button type="button" className="setup-key" onClick={cycleColor}>(Shift)F2 : Change Color</button>
            </div>
            <div className="setup-footer-help">{mainMenuHelp[selectedLabel] ?? '\u00a0'}</div>
          </div>
        </>
      ) : null}
      {page ? (
        <>
          <SetupPageView
            page={page}
            cmos={draft}
            cursor={cursorFor(page)}
            tick={tick}
            onSelect={(cursor) => setCursors((current) => ({ ...current, [page.id]: cursor }))}
            onModify={(cursor, direction) => modify(page, cursor, direction)}
          />
          <div className="setup-touch-keys">
            <button type="button" className="setup-key" onClick={() => setView('main')}>ESC : Quit</button>
            <button type="button" className="setup-key" onClick={() => setDialog({ type: 'help', lines: helpLines(page.columns[cursorFor(page).column][cursorFor(page).row]) })}>F1 : Help</button>
          </div>
          {view === 'oem' ? <div className="setup-oem-note">ESC : Return to Main Menu    PU/PD/+/- : Modify    F10 : Save</div> : null}
        </>
      ) : null}
      {view === 'ide' ? (
        <IdeDetect
          cmos={draft}
          onDone={(patch) => {
            if (patch) setDraft((current) => ({ ...current, values: { ...current.values, ...patch } }));
            setView('main');
          }}
        />
      ) : null}
      {dialog ? (
        <DialogView
          dialog={dialog}
          onUsb={answerUsb}
          onClose={() => setDialog(null)}
          onConfirm={(answer) => {
            if (dialog.type !== 'confirm') return;
            setDialog(null);
            if (answer === 'Y') dialog.onYes();
          }}
        />
      ) : null}
    </div>
  );
}

function helpLines(field: Field | undefined) {
  if (field?.kind === 'option' || field?.kind === 'clock') {
    return [field.label, '', field.help, '', 'PU/PD/+/- : Modify   ESC : Exit Help'];
  }
  return ['Item Help', '', 'Use the arrow keys to select an item.', '', 'ESC : Exit Help'];
}

type DialogViewProps = {
  dialog: Dialog;
  onClose: () => void;
  onConfirm: (answer: 'Y' | 'N') => void;
  onUsb: (device: UsbDevice, allow: boolean) => void;
};

function DialogView({ dialog, onClose, onConfirm, onUsb }: DialogViewProps) {
  if (dialog.type === 'welcome') {
    return (
      <div className="setup-dialog" role="dialog" aria-label="Easter Egg">
        <p>Welcome to the 90s.</p>
        <p>Congratulations that you found my small Easter egg.</p>
        <button type="button" className="setup-ok" onClick={onClose}>OK</button>
      </div>
    );
  }
  if (dialog.type === 'usb') {
    if (dialog.stage === 'consent') return <UsbConsent device={dialog.device} onAnswer={(allow) => onUsb(dialog.device, allow)} />;
    return <div className="bios-box" role="status"><p>{`Detecting ${dialog.device} ...`}</p></div>;
  }
  if (dialog.type === 'confirm') {
    return (
      <div className="bios-box setup-confirm" role="dialog" aria-label={dialog.text}>
        <p>
          {dialog.text}
          <span className="setup-value is-selected">{dialog.answer}</span>
        </p>
        <div className="bios-box-actions is-touch">
          <button type="button" className="setup-key" onClick={() => onConfirm('Y')}>Y</button>
          <button type="button" className="setup-key" onClick={() => onConfirm('N')}>N</button>
        </div>
      </div>
    );
  }
  if (dialog.type === 'password') {
    return (
      <div className="bios-box setup-confirm" role="dialog" aria-label="Password">
        <p>
          {dialog.stage === 'enter' ? 'Enter Password: ' : 'Confirm Password: '}
          <span className="password-stars">{'*'.repeat(dialog.value.length)}</span>
          <span className="blink">_</span>
        </p>
      </div>
    );
  }
  return (
    <div className="bios-box" role="dialog" onClick={onClose}>
      {dialog.lines.map((line, index) => <p key={`${index}-${line}`}>{line || '\u00a0'}</p>)}
    </div>
  );
}

function firstCursor(page: SetupPage, values: Record<string, string>): Cursor {
  for (let column = 0; column < page.columns.length; column += 1) {
    const row = page.columns[column].findIndex((field) => isSelectable(field, values));
    if (row >= 0) return { column, row };
  }
  return { column: 0, row: 0 };
}

function selectableRows(page: SetupPage, values: Record<string, string>, column: number) {
  return page.columns[column].flatMap((field, row) => (isSelectable(field, values) ? [row] : []));
}

function moveInColumn(page: SetupPage, values: Record<string, string>, cursor: Cursor, direction: 1 | -1): Cursor {
  const rows = selectableRows(page, values, cursor.column);
  if (!rows.length) return cursor;
  const index = rows.indexOf(cursor.row);
  const next = index < 0
    ? rows.find((row) => (direction > 0 ? row > cursor.row : row < cursor.row)) ?? rows[0]
    : rows[(index + direction + rows.length) % rows.length];
  return { column: cursor.column, row: next };
}

function switchColumn(page: SetupPage, values: Record<string, string>, cursor: Cursor, direction: 1 | -1): Cursor {
  const column = cursor.column + direction;
  if (column < 0 || column >= page.columns.length) return cursor;
  const rows = selectableRows(page, values, column);
  if (!rows.length) return cursor;
  const nearest = rows.reduce((best, row) => (Math.abs(row - cursor.row) < Math.abs(best - cursor.row) ? row : best), rows[0]);
  return { column, row: nearest };
}

function moveVertical(current: number, direction: 1 | -1) {
  const columnSize = setupMenu.left.length;
  const column = Math.floor(current / columnSize);
  const row = current % columnSize;
  const nextRow = (row + direction + columnSize) % columnSize;
  return column * columnSize + nextRow;
}

function moveHorizontal(current: number, direction: 1 | -1) {
  const columnSize = setupMenu.left.length;
  const column = Math.floor(current / columnSize);
  const row = current % columnSize;
  const nextColumn = column + direction;
  if (nextColumn < 0 || nextColumn > 1) return current;
  return nextColumn * columnSize + row;
}

