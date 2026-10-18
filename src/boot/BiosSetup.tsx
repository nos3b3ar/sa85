import { useEffect, useRef, useState } from 'react';
import { setupMenu } from './bootScript';

type BiosSetupProps = {
  onExit: () => void;
  onScanDisk: () => void;
};

const items = [
  ...setupMenu.left.map((label, index) => ({ label, column: 0, row: index })),
  ...setupMenu.right.map((label, index) => ({ label, column: 1, row: index })),
];

const scanDiskIndex = items.findIndex((item) => item.label === 'MICROSOFT SCANDISK');

export function BiosSetup({ onExit, onScanDisk }: BiosSetupProps) {
  const [selected, setSelected] = useState(0);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;
  const onScanDiskRef = useRef(onScanDisk);
  onScanDiskRef.current = onScanDisk;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && selectedRef.current === scanDiskIndex) {
        event.preventDefault();
        onScanDiskRef.current();
        return;
      }
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === 'F10') {
        event.preventDefault();
        event.stopPropagation();
        onExitRef.current();
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setSelected((current) => moveVertical(current, event.key === 'ArrowDown' ? 1 : -1));
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        setSelected((current) => moveHorizontal(current, event.key === 'ArrowRight' ? 1 : -1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="setup-screen">
      <div className="setup-title">
        <p>ROM PCI/ISA BIOS ({'2A69KA1J'})</p>
        <p>CMOS SETUP UTILITY</p>
        <p>AWARD SOFTWARE, INC.</p>
      </div>
      <div className="setup-columns">
        {[0, 1].map((column) => (
          <div key={column}>
            {items.filter((item) => item.column === column).map((item) => {
              const index = item.column * setupMenu.left.length + item.row;
              return (
                <button
                  key={item.label}
                  type="button"
                  className={index === selected ? 'setup-item is-selected' : 'setup-item'}
                  onClick={() => {
                    setSelected(index);
                    if (item.label === 'MICROSOFT SCANDISK') onScanDiskRef.current();
                    if (item.label === 'SAVE & EXIT SETUP' || item.label === 'EXIT WITHOUT SAVING') {
                      onExitRef.current();
                    }
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="setup-footer">
        <span>ESC : Quit &nbsp;&nbsp; F10 : Save &amp; Exit Setup</span>
        <span>Up/Dn/Lf/Rt : Select Item</span>
      </div>
      <div className="setup-dialog" role="dialog" aria-label="Easter Egg">
        <p>Welcome to the 90s.</p>
        <p>Congratulations that you found my small Easter egg.</p>
        <button type="button" className="setup-ok" onClick={() => onExitRef.current()}>
          OK
        </button>
      </div>
    </div>
  );
}

function moveVertical(current: number, direction: 1 | -1) {
  const columnSize = setupMenu.left.length;
  const column = Math.floor(current / columnSize);
  const row = current % columnSize;
  const nextRow = (row + direction + columnSize) % columnSize;
  return column * columnSize + nextRow;
}

function moveHorizontal(current: number, direction: 1 | -1) {
  const columnSize = setupMenu.left.length;
  const column = Math.floor(current / columnSize);
  const row = current % columnSize;
  const nextColumn = column + direction;
  if (nextColumn < 0 || nextColumn > 1) return current;
  return nextColumn * columnSize + row;
}
