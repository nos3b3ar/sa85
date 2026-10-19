import type { Track } from './engine';

// Apple erlaubt die Vorschauen nur gestreamt von den eigenen Servern; die URLs ändern sich gelegentlich.
const trackIds = [
  1731434189, // Haddaway – What Is Love (7" Mix)
  40620610, // Marky Mark & Prince Ital Joe – United (Radio Edit)
  1614485758, // Dr. Alban – It's My Life
  283567164, // Backstreet Boys – I Want It That Way
  268284600, // Britney Spears – ...Baby One More Time
  286006524, // *NSYNC – Tearin' Up My Heart (Radio Edit)
  1440840510, // blink-182 – All the Small Things
  260655284, // Bomfunk MC's – Freestyler
  1443279963, // Echt – Wo Bist Du Jetzt?
  1570271008, // Mark Morrison – Return of the Mack (C&J Radio Edit)
];

type LookupResult = {
  trackId: number;
  artistName: string;
  trackName: string;
  previewUrl?: string;
  trackViewUrl?: string;
};

export async function fetchPreviews(signal?: AbortSignal): Promise<Track[]> {
  const response = await fetch(`https://itunes.apple.com/lookup?id=${trackIds.join(',')}&country=DE&entity=song`, { signal });
  if (!response.ok) return [];
  const { results } = (await response.json()) as { results: LookupResult[] };
  const byId = new Map(results.map((result) => [result.trackId, result]));
  return trackIds.flatMap((id) => {
    const result = byId.get(id);
    if (!result?.previewUrl) return [];
    return [{
      id: `apple-${id}`,
      kind: 'file' as const,
      src: result.previewUrl,
      link: result.trackViewUrl,
      artist: result.artistName,
      title: result.trackName,
    }];
  });
}
