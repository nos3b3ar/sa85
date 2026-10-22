import { useRef } from 'react';
import type { Cmos } from '../cmos';
import type { Field, SetupPage } from './pages';

export type Cursor = { column: number; row: number };

type SetupPageViewProps = {
  page: SetupPage;
  cmos: Cmos;
  cursor: Cursor;
  tick: number;
  onSelect: (cursor: Cursor) => void;
  onModify: (cursor: Cursor, direction: 1 | -1) => void;
};

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function cmosClock(cmos: Cmos) {
  return new Date(Date.now() + cmos.clockOffsetMinutes * 60000);
}

function clockValue(id: 'date' | 'time', cmos: Cmos) {
  const now = cmosClock(cmos);
  if (id === 'date') {
    return `${weekdays[now.getDay()]}, ${months[now.getMonth()]} ${String(now.getDate()).padStart(2, ' ')} ${now.getFullYear()}`;
  }
  return [now.getHours(), now.getMinutes(), now.getSeconds()].map((part) => String(part).padStart(2, '0')).join(' : ');
}

export function isSelectable(field: Field, values: Record<string, string>) {
  if (field.kind === 'clock') return true;
  if (field.kind !== 'option') return false;
  return field.enabled ? field.enabled(values) : true;
}

export function fieldValue(field: Field, cmos: Cmos) {
  if (field.kind === 'clock') return clockValue(field.id, cmos);
  if (field.kind !== 'option') return '';
  if (field.enabled && !field.enabled(cmos.values)) return field.preset?.(cmos.values) ?? cmos.values[field.id];
  return cmos.values[field.id];
}

export const legend = [
  'ESC : Quit          \u2191\u2193\u2192\u2190 : Select Item',
  'F1  : Help          PU/PD/+/- : Modify',
  'F5  : Old Values    (Shift)F2 : Color',
  'F6  : Load BIOS Defaults',
  'F7  : Load Setup Defaults',
];

export function SetupPageView({ page, cmos, cursor, tick, onSelect, onModify }: SetupPageViewProps) {
  const renderColumn = (fields: Field[], column: number) => fields.map((field, row) => {
    const width = page.labelWidth[column];
    if (field.kind === 'text') {
      return <div key={`t${row}`} className="setup-row">{field.text || '\u00a0'}</div>;
    }
    if (field.kind === 'info') {
      return (
        <div key={field.label} className="setup-row">
          {`${field.label.padEnd(width)} : `}
          <span className="setup-info">{field.value(cmos, tick)}</span>
        </div>
      );
    }
    const selectable = isSelectable(field, cmos.values);
    const selected = selectable && cursor.column === column && cursor.row === row;
    const value = fieldValue(field, cmos);
    const suffix = field.kind === 'option' ? field.suffix?.(cmos) : undefined;
    return (
      <div key={field.id} className={selectable ? 'setup-row' : 'setup-row is-disabled'}>
        {`${field.label.padEnd(width)} : `}
        <SetupValueButton
          selected={selected}
          selectable={selectable}
          value={value}
          onPrimary={() => {
            if (selected) onModify({ column, row }, 1);
            else onSelect({ column, row });
          }}
          onSecondary={() => {
            onSelect({ column, row });
            onModify({ column, row }, -1);
          }}
        />
        {suffix ?? null}
      </div>
    );
  });

  const legendBlock = (
    <div className="setup-legend">
      {legend.map((line) => <div key={line}>{line}</div>)}
    </div>
  );

  if (page.asideBottom) {
    return (
      <div className="setup-page is-single">
        <div className="setup-page-column">{renderColumn(page.columns[0], 0)}</div>
        <div className="setup-page-bottom">
          {legendBlock}
          <div className="setup-aside">{renderColumn(page.columns[1], 1)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-page">
      <div className="setup-page-column">{renderColumn(page.columns[0], 0)}</div>
      <div className="setup-page-column">
        {renderColumn(page.columns[1], 1)}
        {page.id === 'oem' ? null : legendBlock}
      </div>
    </div>
  );
}

function SetupValueButton({
  selected,
  selectable,
  value,
  onPrimary,
  onSecondary,
}: {
  selected: boolean;
  selectable: boolean;
  value: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  const pressRef = useRef<{ timer: number; fired: boolean } | null>(null);
  const clear = () => {
    if (pressRef.current) window.clearTimeout(pressRef.current.timer);
    pressRef.current = null;
  };
  return (
    <button
      type="button"
      className={selected ? 'setup-value is-selected' : 'setup-value'}
      disabled={!selectable}
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse') return;
        clear();
        if (event.pressure >= 0.65 && event.pressure < 1) {
          pressRef.current = { timer: 0, fired: true };
          onSecondary();
          return;
        }
        const state = { timer: 0, fired: false };
        state.timer = window.setTimeout(() => {
          state.fired = true;
          onSecondary();
        }, 440);
        pressRef.current = state;
      }}
      onPointerMove={(event) => {
        const press = pressRef.current;
        if (!press || press.fired || event.pointerType === 'mouse') return;
        if (event.pressure >= 0.65 && event.pressure < 1) {
          window.clearTimeout(press.timer);
          press.fired = true;
          onSecondary();
        }
      }}
      onPointerUp={clear}
      onPointerCancel={clear}
      onClick={() => {
        if (pressRef.current?.fired) {
          pressRef.current = null;
          return;
        }
        onPrimary();
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onSecondary();
      }}
    >
      {value}
    </button>
  );
}
