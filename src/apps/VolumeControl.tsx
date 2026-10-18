import { Checkbox, Slider } from 'react95';
import { playDing } from '../audio/audio';
import { updateSettings, useSettings } from '../settings/settings';

type VolumeControlProps = {
  title?: string;
};

export function VolumeControl({ title = 'Lautstärke' }: VolumeControlProps) {
  const settings = useSettings();
  return (
    <div className="volume-control">
      <span>{title}</span>
      <Slider
        orientation="vertical"
        size="120px"
        min={0}
        max={100}
        step={5}
        value={Math.round(settings.volume * 100)}
        onChange={(value) => updateSettings({ volume: value / 100 })}
        onChangeCommitted={() => playDing()}
      />
      <Checkbox
        label="Ton aus"
        checked={settings.muted}
        onChange={(event) => updateSettings({ muted: event.target.checked })}
      />
    </div>
  );
}
