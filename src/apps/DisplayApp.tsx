import { useState } from 'react';
import {
  Button,
  ColorInput,
  Frame,
  GroupBox,
  Monitor,
  NumberInput,
  Select,
  Tab,
  TabBody,
  Tabs,
  TextInput,
} from 'react95';
import { savers, getSaver } from '../screensaver/catalog';
import { previewScreensaver } from '../screensaver/ScreensaverHost';
import { SaverCanvas } from '../screensaver/SaverCanvas';
import { getSettings, updateSettings, type SaverId, type Settings } from '../settings/settings';
import { useT } from '../i18n';
import { DialogFooter } from './DialogFooter';
import { LookPicker } from './shared/LookPicker';
import type { AppProps } from './types';

type Draft = Pick<Settings, 'desktopColor' | 'saver' | 'saverWaitSeconds' | 'saverText3d' | 'saverMarqueeText' | 'look'>;

const backgroundColors = ['#008080', '#000080', '#808080', '#004000', '#400040', '#800000', '#000000'];

function pickDraft(settings: Settings): Draft {
  const { desktopColor, saver, saverWaitSeconds, saverText3d, saverMarqueeText, look } = settings;
  return { desktopColor, saver, saverWaitSeconds, saverText3d, saverMarqueeText, look };
}

export function DisplayApp({ onClose }: AppProps) {
  const t = useT();
  const backgrounds = backgroundColors.map((color, index) => ({ label: t.display.backgrounds[index], color }));
  const saverOptions = [
    { label: t.display.saverNone, value: 'none' as SaverId },
    ...savers.map((saver) => ({ label: t.display.savers[saver.id], value: saver.id as SaverId })),
  ];
  const [tab, setTab] = useState(1);
  const [draft, setDraft] = useState<Draft>(() => pickDraft(getSettings()));
  const [saved, setSaved] = useState<Draft>(draft);
  const [editingText, setEditingText] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const saverDef = getSaver(draft.saver);
  const textKey = saverDef?.textOption;
  const patch = (next: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...next }));

  const apply = () => {
    updateSettings(draft);
    setSaved(draft);
  };

  return (
    <div className="props-dialog">
      <Tabs value={tab} onChange={(value) => setTab(value as number)}>
        {t.display.tabs.map((label, index) => (
          <Tab key={label} value={index}>
            {label}
          </Tab>
        ))}
      </Tabs>
      <TabBody className="props-body">
        {tab === 0 ? (
          <div className="stack">
            <div className="monitor-wrap">
              <Monitor backgroundStyles={{ background: draft.desktopColor }} />
            </div>
            <GroupBox label={t.display.background}>
              <div className="background-row">
                <Frame variant="field" className="pick-list">
                  {backgrounds.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={item.color === draft.desktopColor ? 'pick-item is-selected' : 'pick-item'}
                      onClick={() => patch({ desktopColor: item.color })}
                    >
                      <span className="swatch" style={{ background: item.color }} />
                      {item.label}
                    </button>
                  ))}
                </Frame>
                <label className="color-field">
                  {t.display.color}
                  <ColorInput
                    value={draft.desktopColor}
                    onChange={(event) => patch({ desktopColor: event.target.value })}
                  />
                </label>
              </div>
            </GroupBox>
          </div>
        ) : null}
        {tab === 1 ? (
          <div className="stack">
            <div className="monitor-wrap">
              <Monitor backgroundStyles={{ background: '#000', padding: 0 }}>
                {draft.saver === 'none' ? null : (
                  <SaverCanvas
                    saver={draft.saver}
                    options={{ text3d: draft.saverText3d, marqueeText: draft.saverMarqueeText }}
                    className="saver-canvas"
                  />
                )}
              </Monitor>
            </div>
            <GroupBox label={t.display.saver}>
              <div className="saver-row">
                <Select
                  width={180}
                  menuMaxHeight={190}
                  options={saverOptions}
                  value={draft.saver}
                  onChange={(option) => {
                    patch({ saver: option.value });
                    setEditingText(false);
                  }}
                />
                <Button disabled={!textKey} onClick={() => setEditingText((value) => !value)}>
                  {t.display.saverSettings}
                </Button>
                <Button
                  disabled={draft.saver === 'none'}
                  onClick={() => previewScreensaver(draft.saver, draft.saverText3d, draft.saverMarqueeText)}
                >
                  {t.display.preview}
                </Button>
              </div>
              {editingText && textKey ? (
                <label className="saver-text">
                  {draft.saver === 'marquee' ? t.display.marqueeText : t.display.text}
                  <TextInput
                    value={draft[textKey]}
                    maxLength={draft.saver === 'marquee' ? 120 : 24}
                    onChange={(event) => patch({ [textKey]: event.target.value })}
                    fullWidth
                  />
                </label>
              ) : null}
              <div className="saver-wait">
                <span>{t.display.wait}</span>
                <NumberInput
                  min={5}
                  max={3600}
                  step={5}
                  width={80}
                  value={draft.saverWaitSeconds}
                  onChange={(value) => patch({ saverWaitSeconds: Math.max(5, Math.round(value)) })}
                />
                <span>{t.display.seconds}</span>
              </div>
            </GroupBox>
            <GroupBox label={t.display.energy}>
              <div className="energy-row">
                <img src="/img/energy-star.png" alt="Energy Star" />
                <p>{t.display.energyText}</p>
                <Button disabled>{t.display.saverSettings}</Button>
              </div>
            </GroupBox>
          </div>
        ) : null}
        {tab === 2 ? (
          <div className="stack">
            <div className="monitor-wrap">
              <Monitor backgroundStyles={{ background: draft.desktopColor }} />
            </div>
            <dl className="facts">
              <dt>{t.display.monitor}</dt>
              <dd>Plug & Play-Monitor an NVIDIA GeForce4 MX 440</dd>
              <dt>{t.display.palette}</dt>
              <dd>True Color (32 Bit)</dd>
              <dt>{t.display.area}</dt>
              <dd>{t.display.pixels(window.innerWidth, window.innerHeight)}</dd>
            </dl>
          </div>
        ) : null}
        {tab === 3 ? <LookPicker name="display-look" value={draft.look} onChange={(look) => patch({ look })} /> : null}
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
