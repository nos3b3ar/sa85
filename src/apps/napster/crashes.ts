type Lang = 'de' | 'en';
type Text = Record<Lang, string>;

export type DialogCrash = {
  kind: 'dialog';
  id: string;
  title: Text;
  icon: 'error' | 'warning';
  message: Text[];
  buttons: Text[];
  /** Klappt mit „Details >>“ auf, wie beim Absturzdialog von Windows 98. */
  details?: Text;
};

export type ScreenCrash = {
  kind: 'screen';
  id: string;
  /** Text-Modus: blauer Bluescreen oder schwarzer Bildschirm wie beim Schutzverletzungsfehler. */
  tone: 'blue' | 'black';
  heading?: Text;
  lines: Text[];
  prompt?: Text;
};

export type Crash = DialogCrash | ScreenCrash;

const ok: Text = { de: 'OK', en: 'OK' };

const registers = `NAPSTER verursachte einen Fehler durch eine ungültige Seite
in Modul KERNEL32.DLL bei 0167:bff7a388.
Register:
EAX=00000000 CS=0167 EIP=bff7a388 EFLGS=00010246
EBX=0063fd04 SS=016f ESP=0063fcd8 EBP=0063fd28
ECX=00000000 DS=016f ESI=81653a10 FS=4e0f
EDX=816539c4 ES=016f EDI=00000000 GS=0000
Bytes bei CS:EIP:
8b 41 04 85 c0 74 1a 8b 4c 24 08 89 08 c3 90 90
Stapelwerte:
0063fd28 00402f1c 00000000 0063fe38 81653a10 00430d58`;

export const crashes: Crash[] = [
  {
    kind: 'dialog',
    id: 'illegal-operation',
    title: { de: 'Napster', en: 'Napster' },
    icon: 'error',
    message: [
      {
        de: 'Dieses Programm wurde aufgrund eines ungültigen Vorgangs geschlossen.',
        en: 'This program has performed an illegal operation and will be shut down.',
      },
      {
        de: 'Falls weiterhin Probleme auftreten, wenden Sie sich an den Hersteller des Programms.',
        en: 'If the problem persists, contact the program vendor.',
      },
    ],
    buttons: [{ de: 'Schließen', en: 'Close' }, { de: 'Details >>', en: 'Details >>' }],
    details: {
      de: registers,
      en: registers
        .replace('NAPSTER verursachte einen Fehler durch eine ungültige Seite\nin Modul', 'NAPSTER caused an invalid page fault in\nmodule')
        .replace(' bei 0167', ' at 0167')
        .replace('Register:', 'Registers:')
        .replace('Bytes bei', 'Bytes at')
        .replace('Stapelwerte:', 'Stack dump:'),
    },
  },
  {
    kind: 'dialog',
    id: 'missing-export',
    title: { de: 'Fehler beim Starten des Programms', en: 'Error Starting Program' },
    icon: 'error',
    message: [
      {
        de: 'Die Datei NAPSTER.EXE ist mit dem fehlenden Export WS2_32.DLL:WSAIoctl verknüpft.',
        en: 'The NAPSTER.EXE file is linked to missing export WS2_32.DLL:WSAIoctl.',
      },
    ],
    buttons: [ok],
  },
  {
    kind: 'dialog',
    id: 'missing-dll',
    title: { de: 'Fehler beim Starten des Programms', en: 'Error Starting Program' },
    icon: 'error',
    message: [
      {
        de: 'Eine benötigte .DLL-Datei, MSVCP60.DLL, wurde nicht gefunden.',
        en: 'A required .DLL file, MSVCP60.DLL, was not found.',
      },
    ],
    buttons: [ok],
  },
  {
    kind: 'dialog',
    id: 'out-of-memory',
    title: { de: 'Napster', en: 'Napster' },
    icon: 'error',
    message: [
      {
        de: 'Nicht genügend Arbeitsspeicher, um NAPSTER.EXE auszuführen. Beenden Sie ein oder mehrere Programme, und versuchen Sie es erneut.',
        en: 'There is not enough memory to start NAPSTER.EXE. Quit one or more programs, and then try again.',
      },
    ],
    buttons: [ok],
  },
  {
    kind: 'dialog',
    id: 'modem',
    title: { de: 'DFÜ-Netzwerk', en: 'Dial-Up Networking' },
    icon: 'error',
    message: [
      {
        de: 'Das Modem antwortet nicht. Überprüfen Sie, ob das Modem angeschlossen ist. Schalten Sie es gegebenenfalls aus und wieder ein.',
        en: 'The computer is not receiving a response from the modem. Check that the modem is plugged in, and if necessary, turn the modem off and then turn it back on.',
      },
    ],
    buttons: [ok],
  },
  {
    kind: 'dialog',
    id: 'no-disk',
    title: { de: 'Windows - Kein Datenträger', en: 'Windows - No Disk' },
    icon: 'warning',
    message: [
      {
        de: 'Es befindet sich kein Datenträger im Laufwerk. Legen Sie einen Datenträger in Laufwerk A: ein.',
        en: 'There is no disk in the drive. Please insert a disk into drive A:.',
      },
    ],
    buttons: [{ de: 'Abbrechen', en: 'Cancel' }, { de: 'Wiederholen', en: 'Try Again' }, { de: 'Weiter', en: 'Continue' }],
  },
  {
    kind: 'screen',
    id: 'fatal-0e',
    tone: 'blue',
    heading: { de: 'Windows', en: 'Windows' },
    lines: [
      {
        de: 'Ein schwerer Ausnahmefehler 0E ist bei 0028:C0011E36 in VXD VMM(01) + 00010E36 aufgetreten. Die aktuelle Anwendung wird beendet.',
        en: 'A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01) + 00010E36. The current application will be terminated.',
      },
      {
        de: '*  Drücken Sie eine beliebige Taste, um die aktuelle Anwendung zu beenden.\n*  Drücken Sie STRG+ALT+ENTF, um den Computer neu zu starten. Nicht gespeicherte Daten gehen dabei verloren.',
        en: '*  Press any key to terminate the current application.\n*  Press CTRL+ALT+DEL again to restart your computer. You will lose any unsaved information in all applications.',
      },
    ],
    prompt: { de: 'Weiter mit beliebiger Taste _', en: 'Press any key to continue _' },
  },
  {
    kind: 'screen',
    id: 'exception-0d',
    tone: 'blue',
    heading: { de: 'Windows', en: 'Windows' },
    lines: [
      {
        de: 'Ein Ausnahmefehler 0D ist bei 0167:BFF9DFFF aufgetreten. Dieser wurde von 0028:C001D5B6 in VxD NTKERN(01) + 00002A4E aufgerufen. Möglicherweise kann normal weitergearbeitet werden.',
        en: 'An exception 0D has occurred at 0167:BFF9DFFF. This was called from 0028:C001D5B6 in VxD NTKERN(01) + 00002A4E. It may be possible to continue normally.',
      },
      {
        de: '*  Drücken Sie eine beliebige Taste, um den Vorgang fortzusetzen.\n*  Drücken Sie STRG+ALT+ENTF, um den Computer neu zu starten. Nicht gespeicherte Daten gehen dabei verloren.',
        en: '*  Press any key to attempt to continue.\n*  Press CTRL+ALT+DEL to restart your computer. You will lose any unsaved information in all applications.',
      },
    ],
    prompt: { de: 'Weiter mit beliebiger Taste _', en: 'Press any key to continue _' },
  },
  {
    kind: 'screen',
    id: 'busy',
    tone: 'blue',
    heading: { de: 'Windows', en: 'Windows' },
    lines: [
      {
        de: 'Das System ist ausgelastet oder instabil geworden. Sie können warten, bis das System wieder verfügbar ist, oder den Computer neu starten.',
        en: 'The system is either busy or has become unstable. You can wait and see if it becomes available again, or you can restart your computer.',
      },
      {
        de: '*  Drücken Sie eine beliebige Taste, um zu Windows zurückzukehren und zu warten.\n*  Drücken Sie STRG+ALT+ENTF erneut, um den Computer neu zu starten. Nicht gespeicherte Daten gehen dabei verloren.',
        en: '*  Press any key to return to Windows and wait.\n*  Press CTRL+ALT+DEL again to restart your computer. You will lose unsaved information in any programs that are running.',
      },
    ],
    prompt: { de: 'Weiter mit beliebiger Taste _', en: 'Press any key to continue _' },
  },
  {
    kind: 'screen',
    id: 'protection',
    tone: 'black',
    lines: [
      {
        de: 'Windows-Schutzverletzung. Sie müssen den Computer neu starten.',
        en: 'Windows protection error. You need to restart your computer.',
      },
      { de: 'System angehalten.', en: 'System halted.' },
    ],
  },
];

export function randomCrash(previous?: string): Crash {
  const pool = crashes.filter((crash) => crash.id !== previous);
  return pool[Math.floor(Math.random() * pool.length)];
}
