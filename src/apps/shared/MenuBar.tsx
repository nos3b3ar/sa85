import { useEffect, useRef, useState } from 'react';
import { MenuList, MenuListItem, Separator } from 'react95';

export type MenuEntry =
  | { kind: 'item'; label: string; shortcut?: string; checked?: boolean; disabled?: boolean; onSelect: () => void }
  | { kind: 'separator' };

export type Menu = {
  label: string;
  entries: MenuEntry[];
};

export function MenuBar({ menus }: { menus: Menu[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(null);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="menu-bar" ref={rootRef}>
      {menus.map((menu) => (
        <div key={menu.label} className="menu-bar-root">
          <button
            type="button"
            className={open === menu.label ? 'menu-bar-item is-open' : 'menu-bar-item'}
            onClick={() => setOpen((current) => (current === menu.label ? null : menu.label))}
            onMouseEnter={() => setOpen((current) => (current ? menu.label : current))}
          >
            {menu.label}
          </button>
          {open === menu.label ? (
            <MenuList className="menu-bar-dropdown">
              {menu.entries.map((entry, index) => (entry.kind === 'separator' ? (
                <Separator key={`sep-${index}`} />
              ) : (
                <MenuListItem
                  key={entry.label}
                  size="sm"
                  disabled={entry.disabled}
                  onClick={() => {
                    if (entry.disabled) return;
                    setOpen(null);
                    entry.onSelect();
                  }}
                >
                  <span className="menu-bar-check">{entry.checked ? '✓' : ''}</span>
                  <span className="menu-bar-label">{entry.label}</span>
                  {entry.shortcut ? <span className="menu-bar-shortcut">{entry.shortcut}</span> : null}
                </MenuListItem>
              )))}
            </MenuList>
          ) : null}
        </div>
      ))}
    </div>
  );
}
