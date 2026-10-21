import { useEffect, useRef } from 'react';
import { dosGames } from '../content/dosGames';

type DosMessage = { type: 'sa85-dos'; event: string };

export function DosMode({ onExit }: { onExit: () => void }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    const onMessage = (event: MessageEvent<DosMessage>) => {
      if (event.source !== frameRef.current?.contentWindow || event.data?.type !== 'sa85-dos') return;
      if (event.data.event === 'started') frameRef.current?.focus();
      if (event.data.event === 'exit') onExitRef.current();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const sendGames = () => {
    const games = dosGames.map(({ file, dir, exe, command, cycles }) => ({ file, dir, exe, command, cycles }));
    frameRef.current?.contentWindow?.postMessage({ type: 'sa85-dos', action: 'dosmode', games }, window.location.origin);
  };

  return (
    <div className="dos-mode">
      <iframe
        ref={frameRef}
        src="/dos/index.html?mode=dos"
        title="MS-DOS-Modus"
        allow="fullscreen; autoplay"
        onLoad={sendGames}
      />
    </div>
  );
}
