import { Button } from 'react95';
import { playDing, playStartupSound } from '../audio/audio';
import { VolumeControl } from './VolumeControl';

export function VolumeApp() {
  return (
    <div className="volume-app">
      <VolumeControl title="Lautstärkeregelung" />
      <div className="volume-actions">
        <Button onClick={() => playDing()}>Testton</Button>
        <Button onClick={() => playStartupSound('win98')}>Windows-Start</Button>
        <Button onClick={() => playStartupSound('win95')}>Windows 95</Button>
      </div>
    </div>
  );
}
