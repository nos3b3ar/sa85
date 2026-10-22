import { Slider } from 'react95';

type SliderRowProps = {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  left: string;
  right: string;
  disabled?: boolean;
};

export function SliderRow({ min, max, value, onChange, left, right, disabled }: SliderRowProps) {
  return (
    <div className={disabled ? 'slider-row is-disabled' : 'slider-row'}>
      <span>{left}</span>
      <Slider
        min={min}
        max={max}
        step={1}
        marks
        size="100%"
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
      <span>{right}</span>
    </div>
  );
}
