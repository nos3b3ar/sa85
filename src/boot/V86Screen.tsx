import { useEffect, useRef, useState } from 'react';

type V86Media = 'floppy' | 'hdd' | 'cdrom';

type V86Instance = { destroy: () => Promise<void> | void };
type V86Constructor = new (options: Record<string, unknown>) => V86Instance;

type V86ScreenProps = {
  image: ArrayBuffer;
  media: V86Media;
  onError: () => void;
};

let loader: Promise<V86Constructor> | null = null;

function loadV86() {
  loader ??= new Promise<V86Constructor>((resolve, reject) => {
    const existing = (window as Window & { V86?: V86Constructor }).V86;
    if (existing) {
      resolve(existing);
      return;
    }
    const script = document.createElement('script');
    script.src = '/v86/libv86.js';
    script.onload = () => {
      const ctor = (window as Window & { V86?: V86Constructor }).V86;
      if (ctor) resolve(ctor);
      else reject(new Error('V86 missing'));
    };
    script.onerror = () => {
      loader = null;
      reject(new Error('libv86.js not loaded'));
    };
    document.head.appendChild(script);
  });
  return loader;
}

/** Bootet Disketten-, Festplatten- und CD-Images vom Stick in v86 (SeaBIOS). */
export function V86Screen({ image, media, onError }: V86ScreenProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let emulator: V86Instance | null = null;
    let cancelled = false;
    void loadV86().then((V86) => {
      if (cancelled || !screenRef.current) return;
      const drive = media === 'floppy' ? 'fda' : media === 'cdrom' ? 'cdrom' : 'hda';
      emulator = new V86({
        wasm_path: '/v86/v86.wasm',
        memory_size: 64 * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        screen_container: screenRef.current,
        bios: { url: '/firmware/seabios.bin' },
        vga_bios: { url: '/firmware/vgabios.bin' },
        [drive]: { buffer: image },
        autostart: true,
      });
    }).catch(() => {
      if (!cancelled) onErrorRef.current();
    });
    return () => {
      cancelled = true;
      void Promise.resolve(emulator?.destroy()).catch(() => undefined);
    };
  }, [image, media]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const frame = frameRef.current;
      const screen = screenRef.current;
      if (!frame || !screen) return;
      const width = screen.scrollWidth || 1;
      const height = screen.scrollHeight || 1;
      const next = Math.max(0.5, Math.min(frame.clientWidth / width, frame.clientHeight / height));
      setScale((current) => (Math.abs(current - next) > 0.01 ? next : current));
    }, 400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="v86-frame" ref={frameRef}>
      <div className="v86-screen" ref={screenRef} style={{ transform: `scale(${scale})` }}>
        <div className="v86-text" />
        <canvas className="v86-canvas" />
      </div>
    </div>
  );
}
