export type PreloadItem =
  | { id: string; type: 'image'; src: string }
  | { id: string; type: 'audio'; src: string }
  | { id: string; type: 'font'; family: string; src: string; weight?: string }
  | { id: string; type: 'module'; load: () => Promise<unknown> };

export async function preloadAssets(
  items: PreloadItem[],
  onProgress?: (done: number, total: number) => void,
) {
  const total = items.length;
  let done = 0;
  onProgress?.(0, total);
  await Promise.all(
    items.map(async (item) => {
      try {
        await withTimeout(loadItem(item), 8000);
      } catch {
        // Ein einzelnes Asset darf den Desktop nicht blockieren.
      } finally {
        done += 1;
        onProgress?.(done, total);
      }
    }),
  );
}

async function loadItem(item: PreloadItem) {
  if (item.type === 'module') {
    await item.load();
    return;
  }
  if (item.type === 'font') {
    const face = new FontFace(item.family, `url(${item.src})`, { weight: item.weight ?? '400' });
    await face.load();
    document.fonts.add(face);
    return;
  }
  if (item.type === 'audio') {
    await loadMedia(item.src, () => new Audio());
    return;
  }
  await loadMedia(item.src, () => new Image());
}

function loadMedia(src: string, create: () => HTMLAudioElement | HTMLImageElement) {
  return new Promise<void>((resolve, reject) => {
    const media = create();
    const finish = () => resolve();
    const fail = () => reject(new Error(`preload failed: ${src}`));
    if (media instanceof HTMLAudioElement) {
      media.preload = 'auto';
      media.addEventListener('canplaythrough', finish, { once: true });
      media.addEventListener('error', fail, { once: true });
      media.src = src;
      media.load();
      return;
    }
    media.addEventListener('load', finish, { once: true });
    media.addEventListener('error', fail, { once: true });
    media.src = src;
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}
