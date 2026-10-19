import { effectiveVolume, onSettingsChange } from '../settings/settings';

let audioContext: AudioContext | null = null;

type StartupTrack = 'win95' | 'win98';

const tracks: Partial<Record<StartupTrack, HTMLAudioElement>> = {};
const startupBuffers: Partial<Record<StartupTrack, Promise<AudioBuffer | null>>> = {};
let startupVoice: { source: AudioBufferSourceNode; gain: GainNode } | null = null;

function context(): AudioContext | null {
  const AudioCtx = window.AudioContext
    ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioContext) audioContext = new AudioCtx();
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

function tone(frequency: number, duration: number, baseVolume: number) {
  const volume = baseVolume * effectiveVolume();
  if (volume <= 0) return;
  const ctx = context();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

export function getAudioContext() {
  return context();
}

export function unlockAudio() {
  context();
  void loadFanBuffer();
  void loadStartupBuffer('win98');
}

function loadStartupBuffer(which: StartupTrack) {
  const ctx = context();
  if (!ctx) return Promise.resolve(null);
  startupBuffers[which] ??= fetch(`/sounds/${which}.mp3`)
    .then((response) => response.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .catch(() => null);
  return startupBuffers[which];
}

function preloadedAudio(src: string) {
  const audio = new Audio(src);
  audio.preload = 'auto';
  return audio;
}

const powerButtonSound = preloadedAudio('/sounds/power-knopf.mp3');
const biosStartupSound = preloadedAudio('/sounds/bios-startup.mp3');
const fanSrc = '/sounds/rechner-leerlauf.mp3';
const keyPressSrc = '/sounds/tastendruck.mp3';
preloadedAudio(keyPressSrc);

const powerButtonMs = 1000;
const fanStartMs = 9000;
const fanFadeMs = 400;

let bootTimers: number[] = [];
let fanBuffer: Promise<AudioBuffer | null> | null = null;
let fanWanted = false;
let fan: { source: AudioBufferSourceNode; gain: GainNode } | null = null;

function playFromStart(audio: HTMLAudioElement) {
  audio.volume = effectiveVolume();
  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
}

function halt(audio: HTMLAudioElement) {
  audio.pause();
  audio.currentTime = 0;
}

function clearBootTimers() {
  bootTimers.forEach((timer) => window.clearTimeout(timer));
  bootTimers = [];
}

function loadFanBuffer() {
  const ctx = context();
  if (!ctx) return Promise.resolve(null);
  fanBuffer ??= fetch(fanSrc)
    .then((response) => response.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => trimSilence(ctx, buffer))
    .catch(() => null);
  return fanBuffer;
}

// MP3-Encoder hängen Stille an Anfang und Ende an; ohne Trimmen klickt der Loop an der Naht.
function trimSilence(ctx: AudioContext, buffer: AudioBuffer) {
  const threshold = 0.002;
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
  const audible = (index: number) => channels.some((data) => Math.abs(data[index]) > threshold);
  let start = 0;
  let end = buffer.length - 1;
  while (start < end && !audible(start)) start += 1;
  while (end > start && !audible(end)) end -= 1;
  const length = end - start + 1;
  if (length <= 0 || length === buffer.length) return buffer;
  const trimmed = ctx.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);
  channels.forEach((data, index) => trimmed.copyToChannel(data.subarray(start, end + 1), index));
  return trimmed;
}

async function startFan() {
  fanWanted = true;
  if (fan) return;
  const ctx = context();
  const buffer = await loadFanBuffer();
  if (!ctx || !buffer || !fanWanted || fan) return;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gain = ctx.createGain();
  gain.gain.value = effectiveVolume();
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  fan = { source, gain };
}

function stopFan(fadeMs = 0) {
  fanWanted = false;
  if (!fan || !audioContext) return;
  const { source, gain } = fan;
  fan = null;
  const now = audioContext.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + fadeMs / 1000);
  source.stop(now + fadeMs / 1000 + 0.05);
}

export function startBootSounds({ withPowerButton }: { withPowerButton: boolean }) {
  stopBootSounds();
  const startBios = () => {
    playFromStart(biosStartupSound);
    bootTimers.push(window.setTimeout(() => void startFan(), fanStartMs));
  };
  if (withPowerButton) {
    playFromStart(powerButtonSound);
    bootTimers.push(window.setTimeout(startBios, powerButtonMs));
  } else {
    startBios();
  }
}

export function enterBiosSetupSounds() {
  clearBootTimers();
  halt(biosStartupSound);
  void startFan();
}

export function fadeOutFan() {
  clearBootTimers();
  stopFan(fanFadeMs);
}

export function stopBootSounds() {
  clearBootTimers();
  halt(powerButtonSound);
  halt(biosStartupSound);
  stopFan();
}

export function playKeyPress() {
  const audio = new Audio(keyPressSrc);
  audio.volume = effectiveVolume();
  void audio.play().catch(() => undefined);
}

// iOS blockiert audio.play() außerhalb einer Nutzergeste; der beim Einschalten entsperrte AudioContext darf weiterspielen.
export async function playStartupSound(which: StartupTrack = 'win98') {
  const ctx = context();
  const buffer = await loadStartupBuffer(which);
  if (ctx && buffer) {
    startupVoice?.source.stop();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = startupVolume();
    source.connect(gain);
    gain.connect(ctx.destination);
    const voice = { source, gain };
    source.onended = () => {
      if (startupVoice === voice) startupVoice = null;
    };
    startupVoice = voice;
    source.start();
    return;
  }
  const audio = tracks[which] ?? new Audio(`/sounds/${which}.mp3`);
  tracks[which] = audio;
  audio.volume = startupVolume();
  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
}

export function playDing() {
  tone(880, 0.09, 0.05);
}

function startupVolume() {
  return Math.min(1, 0.85 * effectiveVolume());
}

onSettingsChange(() => {
  [powerButtonSound, biosStartupSound].forEach((audio) => {
    if (!audio.paused) audio.volume = effectiveVolume();
  });
  if (fan) fan.gain.gain.value = effectiveVolume();
  if (startupVoice) startupVoice.gain.gain.value = startupVolume();
  Object.values(tracks).forEach((audio) => {
    if (audio && !audio.paused) audio.volume = startupVolume();
  });
});
