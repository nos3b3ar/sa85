export type NoteEvent = {
  time: number;
  duration: number;
  frequency: number;
  voice: 'lead' | 'bass';
};

export type Song = {
  events: NoteEvent[];
  duration: number;
};

type Step = [note: string, beats: number];

type Part = {
  bpm: number;
  lead: Step[];
  bass?: Step[];
};

const semitones: Record<string, number> = {
  C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
};

function frequencyOf(note: string) {
  const match = /^([A-G]#?)(\d)$/.exec(note);
  if (!match) return null;
  const midi = (Number(match[2]) + 1) * 12 + semitones[match[1]];
  return 440 * 2 ** ((midi - 69) / 12);
}

function compose(parts: Part[]): Song {
  const events: NoteEvent[] = [];
  let offset = 0;
  for (const part of parts) {
    const beat = 60 / part.bpm;
    let partLength = 0;
    for (const [voice, steps] of [['lead', part.lead], ['bass', part.bass ?? []]] as const) {
      let time = 0;
      for (const [note, beats] of steps) {
        const frequency = frequencyOf(note);
        if (frequency) events.push({ time: offset + time, duration: beats * beat, frequency, voice });
        time += beats * beat;
      }
      partLength = Math.max(partLength, time);
    }
    offset += partLength;
  }
  events.sort((a, b) => a.time - b.time);
  return { events, duration: offset };
}

function eighths(pairs: [string, string][]): Step[] {
  return pairs.flatMap(([low, high]) => [
    [low, 0.5], [high, 0.5], [low, 0.5], [high, 0.5],
    [low, 0.5], [high, 0.5], [low, 0.5], [high, 0.5],
  ] as Step[]);
}

const korobeinikiLead: Step[] = [
  ['E5', 1], ['B4', 0.5], ['C5', 0.5], ['D5', 1], ['C5', 0.5], ['B4', 0.5],
  ['A4', 1], ['A4', 0.5], ['C5', 0.5], ['E5', 1], ['D5', 0.5], ['C5', 0.5],
  ['B4', 1.5], ['C5', 0.5], ['D5', 1], ['E5', 1],
  ['C5', 1], ['A4', 1], ['A4', 1], ['R', 1],
  ['D5', 1.5], ['F5', 0.5], ['A5', 1], ['G5', 0.5], ['F5', 0.5],
  ['E5', 1.5], ['C5', 0.5], ['E5', 1], ['D5', 0.5], ['C5', 0.5],
  ['B4', 1], ['B4', 0.5], ['C5', 0.5], ['D5', 1], ['E5', 1],
  ['C5', 1], ['A4', 1], ['A4', 1], ['R', 1],
];

const korobeinikiBass = eighths([
  ['E2', 'E3'], ['A2', 'A3'], ['G#2', 'G#3'], ['A2', 'A3'],
  ['D2', 'D3'], ['C2', 'C3'], ['E2', 'E3'], ['A2', 'A3'],
]);

const eliseTurn: Step[] = [['E5', 0.5], ['D#5', 0.5], ['E5', 0.5], ['D#5', 0.5], ['E5', 0.5], ['B4', 0.5], ['D5', 0.5], ['C5', 0.5]];
const eliseLead: Step[] = [
  ...eliseTurn,
  ['A4', 1.5], ['C4', 0.5], ['E4', 0.5], ['A4', 0.5],
  ['B4', 1.5], ['E4', 0.5], ['G#4', 0.5], ['B4', 0.5],
  ['C5', 1.5], ['E4', 0.5], ...eliseTurn,
  ['A4', 1.5], ['C4', 0.5], ['E4', 0.5], ['A4', 0.5],
  ['B4', 1.5], ['E4', 0.5], ['C5', 0.5], ['B4', 0.5],
  ['A4', 3],
];
const eliseBass: Step[] = [
  ['R', 4],
  ['A2', 0.5], ['E3', 0.5], ['A3', 0.5], ['R', 1.5],
  ['E2', 0.5], ['E3', 0.5], ['G#3', 0.5], ['R', 1.5],
  ['A2', 0.5], ['E3', 0.5], ['A3', 0.5], ['R', 0.5], ['R', 4],
  ['A2', 0.5], ['E3', 0.5], ['A3', 0.5], ['R', 1.5],
  ['E2', 0.5], ['E3', 0.5], ['G#3', 0.5], ['R', 1.5],
  ['A2', 3],
];

const mountainKingLead: Step[] = [
  ['B3', 0.5], ['C#4', 0.5], ['D4', 0.5], ['E4', 0.5], ['F#4', 0.5], ['D4', 0.5], ['F#4', 1],
  ['F4', 0.5], ['C#4', 0.5], ['F4', 1], ['E4', 0.5], ['C4', 0.5], ['E4', 1],
  ['B3', 0.5], ['C#4', 0.5], ['D4', 0.5], ['E4', 0.5], ['F#4', 0.5], ['D4', 0.5], ['F#4', 0.5], ['B4', 0.5],
  ['A4', 0.5], ['F#4', 0.5], ['D4', 0.5], ['F#4', 0.5], ['A4', 2],
];
const mountainKingBass: Step[] = [
  ['B2', 1], ['F#2', 1], ['B2', 1], ['F#2', 1],
  ['C#3', 1], ['F#2', 1], ['C3', 1], ['E2', 1],
  ['B2', 1], ['F#2', 1], ['B2', 1], ['F#2', 1],
  ['D3', 1], ['F#2', 1], ['A2', 2],
];

export const songs = {
  korobeiniki: compose([
    { bpm: 144, lead: korobeinikiLead, bass: korobeinikiBass },
    { bpm: 144, lead: korobeinikiLead, bass: korobeinikiBass },
  ]),
  elise: compose([
    { bpm: 132, lead: eliseLead, bass: eliseBass },
    { bpm: 132, lead: eliseLead, bass: eliseBass },
  ]),
  mountainKing: compose([100, 125, 155, 190, 230].map((bpm) => ({
    bpm,
    lead: mountainKingLead,
    bass: mountainKingBass,
  }))),
};
