import type { Song } from './songs';

export type Track =
  | { id: string; title: string; artist: string; kind: 'synth'; song: Song }
  | { id: string; title: string; artist: string; kind: 'file'; src: string };

export const eqBands = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

export type EqSettings = {
  enabled: boolean;
  preamp: number;
  bands: number[];
};

type FileNode = { element: HTMLAudioElement; source: MediaElementAudioSourceNode };

export class WinampEngine {
  readonly analyser: AnalyserNode;
  private readonly input: GainNode;
  private readonly filters: BiquadFilterNode[];
  private readonly master: GainNode;
  private readonly panner: StereoPannerNode;
  private synth: { gain: GainNode; oscillators: OscillatorNode[]; startedAt: number; offset: number } | null = null;
  private file: FileNode | null = null;
  private readonly files = new Map<string, FileNode>();
  private endTimer = 0;
  private current: Track | null = null;
  private pausedAt = 0;

  constructor(private readonly ctx: AudioContext, private readonly onEnded: () => void) {
    this.input = ctx.createGain();
    this.filters = eqBands.map((frequency, index) => {
      const filter = ctx.createBiquadFilter();
      filter.type = index === 0 ? 'lowshelf' : index === eqBands.length - 1 ? 'highshelf' : 'peaking';
      filter.frequency.value = frequency;
      filter.Q.value = 1.4;
      filter.gain.value = 0;
      return filter;
    });
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.6;
    this.master = ctx.createGain();
    this.panner = ctx.createStereoPanner();

    let node: AudioNode = this.input;
    for (const filter of this.filters) {
      node.connect(filter);
      node = filter;
    }
    node.connect(this.analyser);
    this.analyser.connect(this.master);
    this.master.connect(this.panner);
    this.panner.connect(ctx.destination);
  }

  setVolume(volume: number) {
    this.master.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.02);
  }

  setBalance(balance: number) {
    this.panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, balance)), this.ctx.currentTime, 0.02);
  }

  setEq({ enabled, preamp, bands }: EqSettings) {
    const now = this.ctx.currentTime;
    const preampGain = enabled ? 10 ** (preamp / 20) : 1;
    this.input.gain.setTargetAtTime(preampGain, now, 0.02);
    this.filters.forEach((filter, index) => {
      filter.gain.setTargetAtTime(enabled ? bands[index] ?? 0 : 0, now, 0.02);
    });
  }

  play(track: Track, offset = 0) {
    this.halt();
    void this.ctx.resume();
    this.current = track;
    if (track.kind === 'synth') this.startSynth(track.song, offset);
    else this.startFile(track.src, offset);
  }

  pause() {
    this.pausedAt = this.position();
    this.halt();
  }

  resume() {
    if (this.current) this.play(this.current, this.pausedAt);
  }

  stop() {
    this.halt();
    this.pausedAt = 0;
  }

  position() {
    if (this.synth) return Math.max(0, this.ctx.currentTime - this.synth.startedAt + this.synth.offset);
    if (this.file) return this.file.element.currentTime;
    return this.pausedAt;
  }

  forget(src: string) {
    const node = this.files.get(src);
    if (!node) return;
    if (this.file === node) this.halt();
    node.source.disconnect();
    this.files.delete(src);
  }

  dispose() {
    this.halt();
    this.files.forEach((node) => node.source.disconnect());
    this.files.clear();
    this.panner.disconnect();
  }

  private halt() {
    window.clearTimeout(this.endTimer);
    if (this.synth) {
      const { gain, oscillators } = this.synth;
      gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01);
      oscillators.forEach((oscillator) => {
        try {
          oscillator.stop(this.ctx.currentTime + 0.05);
        } catch {
          // bereits gestoppt
        }
      });
      window.setTimeout(() => gain.disconnect(), 120);
      this.synth = null;
    }
    if (this.file) {
      this.file.element.pause();
      this.file.element.onended = null;
      this.file = null;
    }
  }

  private startSynth(song: Song, offset: number) {
    const gain = this.ctx.createGain();
    gain.connect(this.input);
    const startedAt = this.ctx.currentTime + 0.05;
    const oscillators: OscillatorNode[] = [];
    for (const event of song.events) {
      if (event.time < offset) continue;
      const start = startedAt + event.time - offset;
      const length = Math.max(0.04, event.duration * 0.9);
      const oscillator = this.ctx.createOscillator();
      const envelope = this.ctx.createGain();
      const peak = event.voice === 'lead' ? 0.13 : 0.2;
      oscillator.type = event.voice === 'lead' ? 'square' : 'triangle';
      oscillator.frequency.value = event.frequency;
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(peak, start + 0.008);
      envelope.gain.setValueAtTime(peak, start + length * 0.7);
      envelope.gain.linearRampToValueAtTime(0, start + length);
      oscillator.connect(envelope);
      envelope.connect(gain);
      oscillator.start(start);
      oscillator.stop(start + length + 0.02);
      oscillators.push(oscillator);
    }
    this.synth = { gain, oscillators, startedAt, offset };
    this.endTimer = window.setTimeout(() => this.finish(), (song.duration - offset) * 1000 + 300);
  }

  private startFile(src: string, offset: number) {
    let node = this.files.get(src);
    if (!node) {
      const element = new Audio(src);
      element.preload = 'auto';
      const source = this.ctx.createMediaElementSource(element);
      source.connect(this.input);
      node = { element, source };
      this.files.set(src, node);
    }
    node.element.currentTime = offset;
    node.element.onended = () => this.finish();
    void node.element.play().catch(() => undefined);
    this.file = node;
  }

  private finish() {
    this.halt();
    this.pausedAt = 0;
    this.onEnded();
  }
}
