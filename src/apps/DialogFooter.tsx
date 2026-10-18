import { Button } from 'react95';

type DialogFooterProps = {
  onOk: () => void;
  onCancel: () => void;
  onApply?: () => void;
  applyDisabled?: boolean;
};

export function DialogFooter({ onOk, onCancel, onApply, applyDisabled }: DialogFooterProps) {
  return (
    <div className="dialog-footer">
      <Button onClick={onOk} style={{ minWidth: 84 }}>OK</Button>
      <Button onClick={onCancel} style={{ minWidth: 84 }}>Abbrechen</Button>
      {onApply ? (
        <Button onClick={onApply} disabled={applyDisabled} style={{ minWidth: 84 }}>Übernehmen</Button>
      ) : null}
    </div>
  );
}
