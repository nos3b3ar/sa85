import { Button } from 'react95';
import { useT } from '../i18n';

type DialogFooterProps = {
  onOk: () => void;
  onCancel: () => void;
  onApply?: () => void;
  applyDisabled?: boolean;
};

export function DialogFooter({ onOk, onCancel, onApply, applyDisabled }: DialogFooterProps) {
  const t = useT();
  return (
    <div className="dialog-footer">
      <Button onClick={onOk} style={{ minWidth: 84 }}>{t.common.ok}</Button>
      <Button onClick={onCancel} style={{ minWidth: 84 }}>{t.common.cancel}</Button>
      {onApply ? (
        <Button onClick={onApply} disabled={applyDisabled} style={{ minWidth: 84 }}>{t.common.apply}</Button>
      ) : null}
    </div>
  );
}
