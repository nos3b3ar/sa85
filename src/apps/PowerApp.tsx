import { Powercfg211 } from '@react95/icons/Powercfg211';
import { useState } from 'react';
import { Button, Checkbox, GroupBox, ProgressBar, Select, Tab, TabBody, Tabs } from 'react95';
import { useT, type Messages } from '../i18n';
import { queryBattery, useBattery, type BatteryInfo } from '../power/battery';
import { PowerGlyph } from '../power/PowerGlyph';
import { getSettings, powerSchemes, updateSettings, type PowerScheme, type Settings } from '../settings/settings';
import { DialogFooter } from './DialogFooter';
import type { AppProps } from './types';

type Draft = Pick<Settings, 'powerScheme' | 'powerTimeouts' | 'showPowerMeter'>;

const timeoutSteps = [1, 2, 3, 5, 10, 15, 20, 25, 30, 45, 60, 120, 180, 240, 300, 0];

function timeoutLabel(t: Messages, minutes: number) {
  if (minutes === 0) return t.power.never;
  return minutes >= 60 ? t.power.afterHours(minutes / 60) : t.power.afterMinutes(minutes);
}

function pickDraft(settings: Settings): Draft {
  const { powerScheme, powerTimeouts, showPowerMeter } = settings;
  return { powerScheme, powerTimeouts, showPowerMeter };
}

export function PowerApp({ onClose }: AppProps) {
  const t = useT();
  const p = t.power;
  const [tab, setTab] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => pickDraft(getSettings()));
  const [saved, setSaved] = useState<Draft>(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const timeouts = draft.powerTimeouts[draft.powerScheme];
  const options = timeoutSteps.map((value) => ({ value, label: timeoutLabel(t, value) }));

  const setPowerTimeout = (key: 'monitor' | 'disk', value: number) => setDraft((prev) => ({
    ...prev,
    powerTimeouts: { ...prev.powerTimeouts, [prev.powerScheme]: { ...prev.powerTimeouts[prev.powerScheme], [key]: value } },
  }));

  const apply = () => {
    updateSettings(draft);
    setSaved(draft);
  };

  return (
    <div className="props-dialog">
      <Tabs value={tab} onChange={(value) => setTab(value as number)}>
        {p.tabs.map((label, index) => <Tab key={label} value={index}>{label}</Tab>)}
      </Tabs>
      <TabBody className="props-body">
        {tab === 0 ? (
          <div className="stack">
            <div className="power-intro">
              <Powercfg211 variant="32x32_4" />
              <p>{p.intro}</p>
            </div>
            <GroupBox label={p.schemes}>
              <Select
                width="100%"
                options={powerSchemes.map((value) => ({ value, label: p.schemeNames[value] }))}
                value={draft.powerScheme}
                onChange={(option) => setDraft((prev) => ({ ...prev, powerScheme: option.value as PowerScheme }))}
              />
              <div className="button-row is-end power-scheme-buttons">
                <Button disabled>{p.saveAs}</Button>
                <Button disabled>{p.delete}</Button>
              </div>
            </GroupBox>
            <GroupBox label={p.settingsFor(p.schemeNames[draft.powerScheme])}>
              <div className="regional-grid">
                <span>{p.monitorOff}</span>
                <Select width={170} menuMaxHeight={180} options={options} value={timeouts.monitor} onChange={(option) => setPowerTimeout('monitor', option.value)} />
                <span>{p.diskOff}</span>
                <Select width={170} menuMaxHeight={180} options={options} value={timeouts.disk} onChange={(option) => setPowerTimeout('disk', option.value)} />
              </div>
              <p className="muted">{p.monitorNote}</p>
            </GroupBox>
          </div>
        ) : null}
        {tab === 1 ? (
          <div className="stack">
            <GroupBox label={p.options}>
              <div className="stack">
                <Checkbox
                  label={p.showMeter}
                  checked={draft.showPowerMeter}
                  onChange={(event) => setDraft((prev) => ({ ...prev, showPowerMeter: event.target.checked }))}
                />
                <Checkbox label={p.standbyPassword} checked={false} disabled onChange={() => undefined} />
              </div>
            </GroupBox>
          </div>
        ) : null}
        {tab === 2 ? <PowerMeter /> : null}
      </TabBody>
      <DialogFooter
        onOk={() => {
          apply();
          onClose();
        }}
        onCancel={onClose}
        onApply={apply}
        applyDisabled={!dirty}
      />
    </div>
  );
}

function duration(t: Messages, seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return t.common.unknown;
  const total = Math.round(seconds / 60);
  return t.power.duration(Math.floor(total / 60), total % 60);
}

function BatteryFacts({ info }: { info: BatteryInfo }) {
  const t = useT();
  const p = t.power;
  if (!info.present) {
    return <p>{p.noBattery}</p>;
  }
  const percent = Math.round(info.level * 100);
  const state = info.level >= 1 && info.charging ? p.full : info.charging ? p.charging : p.discharging;
  return (
    <>
      <dl className="facts">
        <dt>{p.source}</dt>
        <dd>{info.charging ? p.ac : p.battery}</dd>
        <dt>{p.state}</dt>
        <dd>{state}</dd>
        <dt>{info.charging ? p.untilFull : p.remaining}</dt>
        <dd>{info.charging ? (info.level >= 1 ? p.full : duration(t, info.chargingTime)) : duration(t, info.dischargingTime)}</dd>
      </dl>
      <span>{p.level}</span>
      <ProgressBar value={percent} />
    </>
  );
}

function PowerMeter() {
  const t = useT();
  const p = t.power;
  const battery = useBattery();
  const info = battery.status === 'ready' ? battery.info : null;
  return (
    <div className="stack">
      <GroupBox label={p.status}>
        <div className="power-meter">
          <span className="power-meter-glyph" aria-hidden>
            <PowerGlyph info={info} />
          </span>
          <div className="power-meter-body">
            {battery.status === 'idle' ? <p>{p.notQueried}</p> : null}
            {battery.status === 'loading' ? <p>{p.querying}</p> : null}
            {battery.status === 'unsupported' ? (
              <>
                <p>{p.noBattery}</p>
                <p className="muted">{p.unsupported}</p>
              </>
            ) : null}
            {info ? <BatteryFacts info={info} /> : null}
          </div>
        </div>
      </GroupBox>
      <div className="button-row is-end">
        <Button onClick={() => void queryBattery()} disabled={battery.status === 'loading'}>{p.query}</Button>
      </div>
    </div>
  );
}
