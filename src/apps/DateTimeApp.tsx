import { useEffect, useState } from 'react';
import { Checkbox, Frame, GroupBox, NumberInput, Select, Tab, TabBody, Tabs, TextInput } from 'react95';
import { DialogFooter } from './DialogFooter';
import type { AppProps } from './types';

const months = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];
const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function DateTimeApp({ onClose }: AppProps) {
  const now = useNow();
  const [tab, setTab] = useState(0);
  const [view, setView] = useState(() => ({ year: now.getFullYear(), month: now.getMonth() }));
  const [picked, setPicked] = useState(() => now.getDate());
  const [autoDst, setAutoDst] = useState(true);

  const first = new Date(view.year, view.month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const isCurrentMonth = view.year === now.getFullYear() && view.month === now.getMonth();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - offset + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  return (
    <div className="props-dialog">
      <Tabs value={tab} onChange={(value) => setTab(value as number)}>
        <Tab value={0}>Datum &amp; Uhrzeit</Tab>
        <Tab value={1}>Zeitzone</Tab>
      </Tabs>
      <TabBody className="props-body">
        {tab === 0 ? (
          <div className="datetime-grid">
            <GroupBox label="Datum">
              <div className="date-controls">
                <Select
                  width={120}
                  menuMaxHeight={180}
                  options={months.map((label, value) => ({ label, value }))}
                  value={view.month}
                  onChange={(option) => setView((prev) => ({ ...prev, month: option.value }))}
                />
                <NumberInput
                  width={100}
                  min={1980}
                  max={2099}
                  value={view.year}
                  onChange={(value) => setView((prev) => ({ ...prev, year: Math.round(value) }))}
                />
              </div>
              <Frame variant="field" className="calendar-frame">
                <div className="calendar">
                {weekdays.map((day) => (
                  <span key={day} className="calendar-head">{day}</span>
                ))}
                {cells.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={day === null}
                    className={[
                      'calendar-day',
                      day === picked ? 'is-picked' : '',
                      isCurrentMonth && day === now.getDate() ? 'is-today' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => day && setPicked(day)}
                  >
                    {day ?? ''}
                  </button>
                ))}
                </div>
              </Frame>
            </GroupBox>
            <GroupBox label="Uhrzeit">
              <AnalogClock date={now} />
              <TextInput
                readOnly
                value={now.toLocaleTimeString('de-DE')}
                style={{ textAlign: 'center' }}
                fullWidth
              />
            </GroupBox>
            <p className="datetime-zone">Aktuelle Zeitzone: {zoneName(now)}</p>
          </div>
        ) : (
          <div className="stack">
            <Select
              width="100%"
              options={[{ label: '(GMT+01:00) Amsterdam, Berlin, Bern, Rom, Stockholm, Wien', value: 'berlin' }]}
              value="berlin"
            />
            <Frame variant="field" className="world-map">
              <WorldMap />
            </Frame>
            <Checkbox
              label="Uhr automatisch auf Sommer-/Winterzeit umstellen"
              checked={autoDst}
              onChange={(event) => setAutoDst(event.target.checked)}
            />
          </div>
        )}
      </TabBody>
      <DialogFooter onOk={onClose} onCancel={onClose} />
    </div>
  );
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function zoneName(date: Date) {
  const name = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', timeZoneName: 'long' })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;
  return name ?? 'Mitteleuropäische Zeit';
}

function AnalogClock({ date }: { date: Date }) {
  const seconds = date.getSeconds();
  const minutes = date.getMinutes() + seconds / 60;
  const hours = (date.getHours() % 12) + minutes / 60;
  const hand = (angle: number, length: number, width: number, color: string) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return (
      <line
        x1="50"
        y1="50"
        x2={50 + Math.cos(rad) * length}
        y2={50 + Math.sin(rad) * length}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="square"
      />
    );
  };
  return (
    <svg className="analog-clock" viewBox="0 0 100 100" role="img" aria-label={date.toLocaleTimeString('de-DE')}>
      {Array.from({ length: 12 }, (_, index) => {
        const rad = (index * 30 * Math.PI) / 180;
        return (
          <rect
            key={index}
            x={50 + Math.cos(rad) * 42 - 2.5}
            y={50 + Math.sin(rad) * 42 - 2.5}
            width="5"
            height="5"
            fill={index % 3 === 0 ? '#008080' : '#808080'}
            stroke="#000"
            strokeWidth="0.6"
          />
        );
      })}
      {hand(hours * 30, 24, 5, '#008080')}
      {hand(minutes * 6, 36, 3.5, '#008080')}
      {hand(seconds * 6, 38, 1, '#000')}
      <circle cx="50" cy="50" r="2.5" fill="#000" />
    </svg>
  );
}

function WorldMap() {
  return (
    <svg viewBox="0 0 200 90" className="world-svg" aria-hidden>
      <rect width="200" height="90" fill="#008080" />
      <path d="M20 18 L58 12 L66 30 L52 44 L44 62 L36 50 L22 40 Z" fill="#00a000" />
      <path d="M48 58 L60 60 L64 82 L54 86 L50 72 Z" fill="#00a000" />
      <path d="M92 16 L120 12 L170 16 L178 34 L150 44 L130 40 L114 46 L100 36 L94 26 Z" fill="#00a000" />
      <path d="M96 40 L112 42 L118 64 L106 80 L98 62 Z" fill="#00a000" />
      <path d="M160 60 L180 58 L184 72 L166 74 Z" fill="#00a000" />
      <rect x="100" y="0" width="12" height="90" fill="#fff" opacity="0.35" />
      <circle cx="104" cy="22" r="2" fill="#ff0" stroke="#000" strokeWidth="0.6" />
    </svg>
  );
}
