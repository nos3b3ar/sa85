import { useMemo, useState, type ReactNode } from 'react';
import { Frame, GroupBox, Select, Tab, TabBody, Tabs, TextInput } from 'react95';
import { languageNames, localeTags, useT } from '../i18n';
import { currencies, currencyInfo, dateInfo, firstDayOfWeek, numberInfo, timeInfo, weekdayName } from '../i18n/format';
import { getSettings, locales, updateSettings, type Locale } from '../settings/settings';
import { WorldMap } from './DateTimeApp';
import { DialogFooter } from './DialogFooter';
import type { AppProps } from './types';

const markers: Record<Locale, { x: number; y: number }> = {
  de: { x: 104, y: 22 },
  en: { x: 40, y: 30 },
  fr: { x: 99, y: 25 },
  es: { x: 96, y: 30 },
  ja: { x: 172, y: 27 },
  th: { x: 150, y: 42 },
};

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <span>{label}</span>
      <TextInput readOnly value={String(value)} style={{ width: 170 }} />
    </>
  );
}

export function RegionalApp({ onClose }: AppProps) {
  const [tab, setTab] = useState(0);
  const [draft, setDraft] = useState<Locale>(() => getSettings().locale);
  const [saved, setSaved] = useState<Locale>(draft);
  const t = useT();
  const tag = localeTags[draft];
  const now = useMemo(() => new Date(), []);
  const numbers = useMemo(() => numberInfo(tag), [tag]);
  const money = useMemo(() => currencyInfo(tag, currencies[draft]), [tag, draft]);
  const time = useMemo(() => timeInfo(tag, now), [tag, now]);
  const date = useMemo(() => dateInfo(tag, now), [tag, now]);
  const r = t.regional;

  const apply = () => {
    updateSettings({ locale: draft });
    setSaved(draft);
  };

  const calendarName = (r.calendars as Record<string, string | undefined>)[date.calendar] ?? date.calendar;

  return (
    <div className="props-dialog">
      <Tabs value={tab} onChange={(value) => setTab(value as number)}>
        {r.tabs.map((label, index) => <Tab key={label} value={index}>{label}</Tab>)}
      </Tabs>
      <TabBody className="props-body">
        {tab === 0 ? (
          <div className="stack">
            <p>{r.intro}</p>
            <Frame variant="field" className="world-map regional-map">
              <WorldMap marker={markers[draft]} />
            </Frame>
            <div className="regional-grid">
              <span>{r.region}</span>
              <Select
                width="100%"
                menuMaxHeight={180}
                options={locales.map((value) => ({ value, label: r.regions[value] }))}
                value={draft}
                onChange={(option) => setDraft(option.value)}
              />
              <span>{r.language}</span>
              <Select
                width="100%"
                menuMaxHeight={180}
                options={locales.map((value) => ({ value, label: languageNames[value] }))}
                value={draft}
                onChange={(option) => setDraft(option.value)}
              />
            </div>
            <p className="muted">{r.languageNote}</p>
          </div>
        ) : null}
        {tab === 1 ? (
          <div className="stack">
            <GroupBox label={t.common.example}>
              <div className="regional-grid">
                <Field label={r.positive} value={numbers.positive} />
                <Field label={r.negative} value={numbers.negative} />
              </div>
            </GroupBox>
            <div className="regional-grid">
              <Field label={r.decimal} value={numbers.decimal} />
              <Field label={r.decimals} value={2} />
              <Field label={r.grouping} value={/^\s$/u.test(numbers.group) ? r.space : numbers.group} />
              <Field label={r.groupSize} value={numbers.groupSize} />
              <Field label={r.minus} value={numbers.minus} />
              <Field label={r.leadingZero} value={numbers.leadingZero} />
              <Field label={r.measurement} value={draft === 'en' ? r.us : r.metric} />
            </div>
          </div>
        ) : null}
        {tab === 2 ? (
          <div className="stack">
            <GroupBox label={t.common.example}>
              <div className="regional-grid">
                <Field label={r.positive} value={money.positive} />
                <Field label={r.negative} value={money.negative} />
              </div>
            </GroupBox>
            <div className="regional-grid">
              <Field label={r.currencySymbol} value={money.symbol} />
              <Field label={r.currencyCode} value={currencies[draft]} />
              <Field label={r.decimal} value={numbers.decimal} />
              <Field label={r.decimals} value={money.decimals} />
              <Field label={r.grouping} value={/^\s$/u.test(numbers.group) ? r.space : numbers.group} />
            </div>
          </div>
        ) : null}
        {tab === 3 ? (
          <div className="stack">
            <GroupBox label={t.common.example}>
              <div className="regional-grid">
                <Field label={r.timeExample} value={time.example} />
              </div>
            </GroupBox>
            <div className="regional-grid">
              <Field label={r.timeFormat} value={time.pattern} />
              <Field label={r.hourCycle} value={time.is24h ? r.hours24 : r.hours12} />
              <Field label={r.timeSeparator} value={time.separator} />
              <Field label={r.am} value={time.am} />
              <Field label={r.pm} value={time.pm} />
            </div>
          </div>
        ) : null}
        {tab === 4 ? (
          <div className="stack">
            <GroupBox label={r.shortDate}>
              <div className="regional-grid">
                <Field label={`${t.common.example}:`} value={date.short} />
                <Field label={r.shortDate} value={date.shortPattern} />
                <Field label={r.dateSeparator} value={date.separator} />
              </div>
            </GroupBox>
            <GroupBox label={r.longDate}>
              <div className="regional-grid">
                <Field label={`${t.common.example}:`} value={date.long} />
                <Field label={r.longDate} value={date.longPattern} />
              </div>
            </GroupBox>
            <div className="regional-grid">
              <Field label={r.calendar} value={calendarName} />
              <Field label={r.firstDay} value={weekdayName(tag, firstDayOfWeek[draft])} />
            </div>
          </div>
        ) : null}
      </TabBody>
      <DialogFooter
        onOk={() => {
          apply();
          onClose();
        }}
        onCancel={onClose}
        onApply={apply}
        applyDisabled={draft === saved}
      />
    </div>
  );
}
