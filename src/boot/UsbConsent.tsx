import type { UsbDevice } from './cmos';

type UsbConsentProps = {
  device: UsbDevice;
  onAnswer: (allow: boolean) => void;
};

/** BIOS-Abfrage vor dem Ordnerdialog; der Klick bzw. ENTER liefert die Nutzergeste für den Browser. */
export function UsbConsent({ device, onAnswer }: UsbConsentProps) {
  return (
    <div className="bios-box usb-consent" role="dialog" aria-label="USB-Zugriff">
      <div className="bios-box-title">{` USB Mass Storage Device (${device}) `}</div>
      <p>Zugriff auf den USB-Stick erlauben?</p>
      <p className="bios-box-note">
        Der Browser öffnet danach eine Ordnerauswahl. Der Ordner gilt als Stick und wird nur gelesen, nie beschrieben.
      </p>
      <div className="bios-box-actions">
        <button type="button" className="setup-value is-selected" onClick={() => onAnswer(true)}>[Y] Ja</button>
        <button type="button" className="setup-value" onClick={() => onAnswer(false)}>[N] Nein</button>
      </div>
    </div>
  );
}
