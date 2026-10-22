import { useT } from '../i18n';
import type { UsbDevice } from './cmos';

type UsbConsentProps = {
  device: UsbDevice;
  onAnswer: (allow: boolean) => void;
};

/** BIOS-Abfrage vor dem Ordnerdialog; der Klick bzw. ENTER liefert die Nutzergeste für den Browser. */
export function UsbConsent({ device, onAnswer }: UsbConsentProps) {
  const t = useT().boot;
  return (
    <div className="bios-box usb-consent" role="dialog" aria-label={t.usbConsentQuestion}>
      <div className="bios-box-title">{` USB Mass Storage Device (${device}) `}</div>
      <p>{t.usbConsentQuestion}</p>
      <p className="bios-box-note">{t.usbConsentNote}</p>
      <div className="bios-box-actions">
        <button type="button" className="setup-value is-selected" onClick={() => onAnswer(true)}>{`[Y] ${t.usbConsentYes}`}</button>
        <button type="button" className="setup-value" onClick={() => onAnswer(false)}>{`[N] ${t.usbConsentNo}`}</button>
      </div>
    </div>
  );
}
