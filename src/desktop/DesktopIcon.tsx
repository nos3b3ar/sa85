import type { DesktopApp } from '../apps/registry';

type DesktopIconProps = {
  app: DesktopApp;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
};

export function DesktopIcon({ app, selected, onSelect, onOpen }: DesktopIconProps) {
  const Icon = app.icon;
  return (
    <button
      type="button"
      className={selected ? 'desktop-icon is-selected' : 'desktop-icon'}
      onClick={onSelect}
      onDoubleClick={onOpen}
    >
      <Icon variant="32x32_4" />
      <span>{app.title}</span>
    </button>
  );
}
