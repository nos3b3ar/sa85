import { useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Frame, GroupBox, Radio, Select, Tab, TabBody, Tabs } from 'react95';
import { cursorFrames, cursorValue } from '../cursors/render';
import { cursorFromFile, CursorUploadError } from '../cursors/upload';
import { useDoubleActivate } from '../desktop/useDoubleActivate';
import { useT } from '../i18n';
import {
  cursorRoles,
  cursorSchemes,
  getSettings,
  updateSettings,
  useSettings,
  type CursorRole,
  type MouseSettings,
} from '../settings/settings';
import { DialogFooter } from './DialogFooter';
import { SliderRow } from './shared/SliderRow';
import type { AppProps } from './types';

const slowestMs = 900;
const stepMs = 75;
const toSlider = (ms: number) => Math.round((slowestMs - ms) / stepMs);
const toMs = (value: number) => slowestMs - value * stepMs;

export function MouseApp({ onClose }: AppProps) {
  const t = useT();
  const { desktopColor } = useSettings();
  const [tab, setTab] = useState(0);
  const [draft, setDraft] = useState<MouseSettings>(() => getSettings().mouse);
  const [saved, setSaved] = useState<MouseSettings>(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const patch = (next: Partial<MouseSettings>) => setDraft((prev) => ({ ...prev, ...next }));

  const apply = () => {
    updateSettings({ mouse: draft });
    setSaved(draft);
  };

  return (
    <div className="props-dialog">
      <Tabs value={tab} onChange={(value) => setTab(value as number)}>
        {t.mouse.tabs.map((label, index) => <Tab key={label} value={index}>{label}</Tab>)}
      </Tabs>
      <TabBody className="props-body">
        {tab === 0 ? <ButtonsTab draft={draft} patch={patch} /> : null}
        {tab === 1 ? <PointersTab draft={draft} patch={patch} desktopColor={desktopColor} /> : null}
        {tab === 2 ? (
          <div className="stack">
            <GroupBox label={t.mouse.speed}>
              <div className="mouse-group">
                <MotionGlyph />
                <div className="mouse-group-body">
                  <SliderRow
                    min={1}
                    max={11}
                    value={draft.speed}
                    onChange={(speed) => patch({ speed })}
                    left={t.mouse.slow}
                    right={t.mouse.fast}
                  />
                  <p className="muted">{t.mouse.speedNote}</p>
                </div>
              </div>
            </GroupBox>
            <GroupBox label={t.mouse.trail}>
              <div className="mouse-group">
                <TrailGlyph />
                <div className="mouse-group-body">
                  <Checkbox
                    label={t.mouse.showTrail}
                    checked={draft.trail}
                    onChange={(event) => patch({ trail: event.target.checked })}
                  />
                  <SliderRow
                    min={1}
                    max={7}
                    value={draft.trailLength}
                    onChange={(trailLength) => patch({ trailLength })}
                    left={t.mouse.short}
                    right={t.mouse.long}
                    disabled={!draft.trail}
                  />
                </div>
              </div>
            </GroupBox>
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

type TabProps = { draft: MouseSettings; patch: (next: Partial<MouseSettings>) => void };

function ButtonsTab({ draft, patch }: TabProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const test = useDoubleActivate(() => setOpen((value) => !value), {
    threshold: draft.doubleClickMs,
    leftHanded: draft.leftHanded,
  });
  const left = draft.leftHanded ? t.mouse.context : t.mouse.select;
  const right = draft.leftHanded ? t.mouse.select : t.mouse.context;

  return (
    <div className="stack">
      <GroupBox label={t.mouse.buttonConfig}>
        <div className="mouse-buttons">
          <div className="mouse-handed">
            <Radio
              name="mouse-handed"
              value="right"
              label={t.mouse.rightHanded}
              checked={!draft.leftHanded}
              onChange={() => patch({ leftHanded: false })}
            />
            <Radio
              name="mouse-handed"
              value="left"
              label={t.mouse.leftHanded}
              checked={draft.leftHanded}
              onChange={() => patch({ leftHanded: true })}
            />
          </div>
          <div className="mouse-button-text">
            <strong>{t.mouse.primary}</strong>
            <span>{left}</span>
          </div>
          <MouseGlyph leftHanded={draft.leftHanded} />
          <div className="mouse-button-text">
            <strong>{t.mouse.secondary}</strong>
            <span>{right}</span>
          </div>
        </div>
      </GroupBox>
      <GroupBox label={t.mouse.doubleClick}>
        <div className="mouse-double">
          <div className="mouse-group-body">
            <SliderRow
              min={0}
              max={10}
              value={toSlider(draft.doubleClickMs)}
              onChange={(value) => patch({ doubleClickMs: toMs(value) })}
              left={t.mouse.slow}
              right={t.mouse.fast}
            />
            <p className="muted">{t.mouse.testHint}</p>
          </div>
          <div className="mouse-test">
            <span>{t.mouse.testArea}</span>
            <Frame variant="field" className="mouse-test-field">
              <button
                type="button"
                className="jack-box"
                aria-pressed={open}
                aria-label={t.mouse.testHint}
                onPointerUp={test.onPointerUp}
                onContextMenu={test.onContextMenu}
              >
                <JackInTheBox open={open} />
              </button>
            </Frame>
          </div>
        </div>
      </GroupBox>
    </div>
  );
}

function PointersTab({ draft, patch, desktopColor }: TabProps & { desktopColor: string }) {
  const t = useT();
  const [role, setRole] = useState<CursorRole>('normal');
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const previews = useMemo(
    () => Object.fromEntries(cursorRoles.map((item) => [item, cursorFrames(item, draft, desktopColor)[0]])) as Record<CursorRole, ReturnType<typeof cursorFrames>[0]>,
    [draft, desktopColor],
  );
  const selected = previews[role];
  const hasCustom = Object.keys(draft.custom).length > 0;

  const upload = async (file: File) => {
    setError(null);
    try {
      const cursor = await cursorFromFile(file, role);
      patch({ custom: { ...draft.custom, [role]: cursor } });
    } catch (reason) {
      setError(reason instanceof CursorUploadError && reason.reason === 'tooBig' ? t.mouse.uploadTooBig : t.mouse.uploadFailed);
    }
  };

  return (
    <div className="stack">
      <div className="cursor-head">
        <GroupBox label={t.mouse.scheme} className="cursor-scheme">
          <Select
            width="100%"
            menuMaxHeight={180}
            options={[
              ...cursorSchemes.map((scheme) => ({ value: scheme, label: t.mouse.schemes[scheme] })),
              ...(hasCustom ? [{ value: 'custom', label: t.mouse.custom }] : []),
            ]}
            value={hasCustom ? 'custom' : draft.scheme}
            onChange={(option) => {
              if (option.value === 'custom') return;
              patch({ scheme: option.value as MouseSettings['scheme'], custom: {} });
            }}
          />
        </GroupBox>
        <Frame variant="field" className="cursor-preview" style={{ cursor: cursorValue(selected, role) }}>
          <img src={selected.url} width={selected.width} height={selected.height} alt="" />
        </Frame>
      </div>
      <Frame variant="field" className="cursor-list">
        {cursorRoles.map((item) => {
          const preview = previews[item];
          return (
            <div
              key={item}
              className={item === role ? 'cursor-row is-selected' : 'cursor-row'}
              tabIndex={0}
              aria-selected={item === role}
              style={{ cursor: cursorValue(preview, item) }}
              onClick={() => setRole(item)}
              onKeyDown={(event) => {
                const index = cursorRoles.indexOf(item);
                if (event.key === 'ArrowDown') setRole(cursorRoles[Math.min(cursorRoles.length - 1, index + 1)]);
                if (event.key === 'ArrowUp') setRole(cursorRoles[Math.max(0, index - 1)]);
              }}
            >
              <span>{t.mouse.roles[item]}</span>
              <span className="cursor-thumb">
                <img
                  src={preview.url}
                  alt=""
                  width={Math.min(32, preview.width)}
                  height={Math.min(32, preview.height)}
                  style={{ objectFit: 'contain' }}
                />
              </span>
            </div>
          );
        })}
      </Frame>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="button-row is-end">
        <Button
          disabled={!draft.custom[role]}
          onClick={() => {
            const custom = { ...draft.custom };
            delete custom[role];
            patch({ custom });
          }}
        >
          {t.common.reset}
        </Button>
        <Button onClick={() => input.current?.click()}>{t.common.browse}</Button>
        <input
          ref={input}
          type="file"
          hidden
          accept=".svg,.png,.ico,.cur,image/svg+xml,image/png,image/x-icon,image/vnd.microsoft.icon"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void upload(file);
          }}
        />
      </div>
    </div>
  );
}

function MouseGlyph({ leftHanded }: { leftHanded: boolean }) {
  return (
    <svg className="mouse-glyph" viewBox="0 0 40 60" width="40" height="60" shapeRendering="crispEdges" aria-hidden>
      <path d="M20 0v6" stroke="#000" strokeWidth="2" fill="none" />
      <rect x="4" y="6" width="32" height="50" rx="10" fill="#c0c0c0" stroke="#000" strokeWidth="2" />
      <path d="M5 26h30M20 7v19" stroke="#000" strokeWidth="2" />
      <path d={leftHanded ? 'M21 8h12a2 2 0 0 1 2 2v15H21z' : 'M5 25V10a2 2 0 0 1 2-2h12v17z'} fill="#000080" />
      <path d="M8 30h24" stroke="#fff" strokeWidth="1" />
    </svg>
  );
}

function JackInTheBox({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 48 56" width="48" height="56" shapeRendering="crispEdges" aria-hidden>
      {open ? (
        <>
          <path d="M24 34 18 30 30 26 18 22 30 18" stroke="#808080" strokeWidth="2" fill="none" />
          <circle cx="24" cy="10" r="8" fill="#ffff00" stroke="#000" />
          <path d="M16 6 24 -2 32 6z" fill="#ff0000" stroke="#000" />
          <circle cx="21" cy="9" r="1" fill="#000" />
          <circle cx="27" cy="9" r="1" fill="#000" />
          <circle cx="24" cy="12" r="1.5" fill="#ff0000" />
          <path d="M8 34 2 22 18 30z" fill="#800000" stroke="#000" />
        </>
      ) : (
        <path d="M8 34h32v-4H8z" fill="#800000" stroke="#000" />
      )}
      <rect x="8" y="34" width="32" height="20" fill="#ff8000" stroke="#000" />
      <path d="M24 38v12M18 44h12" stroke="#ffff00" strokeWidth="3" />
    </svg>
  );
}

function MotionGlyph() {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" shapeRendering="crispEdges" aria-hidden>
      <path d="M4 4v14l4-4 3 7 2-1-3-7h6z" fill="#fff" stroke="#000" />
      <path d="M18 20h10M22 16l6 4-6 4" stroke="#000080" strokeWidth="2" fill="none" />
    </svg>
  );
}

function TrailGlyph() {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" shapeRendering="crispEdges" aria-hidden>
      {[0, 7, 14].map((offset, index) => (
        <path
          key={offset}
          d={`M${2 + offset} ${2 + offset}v12l3-3 2 5 2-1-2-5h5z`}
          fill="#fff"
          stroke="#000"
          opacity={0.4 + index * 0.3}
        />
      ))}
    </svg>
  );
}
