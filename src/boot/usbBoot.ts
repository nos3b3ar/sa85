/**
 * USB-Boot im Browser. Ein eingesteckter Stick lässt sich nicht erkennen; der Nutzer gibt stattdessen einen Ordner
 * frei. Es wird ausschließlich gelesen: showDirectoryPicker({ mode: 'read' }) bzw. <input webkitdirectory>.
 * WebUSB scheidet aus, weil Chrome Massenspeicher-Geräte dort sperrt.
 */

export type UsbSupport = 'directory-picker' | 'file-input' | 'none';

export type UsbFile = { path: string; file: File };

export type UsbVolume = { name: string; files: UsbFile[]; truncated: boolean };

export type BootCandidate =
  | { kind: 'dos'; label: string; file: File }
  | { kind: 'dos-folder'; label: string; files: UsbFile[] }
  | { kind: 'image'; label: string; file: File; media: 'floppy' | 'hdd' | 'cdrom' }
  | { kind: 'zipped-image'; label: string; file: File; entry: string; media: 'floppy' | 'hdd' | 'cdrom' };

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options: { mode: 'read'; id?: string; startIn?: string }) => Promise<FileSystemDirectoryHandle>;
};

type IterableDirectory = FileSystemDirectoryHandle & { values(): AsyncIterable<FileSystemHandle> };

const maxFiles = 2000;
const maxDepth = 4;
const maxFolderBytes = 256 * 1024 * 1024;
const floppySizes = [163840, 184320, 327680, 368640, 737280, 1228800, 1474560, 2949120];

export function isAppleTouchDevice() {
  const { userAgent, maxTouchPoints } = navigator;
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}

export function usbSupport(): UsbSupport {
  if (isAppleTouchDevice()) return 'none';
  if (window.isSecureContext && typeof (window as DirectoryPickerWindow).showDirectoryPicker === 'function') {
    return 'directory-picker';
  }
  if ('webkitdirectory' in HTMLInputElement.prototype) return 'file-input';
  return 'none';
}

/** Muss direkt aus einer Nutzergeste (Klick, Enter) heraus aufgerufen werden. null = abgebrochen. */
export async function openUsbVolume(support: UsbSupport): Promise<UsbVolume | null> {
  if (support === 'directory-picker') {
    let handle: FileSystemDirectoryHandle;
    try {
      handle = await (window as DirectoryPickerWindow).showDirectoryPicker!({ mode: 'read', id: 'sa85-usb' });
    } catch {
      return null;
    }
    const files: UsbFile[] = [];
    const truncated = await collect(handle as IterableDirectory, '', 0, files);
    return { name: handle.name, files, truncated };
  }
  if (support === 'file-input') return pickWithInput();
  return null;
}

async function collect(dir: IterableDirectory, prefix: string, depth: number, out: UsbFile[]): Promise<boolean> {
  for await (const entry of dir.values()) {
    if (out.length >= maxFiles) return true;
    if (entry.name.startsWith('.') && entry.name !== '.jsdos') continue;
    const path = prefix + entry.name;
    if (entry.kind === 'file') {
      out.push({ path, file: await (entry as FileSystemFileHandle).getFile() });
    } else if (depth < maxDepth) {
      if (await collect(entry as IterableDirectory, `${path}/`, depth + 1, out)) return true;
    }
  }
  return false;
}

function pickWithInput(): Promise<UsbVolume | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;
    input.hidden = true;
    let settled = false;
    const finish = (volume: UsbVolume | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('focus', onFocus);
      input.remove();
      resolve(volume);
    };
    // Ältere Browser kennen kein „cancel“-Event; nach dem Schließen des Dialogs kehrt nur der Fokus zurück.
    const onFocus = () => window.setTimeout(() => {
      if (!input.files?.length) finish(null);
    }, 800);
    input.addEventListener('change', () => {
      const list = Array.from(input.files ?? []);
      if (!list.length) {
        finish(null);
        return;
      }
      const root = list[0].webkitRelativePath.split('/')[0] || 'USB';
      const files = list.slice(0, maxFiles).map((file) => ({
        path: file.webkitRelativePath.split('/').slice(1).join('/') || file.name,
        file,
      }));
      finish({ name: root, files, truncated: list.length > maxFiles });
    });
    input.addEventListener('cancel', () => finish(null));
    window.addEventListener('focus', onFocus);
    document.body.appendChild(input);
    input.click();
  });
}

const dosProgram = /\.(exe|com|bat)$/i;
const imageExtension = /\.(img|ima|flp|vfd|dsk|bin|iso)$/i;

function imageMedia(name: string, size: number): 'floppy' | 'hdd' | 'cdrom' | null {
  if (/\.iso$/i.test(name)) return 'cdrom';
  if (size <= 2949120) {
    // Ein „.bin“ ist nur als Bootsektor sinnvoll: genau 512 Byte mit Signatur 55AA prüft bootSectorValid.
    if (/\.bin$/i.test(name) && size !== 512) return null;
    return 'floppy';
  }
  if (/\.bin$/i.test(name)) return null;
  return 'hdd';
}

type ZipEntry = { name: string; method: number; compressedSize: number; size: number; localOffset: number };

async function zipEntries(file: File): Promise<ZipEntry[] | null> {
  const tailSize = Math.min(file.size, 65557);
  const tail = new DataView(await file.slice(file.size - tailSize).arrayBuffer());
  let end = -1;
  for (let index = tail.byteLength - 22; index >= 0; index -= 1) {
    if (tail.getUint32(index, true) === 0x06054b50) {
      end = index;
      break;
    }
  }
  if (end < 0) return null;
  const count = tail.getUint16(end + 10, true);
  const size = tail.getUint32(end + 12, true);
  const offset = tail.getUint32(end + 16, true);
  if (offset + size > file.size) return null;
  const central = new DataView(await file.slice(offset, offset + size).arrayBuffer());
  const decoder = new TextDecoder('latin1');
  const entries: ZipEntry[] = [];
  let cursor = 0;
  for (let index = 0; index < count && cursor + 46 <= central.byteLength; index += 1) {
    if (central.getUint32(cursor, true) !== 0x02014b50) break;
    const nameLength = central.getUint16(cursor + 28, true);
    const extraLength = central.getUint16(cursor + 30, true);
    const commentLength = central.getUint16(cursor + 32, true);
    entries.push({
      name: decoder.decode(new Uint8Array(central.buffer, cursor + 46, nameLength)),
      method: central.getUint16(cursor + 10, true),
      compressedSize: central.getUint32(cursor + 20, true),
      size: central.getUint32(cursor + 24, true),
      localOffset: central.getUint32(cursor + 42, true),
    });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

/** Entpackt eine einzelne Datei aus einem ZIP (gespeichert oder Deflate), ohne das ganze Archiv zu laden. */
export async function extractZipEntry(file: File, name: string): Promise<ArrayBuffer | null> {
  const entries = await zipEntries(file);
  const entry = entries?.find((item) => item.name === name);
  if (!entry) return null;
  const header = new DataView(await file.slice(entry.localOffset, entry.localOffset + 30).arrayBuffer());
  if (header.getUint32(0, true) !== 0x04034b50) return null;
  const start = entry.localOffset + 30 + header.getUint16(26, true) + header.getUint16(28, true);
  const data = file.slice(start, start + entry.compressedSize);
  if (entry.method === 0) return data.arrayBuffer();
  if (entry.method !== 8 || typeof DecompressionStream === 'undefined') return null;
  try {
    return await new Response(data.stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
  } catch {
    return null;
  }
}

async function bootSectorValid(file: File) {
  if (file.size < 512) return false;
  const bytes = new Uint8Array(await file.slice(510, 512).arrayBuffer());
  return bytes[0] === 0x55 && bytes[1] === 0xaa;
}

function baseName(path: string) {
  return path.split('/').pop() ?? path;
}

/** Sucht in der Reihenfolge des Plans: js-dos-Bundles und DOS-ZIPs, Disketten-/Festplatten-Images, lose DOS-Programme. */
export async function findBootCandidates(volume: UsbVolume): Promise<BootCandidate[]> {
  const dos: BootCandidate[] = [];
  const images: BootCandidate[] = [];
  for (const { path, file } of volume.files) {
    const name = baseName(path);
    if (/\.jsdos$/i.test(name)) {
      dos.push({ kind: 'dos', label: path, file });
      continue;
    }
    if (/\.zip$/i.test(name)) {
      const entries = await zipEntries(file).catch(() => null);
      if (!entries) continue;
      if (entries.some((entry) => entry.name === '.jsdos/dosbox.conf' || dosProgram.test(entry.name))) {
        dos.push({ kind: 'dos', label: path, file });
        continue;
      }
      const image = entries.find((entry) => imageExtension.test(entry.name) && imageMedia(entry.name, entry.size));
      if (image) {
        images.push({
          kind: 'zipped-image',
          label: `${path} > ${image.name}`,
          file,
          entry: image.name,
          media: imageMedia(image.name, image.size)!,
        });
      }
      continue;
    }
    if (imageExtension.test(name)) {
      const media = imageMedia(name, file.size);
      if (!media) continue;
      if (media !== 'cdrom' && !(await bootSectorValid(file))) continue;
      images.push({ kind: 'image', label: path, file, media });
    }
  }
  const loose = volume.files.filter(({ path }) => !/\.(zip|jsdos)$/i.test(path));
  const hasProgram = loose.some(({ path }) => dosProgram.test(path));
  const bytes = loose.reduce((sum, { file }) => sum + file.size, 0);
  const folder: BootCandidate[] = hasProgram && bytes <= maxFolderBytes
    ? [{ kind: 'dos-folder', label: `${volume.name}\\ (Ordner als Laufwerk C:)`, files: loose }]
    : [];
  return [...dos, ...images, ...folder];
}

/** v86 kennt nur Standard-Diskettengrößen; ein 512-Byte-Bootsektor wird auf 1,44 MB aufgefüllt. */
export function padFloppy(buffer: ArrayBuffer) {
  const length = buffer.byteLength;
  const target = length < floppySizes[0] ? 1474560 : floppySizes.find((size) => size >= length) ?? length;
  if (target === length) return buffer;
  const padded = new Uint8Array(target);
  padded.set(new Uint8Array(buffer));
  return padded.buffer;
}
