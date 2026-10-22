import { Checkbox, Slider } from 'react95';
import { playDing } from '../audio/audio';
import { useT } from '../i18n';
import { updateSettings, useSettings } from '../settings/settings';

type VolumeControlProps = {
  title?: string;
};

export function VolumeControl({ title }: VolumeControlProps) {
  const t = useT();
  const settings = useSettings();
  return (
    <div className="volume-control">
      <span>{title ?? t.volume.label}</span>
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
        label={t.volume.mute}
        checked={settings.muted}
        onChange={(event) => updateSettings({ muted: event.target.checked })}
      />
    </div>
  );
}
