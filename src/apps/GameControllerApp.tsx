import { Joy102 } from '@react95/icons/Joy102';
import { useEffect, useRef, useState } from 'react';
import { Button, Frame, GroupBox, Tab, TabBody, Tabs } from 'react95';
import { useT } from '../i18n';
import { SubDialog } from './shared/SubDialog';
import type { AppProps } from './types';

type PadSummary = { index: number; id: string; connected: boolean };

const supported = typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function';

function readPads(): Gamepad[] {
  if (!supported) return [];
  return [...navigator.getGamepads()].filter((pad): pad is Gamepad => Boolean(pad));
}

/** Browser kürzen die ID nicht. "Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)" wird lesbar gekürzt. */
export function padName(id: string) {
  return id.replace(/\s*\((?:STANDARD GAMEPAD\s*)?Vendor:.*\)$/i, '').replace(/^[0-9a-f]{4}-[0-9a-f]{4}-/i, '').trim() || id;
}

function usePadList() {
  const [pads, setPads] = useState<PadSummary[]>([]);
  useEffect(() => {
    if (!supported) return;
    const update = () => {
      const live = readPads();
      setPads((prev) => {
        const next = live.map((pad) => ({ index: pad.index, id: pad.id, connected: pad.connected }));
        for (const old of prev) {
          if (!next.some((pad) => pad.id === old.id)) next.push({ ...old, connected: false });
        }
        return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
      });
    };
    window.addEventListener('gamepadconnected', update);
    window.addEventListener('gamepaddisconnected', update);
    const timer = window.setInterval(update, 500);
    update();
    return () => {
      window.removeEventListener('gamepadconnected', update);
      window.removeEventListener('gamepaddisconnected', update);
      window.clearInterval(timer);
    };
  }, []);
  return pads;
}

export function GameControllerApp({ onClose }: AppProps) {
  const t = useT();
  const g = t.gamepad;
  const pads = usePadList();
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'add' | 'test' | null>(null);
  const visible = pads.filter((pad) => !hidden.includes(pad.id) || pad.connected);
  const current = visible.find((pad) => pad.id === selected) ?? visible[0];

  useEffect(() => {
    // Ein erneut verbundener Controller erscheint wieder, auch wenn er entfernt wurde.
    const onConnect = (event: GamepadEvent) => setHidden((prev) => prev.filter((id) => id !== event.gamepad.id));
    window.addEventListener('gamepadconnected', onConnect);
    return () => window.removeEventListener('gamepadconnected', onConnect);
  }, []);

  return (
    <div className="props-dialog">
      <Tabs value={0}>
        <Tab value={0}>{g.controllers}</Tab>
      </Tabs>
      <TabBody className="props-body">
        <div className="stack">
          <div className="power-intro">
            <Joy102 variant="32x32_4" />
            <p>{g.intro}</p>
          </div>
          <span>{g.controllers}:</span>
          <Frame variant="field" className="pad-list">
            <div className="pad-row is-head">
              <span>{g.name}</span>
              <span>{g.status}</span>
            </div>
            {!supported ? <p className="pad-empty">{g.unsupported}</p> : null}
            {supported && visible.length === 0 ? <p className="pad-empty">{g.none}</p> : null}
            {visible.map((pad) => (
              <div
                key={pad.id}
                tabIndex={0}
                className={pad.id === current?.id ? 'pad-row is-selected' : 'pad-row'}
                onClick={() => setSelected(pad.id)}
                onDoubleClick={() => pad.connected && setDialog('test')}
              >
                <span>{padName(pad.id)}</span>
                <span>{pad.connected ? g.ok : g.notConnected}</span>
              </div>
            ))}
          </Frame>
          <div className="button-row is-end">
            <Button disabled={!supported} onClick={() => setDialog('add')}>{t.common.add}</Button>
            <Button
              disabled={!current}
              onClick={() => current && setHidden((prev) => [...prev, current.id])}
            >
              {t.common.remove}
            </Button>
            <Button disabled={!current?.connected} onClick={() => setDialog('test')}>{t.common.properties}</Button>
          </div>
          <p className="muted">{g.hint}</p>
        </div>
      </TabBody>
      <div className="dialog-footer">
        <Button onClick={onClose} style={{ minWidth: 84 }}>{t.common.ok}</Button>
      </div>

      {dialog === 'add' ? (
        <AddDialog
          onClose={(id) => {
            if (id) {
              setHidden((prev) => prev.filter((entry) => entry !== id));
              setSelected(id);
            }
            setDialog(null);
          }}
        />
      ) : null}
      {dialog === 'test' && current ? <TestDialog padId={current.id} onClose={() => setDialog(null)} /> : null}
    </div>
  );
}

function AddDialog({ onClose }: { onClose: (id?: string) => void }) {
  const t = useT();
  const g = t.gamepad;
  const [found, setFound] = useState<Gamepad | null>(null);

  useEffect(() => {
    if (found) return;
    let frame = 0;
    const known = new Set(readPads().filter((pad) => pad.buttons.some((button) => button.pressed)).map((pad) => pad.id));
    const scan = () => {
      const pad = readPads().find((item) => item.buttons.some((button) => button.pressed) && !known.has(item.id));
      if (pad) {
        setFound(pad);
        return;
      }
      frame = requestAnimationFrame(scan);
    };
    const onConnect = (event: GamepadEvent) => setFound(event.gamepad);
    window.addEventListener('gamepadconnected', onConnect);
    frame = requestAnimationFrame(scan);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('gamepadconnected', onConnect);
    };
  }, [found]);

  return (
    <SubDialog title={g.addTitle} onClose={() => onClose()} width={360}>
      <div className="pad-add">
        <Joy102 variant="32x32_4" />
        <p className={found ? undefined : 'blink-soft'}>{found ? g.found(padName(found.id)) : g.press}</p>
      </div>
      <div className="dialog-footer">
        <Button disabled={!found} onClick={() => onClose(found?.id)} style={{ minWidth: 84 }}>{t.common.ok}</Button>
        <Button onClick={() => onClose()} style={{ minWidth: 84 }}>{t.common.cancel}</Button>
      </div>
    </SubDialog>
  );
}

type Snapshot = { axes: number[]; buttons: { pressed: boolean; value: number }[]; vibration: boolean } | null;

type VibrationActuator = { playEffect?: (type: string, params: Record<string, number>) => Promise<unknown> };

function TestDialog({ padId, onClose }: { padId: string; onClose: () => void }) {
  const t = useT();
  const g = t.gamepad;
  const [snapshot, setSnapshot] = useState<Snapshot>(null);
  const last = useRef('');

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = requestAnimationFrame(read);
      const pad = readPads().find((item) => item.id === padId);
      const next: Snapshot = pad
        ? {
          axes: [...pad.axes],
          buttons: pad.buttons.map((button) => ({ pressed: button.pressed, value: button.value })),
          vibration: typeof (pad as Gamepad & { vibrationActuator?: VibrationActuator }).vibrationActuator?.playEffect === 'function',
        }
        : null;
      const key = JSON.stringify(next);
      if (key === last.current) return;
      last.current = key;
      setSnapshot(next);
    };
    frame = requestAnimationFrame(read);
    return () => cancelAnimationFrame(frame);
  }, [padId]);

  const vibrate = () => {
    const pad = readPads().find((item) => item.id === padId) as (Gamepad & { vibrationActuator?: VibrationActuator }) | undefined;
    void pad?.vibrationActuator?.playEffect?.('dual-rumble', { duration: 500, strongMagnitude: 1, weakMagnitude: 0.6 }).catch(() => undefined);
  };

  const axes = snapshot?.axes ?? [];

  return (
    <SubDialog title={g.testTitle} onClose={onClose} width={440}>
      <Tabs value={0}>
        <Tab value={0}>{g.testTab}</Tab>
      </Tabs>
      <TabBody className="tcp-body">
        <div className="stack">
          <p>{padName(padId)}</p>
          <p className="muted">{snapshot ? g.testHint : g.disconnected}</p>
          <GroupBox label={g.axes}>
            <div className="pad-axes">
              <AxisField x={axes[0] ?? 0} y={axes[1] ?? 0} label={g.leftStick} />
              {axes.length >= 4 ? <AxisField x={axes[2]} y={axes[3]} label={g.rightStick} /> : null}
            </div>
          </GroupBox>
          <GroupBox label={g.buttons}>
            <div className="pad-buttons">
              {(snapshot?.buttons ?? []).map((button, index) => (
                <span
                  key={index}
                  className={button.pressed ? 'pad-button is-pressed' : 'pad-button'}
                  style={{ '--pad-value': button.value } as React.CSSProperties}
                >
                  {index + 1}
                </span>
              ))}
            </div>
          </GroupBox>
          <div className="button-row is-end">
            <Button disabled={!snapshot?.vibration} onClick={vibrate} title={snapshot?.vibration ? undefined : g.noVibration}>
              {g.vibrate}
            </Button>
          </div>
          {snapshot && !snapshot.vibration ? <p className="muted">{g.noVibration}</p> : null}
        </div>
      </TabBody>
      <div className="dialog-footer">
        <Button onClick={onClose} style={{ minWidth: 84 }}>{t.common.ok}</Button>
      </div>
    </SubDialog>
  );
}

function AxisField({ x, y, label }: { x: number; y: number; label: string }) {
  const px = 50 + Math.max(-1, Math.min(1, x)) * 46;
  const py = 50 + Math.max(-1, Math.min(1, y)) * 46;
  return (
    <figure className="pad-axis">
      <Frame variant="field" className="pad-axis-field">
        <svg viewBox="0 0 100 100" width="100" height="100" shapeRendering="crispEdges" aria-hidden>
          <rect width="100" height="100" fill="#fff" />
          <path d="M50 0v100M0 50h100" stroke="#c0c0c0" />
          <path d={`M${px} 0v100M0 ${py}h100`} stroke="#000080" />
          <rect x={px - 3} y={py - 3} width="6" height="6" fill="#ff0000" stroke="#000" />
        </svg>
      </Frame>
      <figcaption>{label}</figcaption>
    </figure>
  );
}
