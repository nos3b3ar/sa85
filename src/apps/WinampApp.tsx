import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { getAudioContext } from '../audio/audio';
import { effectiveVolume, onSettingsChange } from '../settings/settings';
import { SegmentDisplay } from './shared/SegmentDisplay';
import type { AppProps, WindowChrome } from './types';
import { WinampIcon } from './WinampIcon';
import { eqBands, WinampEngine, type EqSettings, type Track } from './winamp/engine';
import { SkinSlider } from './winamp/SkinSlider';
import { songs } from './winamp/songs';

const initialTracks: Track[] = [
  { id: 'korobeiniki', title: 'Korobeiniki (8-Bit Mix)', artist: 'Traditional', kind: 'synth', song: songs.korobeiniki },
  { id: 'elise', title: 'Für Elise (Chiptune)', artist: 'Ludwig van Beethoven', kind: 'synth', song: songs.elise },
  { id: 'mountain-king', title: 'In der Halle des Bergkönigs', artist: 'Edvard Grieg', kind: 'synth', song: songs.mountainKing },
  { id: 'win98', title: 'Windows 98 Start', artist: 'Microsoft', kind: 'file', src: '/sounds/win98.mp3' },
  { id: 'win95', title: 'Windows 95 Start', artist: 'Brian Eno', kind: 'file', src: '/sounds/win95.mp3' },
];

const presets: Array<{ name: string; preamp: number; bands: number[] }> = [
  { name: 'Flat', preamp: 0, bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Rock', preamp: 0, bands: [5, 3, -3, -5, -2, 2, 5, 6, 6, 6] },
  { name: 'Pop', preamp: 0, bands: [-1, 3, 5, 5, 3, -1, -2, -2, -1, -1] },
  { name: 'Techno', preamp: 0, bands: [5, 4, 0, -4, -3, 0, 5, 6, 6, 5] },
  { name: 'Klassik', preamp: 0, bands: [0, 0, 0, 0, 0, 0, -4, -4, -4, -6] },
  { name: 'Full Bass', preamp: -3, bands: [7, 6, 5, 2, 0, -2, -3, -4, -4, -4] },
  { name: 'Full Treble', preamp: -3, bands: [-6, -6, -6, -2, 1, 6, 9, 9, 9, 10] },
];

const bandLabels = ['60', '170', '310', '600', '1K', '3K', '6K', '12K', '14K', '16K'];
const visBars = 19;
const visRows = 16;
const visColors = Array.from({ length: visRows }, (_, row) => `hsl(${Math.round((row / (visRows - 1)) * 115)}, 95%, 48%)`);

type Status = 'stopped' | 'playing' | 'paused';

export function WinampApp({ chrome, onClose }: AppProps) {
  const engineRef = useRef<WinampEngine | null>(null);
  const visRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState<Status>('stopped');
  const [position, setPosition] = useState(0);
  const [seekDrag, setSeekDrag] = useState<number | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [balance, setBalance] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [remaining, setRemaining] = useState(false);
  const [eqOpen, setEqOpen] = useState(true);
  const [plOpen, setPlOpen] = useState(true);
  const [autoEq, setAutoEq] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [eq, setEq] = useState<EqSettings>({ enabled: true, preamp: 0, bands: eqBands.map(() => 0) });
  const [durations, setDurations] = useState<Record<string, number>>(() => Object.fromEntries(
    initialTracks.flatMap((track) => (track.kind === 'synth' ? [[track.id, track.song.duration]] : [])),
  ));
  const scale = useScale();
  const innerRef = useRef<HTMLDivElement>(null);
  const innerHeight = useNaturalHeight(innerRef);

  const latest = useRef({ tracks, index, shuffle, repeat, volume, eq, balance });
  latest.current = { tracks, index, shuffle, repeat, volume, eq, balance };

  const track = tracks[index] ?? tracks[0];
  const duration = track ? durations[track.id] ?? 0 : 0;
  const shown = status === 'stopped' ? 0 : seekDrag ?? position;

  useEffect(() => {
    tracks.forEach((item) => {
      if (item.kind !== 'file' || durations[item.id] !== undefined) return;
      const probe = new Audio(item.src);
      probe.preload = 'metadata';
      probe.onloadedmetadata = () => setDurations((prev) => ({ ...prev, [item.id]: probe.duration }));
    });
  }, [tracks, durations]);

  useEffect(() => () => {
    engineRef.current?.dispose();
    engineRef.current = null;
    latest.current.tracks.forEach((item) => {
      if (item.kind === 'file' && item.src.startsWith('blob:')) URL.revokeObjectURL(item.src);
    });
  }, []);

  useEffect(() => {
    engineRef.current?.setVolume(volume * effectiveVolume());
  }, [volume]);

  useEffect(() => {
    engineRef.current?.setBalance(balance);
  }, [balance]);

  useEffect(() => {
    engineRef.current?.setEq(eq);
  }, [eq]);

  useEffect(() => {
    const unsubscribe = onSettingsChange(() => {
      engineRef.current?.setVolume(latest.current.volume * effectiveVolume());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const bins = new Uint8Array(32);
    const peaks = new Float32Array(visBars);
    const draw = () => {
      const engine = engineRef.current;
      if (engine) setPosition(Math.round(engine.position() * 10) / 10);
      const canvas = visRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (engine) engine.analyser.getByteFrequencyData(bins);
        else bins.fill(0);
        for (let bar = 0; bar < visBars; bar += 1) {
          const level = bins[Math.min(bins.length - 1, bar + 1)] / 255;
          const height = Math.round(level * visRows);
          peaks[bar] = Math.max(height, peaks[bar] - 0.25);
          for (let y = 0; y < height; y += 1) {
            ctx.fillStyle = visColors[visRows - 1 - y];
            ctx.fillRect(bar * 4, visRows - 1 - y, 3, 1);
          }
          if (peaks[bar] >= 1) {
            ctx.fillStyle = '#c8c8c8';
            ctx.fillRect(bar * 4, visRows - Math.ceil(peaks[bar]), 3, 1);
          }
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const canvas = graphRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#4a4a5c';
    ctx.fillRect(0, Math.round(height / 2), width, 1);
    const points = eq.bands.map((gain, band) => ({
      x: 2 + (band / (eq.bands.length - 1)) * (width - 4),
      y: height / 2 - (gain / 12) * (height / 2 - 2),
    }));
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#ff3b1f');
    gradient.addColorStop(0.5, '#f5d300');
    gradient.addColorStop(1, '#18d818');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      const mid = (points[i - 1].x + points[i].x) / 2;
      ctx.bezierCurveTo(mid, points[i - 1].y, mid, points[i].y, points[i].x, points[i].y);
    }
    ctx.stroke();
  }, [eq.bands, eqOpen]);

  const engine = () => {
    if (engineRef.current) return engineRef.current;
    const ctx = getAudioContext();
    if (!ctx) return null;
    const created = new WinampEngine(ctx, () => {
      const { tracks: list, index: current, shuffle: random, repeat: loop } = latest.current;
      let next: number | null = current + 1 < list.length ? current + 1 : loop ? 0 : null;
      if (random && list.length > 1) {
        do next = Math.floor(Math.random() * list.length);
        while (next === current);
      }
      if (next === null) {
        setStatus('stopped');
        setPosition(0);
        return;
      }
      setIndex(next);
      setSelected(next);
      created.play(list[next]);
      setStatus('playing');
    });
    created.setVolume(latest.current.volume * effectiveVolume());
    created.setBalance(latest.current.balance);
    created.setEq(latest.current.eq);
    engineRef.current = created;
    return created;
  };

  const playIndex = (next: number) => {
    const player = engine();
    const item = tracks[next];
    if (!player || !item) return;
    setIndex(next);
    setSelected(next);
    player.play(item);
    setStatus('playing');
  };

  const play = () => {
    const player = engine();
    if (!player || !tracks.length) return;
    if (status === 'paused' && selected === index) {
      player.resume();
      setStatus('playing');
    } else playIndex(selected);
  };

  const pause = () => {
    const player = engineRef.current;
    if (!player) return;
    if (status === 'playing') {
      player.pause();
      setStatus('paused');
    } else if (status === 'paused') {
      player.resume();
      setStatus('playing');
    }
  };

  const stop = () => {
    engineRef.current?.stop();
    setStatus('stopped');
    setPosition(0);
  };

  const step = (direction: 1 | -1) => {
    if (!tracks.length) return;
    const next = (index + direction + tracks.length) % tracks.length;
    if (status === 'playing') playIndex(next);
    else {
      engineRef.current?.stop();
      setStatus('stopped');
      setIndex(next);
      setSelected(next);
    }
  };

  const seek = (value: number) => {
    setSeekDrag(null);
    const player = engineRef.current;
    if (!player || status === 'stopped' || !track) return;
    player.play(track, value);
    if (status === 'paused') player.pause();
  };

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const added: Track[] = [...files].map((file, offset) => {
      const name = file.name.replace(/\.[^.]+$/, '');
      const [artist, ...rest] = name.split(' - ');
      return {
        id: `file-${Date.now()}-${offset}`,
        kind: 'file',
        src: URL.createObjectURL(file),
        artist: rest.length ? artist : 'Unbekannt',
        title: rest.length ? rest.join(' - ') : name,
      };
    });
    setTracks((prev) => [...prev, ...added]);
  };

  const removeSelected = () => {
    const victim = tracks[selected];
    if (!victim) return;
    if (selected === index) stop();
    if (victim.kind === 'file' && victim.src.startsWith('blob:')) {
      engineRef.current?.forget(victim.src);
      URL.revokeObjectURL(victim.src);
    }
    const nextTracks = tracks.filter((_, itemIndex) => itemIndex !== selected);
    setTracks(nextTracks);
    if (index > selected) setIndex(index - 1);
    else if (index >= nextTracks.length) setIndex(Math.max(0, nextTracks.length - 1));
    setSelected(Math.min(selected, Math.max(0, nextTracks.length - 1)));
  };

  const applyPreset = (preset: (typeof presets)[number]) => {
    setEq((prev) => ({ ...prev, preamp: preset.preamp, bands: [...preset.bands] }));
    setPresetsOpen(false);
  };

  const setBand = (band: number, gain: number) => {
    setEq((prev) => ({ ...prev, bands: prev.bands.map((value, i) => (i === band ? snapGain(gain) : value)) }));
  };

  const timeValue = remaining ? Math.max(0, duration - shown) : shown;
  const minutes = String(Math.min(99, Math.floor(timeValue / 60))).padStart(2, '0');
  const seconds = String(Math.floor(timeValue % 60)).padStart(2, '0');
  const marquee = track ? `${index + 1}. ${track.artist} - ${track.title} (${formatShort(duration)})` : 'Winamp 2.91';
  const totalLength = tracks.reduce((sum, item) => sum + (durations[item.id] ?? 0), 0);
  const titleActive = chrome?.active ?? true;
  const mono = track?.kind === 'synth';

  return (
    <div className="wa-scale" style={{ width: 275 * scale, height: innerHeight * scale }}>
      <div className="wa" ref={innerRef} style={{ transform: `scale(${scale})` }}>
        <section className="wa-window wa-main">
          <TitleBar title="WINAMP" active={titleActive} chrome={chrome}>
            <button type="button" className="wa-title-btn" aria-label="Minimieren" onClick={chrome?.onMinimize}>
              <span className="wa-glyph-min" />
            </button>
            <button type="button" className="wa-title-btn" aria-label="Schließen" onClick={chrome?.onClose ?? onClose}>
              <span className="wa-glyph-close" />
            </button>
          </TitleBar>
          <div className="wa-body">
            <div className="wa-lcd">
              <div className="wa-clutter" aria-hidden="true">
                {['O', 'A', 'I', 'D', 'V'].map((letter) => <span key={letter}>{letter}</span>)}
              </div>
              <div className="wa-lcd-main">
                <div className="wa-lcd-top">
                  <span className={`wa-state is-${status}`} aria-label={statusLabel(status)} />
                  <button
                    type="button"
                    className="wa-time"
                    title="Zwischen verstrichener und verbleibender Zeit umschalten"
                    onClick={() => setRemaining((value) => !value)}
                  >
                    <SegmentDisplay className="wa-time-sign" value={remaining && status !== 'stopped' ? '-' : ' '} on="#00e000" off="transparent" />
                    <SegmentDisplay className="wa-time-digits" value={status === 'stopped' ? '  ' : minutes} on="#00e000" off="#0b2a0b" label="Minuten" />
                    <span className="wa-time-colon" />
                    <SegmentDisplay className="wa-time-digits" value={status === 'stopped' ? '  ' : seconds} on="#00e000" off="#0b2a0b" label="Sekunden" />
                  </button>
                </div>
                <canvas ref={visRef} className="wa-vis" width={visBars * 4 - 1} height={visRows} />
              </div>
            </div>
            <div className="wa-info">
              <div className="wa-marquee" title={marquee}>
                <span key={`${track?.id}-${marquee}`}>{`${marquee}  ***  ${marquee}  ***  `}</span>
              </div>
              <div className="wa-meta">
                <span className="wa-box">{status === 'stopped' ? '' : mono ? '64' : '128'}</span>
                <span className="wa-unit">kbps</span>
                <span className="wa-box is-small">{status === 'stopped' ? '' : '44'}</span>
                <span className="wa-unit">kHz</span>
                <span className={`wa-channel ${status !== 'stopped' && mono ? 'is-lit' : ''}`}>mono</span>
                <span className={`wa-channel ${status !== 'stopped' && !mono ? 'is-lit' : ''}`}>stereo</span>
              </div>
              <div className="wa-sliders">
                <SkinSlider
                  className="wa-volume"
                  label="Lautstärke"
                  min={0}
                  max={1}
                  value={volume}
                  onChange={setVolume}
                  style={{ '--hue': Math.round(120 - volume * 120) } as React.CSSProperties}
                />
                <SkinSlider
                  className="wa-balance"
                  label="Balance"
                  min={-1}
                  max={1}
                  value={balance}
                  onChange={(value) => setBalance(Math.abs(value) < 0.08 ? 0 : value)}
                />
                <ToggleButton label="EQ" title="Equalizer" active={eqOpen} onClick={() => setEqOpen((open) => !open)} />
                <ToggleButton label="PL" title="Playlist" active={plOpen} onClick={() => setPlOpen((open) => !open)} />
              </div>
            </div>
          </div>
          <SkinSlider
            className="wa-seek"
            label="Position"
            min={0}
            max={Math.max(1, duration)}
            value={status === 'stopped' ? 0 : Math.min(shown, Math.max(1, duration))}
            disabled={status === 'stopped'}
            onChange={setSeekDrag}
            onRelease={seek}
          />
          <div className="wa-transport">
            <div className="wa-cbuttons">
              <TransportButton label="Zurück" onClick={() => step(-1)}><PrevGlyph /></TransportButton>
              <TransportButton label="Abspielen" onClick={play}><PlayGlyph /></TransportButton>
              <TransportButton label="Pause" onClick={pause}><PauseGlyph /></TransportButton>
              <TransportButton label="Stopp" onClick={stop}><StopGlyph /></TransportButton>
              <TransportButton label="Weiter" onClick={() => step(1)}><NextGlyph /></TransportButton>
            </div>
            <button type="button" className="wa-eject" aria-label="Datei öffnen" title="Datei öffnen" onClick={() => fileInput.current?.click()}>
              <EjectGlyph />
            </button>
            <ToggleButton label="SHUFFLE" title="Zufallswiedergabe" active={shuffle} wide onClick={() => setShuffle((on) => !on)} />
            <ToggleButton label={<RepeatGlyph />} title="Wiederholen" active={repeat} onClick={() => setRepeat((on) => !on)} />
            <span className="wa-logo" title="Nullsoft Winamp">
              <WinampIcon variant="16x16_4" />
            </span>
          </div>
        </section>

        {eqOpen ? (
          <section className="wa-window wa-eq">
            <TitleBar title="WINAMP EQUALIZER" active={titleActive} chrome={chrome}>
              <button type="button" className="wa-title-btn" aria-label="Equalizer schließen" onClick={() => setEqOpen(false)}>
                <span className="wa-glyph-close" />
              </button>
            </TitleBar>
            <div className="wa-eq-top">
              <ToggleButton label="ON" title="Equalizer ein/aus" active={eq.enabled} onClick={() => setEq((prev) => ({ ...prev, enabled: !prev.enabled }))} />
              <ToggleButton label="AUTO" title="Automatische Presets" active={autoEq} onClick={() => setAutoEq((on) => !on)} />
              <canvas ref={graphRef} className="wa-eq-graph" width={113} height={19} />
              <div className="wa-presets-root">
                <button type="button" className="wa-text-btn" onClick={() => setPresetsOpen((open) => !open)}>PRESETS</button>
                {presetsOpen ? (
                  <div className="wa-presets" role="menu">
                    {presets.map((preset) => (
                      <button key={preset.name} type="button" role="menuitem" onClick={() => applyPreset(preset)}>
                        {preset.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="wa-eq-sliders">
              <div className="wa-eq-band is-preamp">
                <EqSlider label="Preamp" value={eq.preamp} onChange={(value) => setEq((prev) => ({ ...prev, preamp: snapGain(value) }))} />
                <span>PREAMP</span>
              </div>
              <div className="wa-eq-scale" aria-hidden="true">
                <span>+12db</span>
                <span>+0db</span>
                <span>-12db</span>
              </div>
              {eq.bands.map((gain, band) => (
                <div key={eqBands[band]} className="wa-eq-band">
                  <EqSlider label={`${bandLabels[band]} Hz`} value={gain} onChange={(value) => setBand(band, value)} />
                  <span>{bandLabels[band]}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {plOpen ? (
          <section className="wa-window wa-pl">
            <TitleBar title="WINAMP PLAYLIST" active={titleActive} chrome={chrome}>
              <button type="button" className="wa-title-btn" aria-label="Playlist schließen" onClick={() => setPlOpen(false)}>
                <span className="wa-glyph-close" />
              </button>
            </TitleBar>
            <div className="wa-pl-list" role="listbox" aria-label="Playlist">
              {tracks.map((item, itemIndex) => (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={itemIndex === selected}
                  className={[
                    'wa-pl-track',
                    itemIndex === selected ? 'is-selected' : '',
                    itemIndex === index ? 'is-current' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelected(itemIndex)}
                  onDoubleClick={() => playIndex(itemIndex)}
                >
                  <span>{itemIndex + 1}. {item.artist} - {item.title}</span>
                  <span>{formatShort(durations[item.id] ?? 0)}</span>
                </div>
              ))}
            </div>
            <div className="wa-pl-bottom">
              <div className="wa-pl-buttons">
                <button type="button" className="wa-text-btn" title="Dateien hinzufügen" onClick={() => fileInput.current?.click()}>ADD</button>
                <button type="button" className="wa-text-btn" title="Ausgewählten Titel entfernen" onClick={removeSelected}>REM</button>
                <button type="button" className="wa-text-btn" title="Auswahl">SEL</button>
                <button type="button" className="wa-text-btn" title="Verschiedenes">MISC</button>
              </div>
              <div className="wa-pl-mini">
                <span className="wa-pl-total">{formatShort(shown)}/{formatShort(totalLength)}</span>
                <div className="wa-pl-mini-row">
                  <span className="wa-pl-mini-controls">
                    <button type="button" aria-label="Zurück" onClick={() => step(-1)}><PrevGlyph /></button>
                    <button type="button" aria-label="Abspielen" onClick={play}><PlayGlyph /></button>
                    <button type="button" aria-label="Pause" onClick={pause}><PauseGlyph /></button>
                    <button type="button" aria-label="Stopp" onClick={stop}><StopGlyph /></button>
                    <button type="button" aria-label="Weiter" onClick={() => step(1)}><NextGlyph /></button>
                  </span>
                  <span className="wa-pl-time">
                    {status === 'stopped' ? '' : `${remaining ? '-' : ''}${formatShort(timeValue)}`}
                  </span>
                </div>
              </div>
              <button type="button" className="wa-text-btn wa-list-opts" title="Listenoptionen">LIST<br />OPTS</button>
            </div>
          </section>
        ) : null}

        <input
          ref={fileInput}
          type="file"
          accept="audio/*"
          multiple
          hidden
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

function TitleBar({ title, active, chrome, children }: {
  title: string;
  active: boolean;
  chrome?: WindowChrome;
  children: ReactNode;
}) {
  return (
    <div className={active ? 'wa-titlebar is-active' : 'wa-titlebar'} {...chrome?.dragHandlers}>
      <span className="wa-title-icon" aria-hidden="true" />
      <span className="wa-title-stripes" />
      <span className="wa-title-text">{title}</span>
      <span className="wa-title-stripes" />
      <span className="wa-title-buttons">{children}</span>
    </div>
  );
}

function EqSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <SkinSlider
      className="wa-eq-slider"
      label={label}
      vertical
      min={-12}
      max={12}
      step={1}
      value={value}
      onChange={onChange}
      style={{ '--hue': Math.round(60 - value * 5) } as React.CSSProperties}
    />
  );
}

function ToggleButton({ label, title, active, wide = false, onClick }: {
  label: ReactNode;
  title: string;
  active: boolean;
  wide?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={['wa-toggle', active ? 'is-on' : '', wide ? 'is-wide' : ''].filter(Boolean).join(' ')}
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="wa-led" />
      <span>{label}</span>
    </button>
  );
}

function TransportButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="wa-cbutton" title={label} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

function PrevGlyph() {
  return (
    <svg viewBox="0 0 10 8" className="wa-glyph" aria-hidden="true">
      <rect x="0" y="0" width="2" height="8" />
      <polygon points="2,4 6,0 6,8" />
      <polygon points="6,4 10,0 10,8" />
    </svg>
  );
}

function NextGlyph() {
  return (
    <svg viewBox="0 0 10 8" className="wa-glyph" aria-hidden="true">
      <polygon points="0,0 4,4 0,8" />
      <polygon points="4,0 8,4 4,8" />
      <rect x="8" y="0" width="2" height="8" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 10 8" className="wa-glyph" aria-hidden="true">
      <polygon points="2,0 8,4 2,8" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg viewBox="0 0 10 8" className="wa-glyph" aria-hidden="true">
      <rect x="2" y="0" width="2" height="8" />
      <rect x="6" y="0" width="2" height="8" />
    </svg>
  );
}

function StopGlyph() {
  return (
    <svg viewBox="0 0 10 8" className="wa-glyph" aria-hidden="true">
      <rect x="1" y="0" width="8" height="8" />
    </svg>
  );
}

function EjectGlyph() {
  return (
    <svg viewBox="0 0 10 8" className="wa-glyph" aria-hidden="true">
      <polygon points="5,0 10,5 0,5" />
      <rect x="0" y="6" width="10" height="2" />
    </svg>
  );
}

function RepeatGlyph() {
  return (
    <svg viewBox="0 0 12 8" className="wa-glyph" aria-hidden="true">
      <path d="M2 4V2h7V0l3 2.5L9 5V3.5H3.5V4z M10 4v2H3v2L0 5.5 3 3v1.5h5.5V4z" />
    </svg>
  );
}

function useScale() {
  const compute = () => Math.max(1, Math.min(1.5, (window.innerWidth - 8) / 275));
  const [scale, setScale] = useState(compute);
  useEffect(() => {
    const onResize = () => setScale(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
}

function useNaturalHeight(ref: React.RefObject<HTMLElement>) {
  const [height, setHeight] = useState(116);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setHeight(element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return height;
}

function snapGain(value: number) {
  return Math.round(value);
}

function formatShort(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function statusLabel(status: Status) {
  return status === 'playing' ? 'Wiedergabe' : status === 'paused' ? 'Pause' : 'Gestoppt';
}
