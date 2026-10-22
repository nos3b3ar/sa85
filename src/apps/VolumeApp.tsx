import { Button } from 'react95';
import { playDing, playStartupSound } from '../audio/audio';
import { useT } from '../i18n';
import { VolumeControl } from './VolumeControl';

export function VolumeApp() {
  const t = useT();
  return (
    <div className="volume-app">
      <VolumeControl title={t.volume.title} />
      <div className="volume-actions">
        <Button onClick={() => playDing()}>{t.volume.testTone}</Button>
        <Button onClick={() => playStartupSound('win98')}>{t.volume.win98}</Button>
        <Button onClick={() => playStartupSound('win95')}>{t.volume.win95}</Button>
      </div>
    </div>
  );
}
