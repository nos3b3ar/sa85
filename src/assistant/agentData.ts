import ClippyLoader from 'clippyjs/agents/clippy';
import MerlinLoader from 'clippyjs/agents/merlin';
import { effectiveVolume, getSettings, type AssistantId } from '../settings/settings';

export type FrameBranch = {
  weight: number;
  frameIndex: number;
};

export type AgentFrame = {
  duration: number;
  images?: [number, number][];
  sound?: string;
  exitBranch?: number;
  branching?: {
    branches: FrameBranch[];
  };
};

export type AgentAnimation = {
  frames: AgentFrame[];
  useExitBranching?: boolean;
};

export type RawAgentSpec = {
  overlayCount: number;
  framesize: [number, number];
  sounds: string[];
  animations: Record<string, AgentAnimation>;
};

export type LoadedAgent = {
  id: AssistantId;
  spec: RawAgentSpec;
  mapUrl: string;
  sounds: Record<string, string>;
};

const cache: Partial<Record<AssistantId, Promise<LoadedAgent>>> = {};
const audioCache = new Map<string, HTMLAudioElement>();

type AgentLoader = {
  agent: () => Promise<{ default: unknown }>;
  map: () => Promise<{ default: string }>;
  sound: () => Promise<{ default: Record<string, string> }>;
};

const loaders: Record<AssistantId, AgentLoader> = {
  clippy: ClippyLoader as unknown as AgentLoader,
  merlin: MerlinLoader as unknown as AgentLoader,
};

export function loadAgentData(id: AssistantId): Promise<LoadedAgent> {
  cache[id] ??= Promise.all([
    loaders[id].agent(),
    loaders[id].map(),
    loaders[id].sound(),
  ]).then(([agentMod, mapMod, soundMod]) => ({
    id,
    spec: agentMod.default as unknown as RawAgentSpec,
    mapUrl: (mapMod as { default: string }).default,
    sounds: (soundMod as { default: Record<string, string> }).default ?? {},
  }));
  return cache[id]!;
}

export function playAgentSound(id: AssistantId, soundKey: string, sounds: Record<string, string>, muted = false) {
  if (muted) return;
  const settings = getSettings();
  if (!settings.assistantSounds) return;
  const vol = effectiveVolume() * 0.7;
  if (vol <= 0) return;
  const uri = sounds[soundKey];
  if (!uri) return;
  const cacheKey = `${id}:${soundKey}`;
  let audio = audioCache.get(cacheKey);
  if (!audio) {
    audio = new Audio(uri);
    audioCache.set(cacheKey, audio);
  }
  audio.volume = Math.min(1, vol);
  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
}
