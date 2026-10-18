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
import { DialogFooter } from './DialogFooter';
import type { AppProps } from './types';

type Draft = Pick<Settings, 'desktopColor' | 'saver' | 'saverWaitSeconds' | 'saverText3d' | 'saverMarqueeText'>;

const backgrounds = [
  { label: '(Kein)', color: '#008080' },
  { label: 'Mitternacht', color: '#000080' },
  { label: 'Schiefer', color: '#808080' },
  { label: 'Tannengrün', color: '#004000' },
  { label: 'Aubergine', color: '#400040' },
  { label: 'Ziegel', color: '#800000' },
  { label: 'Schwarz', color: '#000000' },
];

const saverOptions = [
  { label: '(Kein)', value: 'none' as SaverId },
  ...savers.map((saver) => ({ label: saver.name, value: saver.id as SaverId })),
];

function pickDraft(settings: Settings): Draft {
  const { desktopColor, saver, saverWaitSeconds, saverText3d, saverMarqueeText } = settings;
  return { desktopColor, saver, saverWaitSeconds, saverText3d, saverMarqueeText };
}

export function DisplayApp({ onClose }: AppProps) {
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
        <Tab value={0}>Hintergrund</Tab>
        <Tab value={1}>Bildschirmschoner</Tab>
        <Tab value={2}>Einstellungen</Tab>
      </Tabs>
      <TabBody className="props-body">
        {tab === 0 ? (
          <div className="stack">
            <div className="monitor-wrap">
              <Monitor backgroundStyles={{ background: draft.desktopColor }} />
            </div>
            <GroupBox label="Hintergrund">
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
                  Farbe:
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
            <GroupBox label="Bildschirmschoner">
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
                  Einstellungen...
                </Button>
                <Button
                  disabled={draft.saver === 'none'}
                  onClick={() => previewScreensaver(draft.saver, draft.saverText3d, draft.saverMarqueeText)}
                >
                  Vorschau
                </Button>
              </div>
              {editingText && textKey ? (
                <label className="saver-text">
                  {draft.saver === 'marquee' ? 'Lauftext:' : 'Text:'}
                  <TextInput
                    value={draft[textKey]}
                    maxLength={draft.saver === 'marquee' ? 120 : 24}
                    onChange={(event) => patch({ [textKey]: event.target.value })}
                    fullWidth
                  />
                </label>
              ) : null}
              <div className="saver-wait">
                <span>Wartezeit:</span>
                <NumberInput
                  min={5}
                  max={3600}
                  step={5}
                  width={80}
                  value={draft.saverWaitSeconds}
                  onChange={(value) => patch({ saverWaitSeconds: Math.max(5, Math.round(value)) })}
                />
                <span>Sekunden</span>
              </div>
            </GroupBox>
            <GroupBox label="Energiesparfunktionen des Bildschirms">
              <div className="energy-row">
                <img src="/img/energy-star.png" alt="Energy Star" />
                <p>Klicken Sie auf „Einstellungen“, um die Energieoptionen für Ihren Bildschirm anzupassen.</p>
                <Button disabled>Einstellungen...</Button>
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
              <dt>Anzeige:</dt>
              <dd>Plug & Play-Monitor an NVIDIA GeForce4 MX 440</dd>
              <dt>Farbpalette:</dt>
              <dd>True Color (32 Bit)</dd>
              <dt>Bildschirmbereich:</dt>
              <dd>{window.innerWidth} x {window.innerHeight} Pixel</dd>
            </dl>
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
        applyDisabled={!dirty}
      />
    </div>
  );
}
