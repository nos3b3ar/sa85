import type { CursorRole, CustomCursor } from '../settings/settings';

const size = 32;
/** localStorage teilt sich rund 5 MB mit allen Einstellungen. */
const maxUrlLength = 24_000;

const centered: CursorRole[] = ['busy', 'precision', 'unavailable', 'resizeNS', 'resizeEW', 'resizeNWSE', 'resizeNESW', 'move'];

export class CursorUploadError extends Error {
  constructor(readonly reason: 'unreadable' | 'tooBig') {
    super(reason);
  }
}

/** CUR-Dateien speichern den Hotspot im Kopf des ersten Eintrags. */
function curHotspot(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 22 || view.getUint16(0, true) !== 0 || view.getUint16(2, true) !== 2) return null;
  const width = view.getUint8(6) || 256;
  const height = view.getUint8(7) || 256;
  return { x: view.getUint16(10, true), y: view.getUint16(12, true), width, height };
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new CursorUploadError('unreadable'));
    image.src = url;
  });
}

/**
 * Lädt SVG, PNG, ICO oder CUR, skaliert auf 32x32 und speichert als PNG-Data-URL.
 * So funktionieren auch Formate, die ein Browser als CSS-Zeiger nicht kennt, und der Speicher bleibt klein.
 */
export async function cursorFromFile(file: File, role: CursorRole): Promise<CustomCursor> {
  const buffer = await file.arrayBuffer();
  const hotspot = curHotspot(buffer);
  const type = hotspot ? 'image/x-icon' : file.type || (file.name.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : '');
  const blobUrl = URL.createObjectURL(new Blob([buffer], { type }));
  try {
    const image = await loadImage(blobUrl);
    const sourceWidth = image.naturalWidth || size;
    const sourceHeight = image.naturalHeight || size;
    const scale = Math.min(size / sourceWidth, size / sourceHeight);
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new CursorUploadError('unreadable');
    context.imageSmoothingEnabled = scale < 1 || !Number.isInteger(scale);
    context.drawImage(image, 0, 0, width, height);
    const url = canvas.toDataURL('image/png');
    if (url.length > maxUrlLength) throw new CursorUploadError('tooBig');
    const clamp = (value: number) => Math.min(size - 1, Math.max(0, Math.round(value)));
    if (hotspot) {
      return { url, x: clamp((hotspot.x / hotspot.width) * width), y: clamp((hotspot.y / hotspot.height) * height) };
    }
    if (centered.includes(role)) return { url, x: clamp(width / 2), y: clamp(height / 2) };
    return { url, x: 0, y: 0 };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
