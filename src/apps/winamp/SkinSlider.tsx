import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';

type SkinSliderProps = {
  value: number;
  min: number;
  max: number;
  label: string;
  className?: string;
  vertical?: boolean;
  disabled?: boolean;
  step?: number;
  style?: CSSProperties;
  onChange: (value: number) => void;
  onRelease?: (value: number) => void;
};

export function SkinSlider({
  value,
  min,
  max,
  label,
  className,
  vertical = false,
  disabled = false,
  step,
  style,
  onChange,
  onRelease,
}: SkinSliderProps) {
  const dragging = useRef(false);
  const last = useRef(value);
  const range = max - min || 1;
  const ratio = Math.min(1, Math.max(0, (value - min) / range));

  const valueAt = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = vertical
      ? 1 - (event.clientY - rect.top) / rect.height
      : (event.clientX - rect.left) / rect.width;
    return min + Math.min(1, Math.max(0, position)) * range;
  };

  const update = (event: PointerEvent<HTMLDivElement>) => {
    const next = valueAt(event);
    last.current = next;
    onChange(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = step ?? range / 20;
    let next: number | null = null;
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') next = value + delta;
    if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') next = value - delta;
    if (next === null) return;
    event.preventDefault();
    next = Math.min(max, Math.max(min, next));
    onChange(next);
    onRelease?.(next);
  };

  return (
    <div
      className={['skin-slider', vertical ? 'is-vertical' : '', disabled ? 'is-disabled' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={{ ...style, '--ratio': ratio } as CSSProperties}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value * 10) / 10}
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-disabled={disabled}
      onKeyDown={disabled ? undefined : onKeyDown}
      onPointerDown={(event) => {
        if (disabled) return;
        event.stopPropagation();
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event);
      }}
      onPointerMove={(event) => {
        if (dragging.current) update(event);
      }}
      onPointerUp={() => {
        if (!dragging.current) return;
        dragging.current = false;
        onRelease?.(last.current);
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      <span className="skin-slider-thumb" />
    </div>
  );
}
