---
name: Boot-Menü-Erweiterung
overview: Das Award-CMOS-Setup (v4.51PG-Fiktion) wird von einem fast leeren Menü zu einem glaubwürdigen Setup mit echten Unterseiten. Kern ist die Boot-Sequenz (Default = Projekt-Festplatte ST34311A); falsche Reihenfolge oder entfernte Platte blockiert Windows mit Award-Meldung und PC-Speaker-Piep. Dazu USB-HDD/USB-ZIP inkl. lesendem Directory-Picker, Quick Boot, Floppy Seek, NumLock, Passwort, Defaults sowie zurückhaltende Easter Eggs — alles retro, nichts verspielt.
todos:
  - id: setup-shell
    content: BiosSetup-Unterseiten-Framework (Enter öffnet, ESC zurück, gelbe Auswahl, Item-Help-Zeile, Save-Confirm-Dialoge)
    status: completed
  - id: bios-features
    content: BIOS FEATURES SETUP inkl. Boot Sequence, Quick POST, Floppy Seek, NumLock, Virus Warning, Security Option
    status: completed
  - id: boot-fail
    content: bootfail-Phase bei nicht bootfähiger Reihenfolge/entferntem HDD; Award-Text DISK BOOT FAILURE… plus playDiskBootFailureBeep
    status: completed
  - id: usb-boot
    content: USB-HDD/USB-ZIP in Boot Sequence inkl. Bestätigungsdialog an BIOS-FEATURES-Stelle; showDirectoryPicker mode read; Fallback; Startpfad js-dos/v86 laut Inhaltsliste
    status: completed
  - id: post-hooks
    content: BootScreen an CMOS koppeln (Quick Boot kürzt Memory-Test, Floppy Seek hörbar/animiert, Setup-Prompt ein/aus)
    status: completed
  - id: standard-cmos
    content: STANDARD CMOS SETUP mit Datum/Zeit und Laufwerken aus machine; IDE HDD AUTO DETECTION steuert hddPresent
    status: completed
  - id: more-pages
    content: Power Management, PnP/PCI, Chipset, Integrated Peripherals, Passwort-Dialoge, Load Defaults, Save/Exit-Confirm
    status: completed
  - id: easter-eggs
    content: Zurückhaltende Easter Eggs (Welcome-Dialog, OEM-Passwort, Virus-Warning-Text, seltener CMOS Checksum)
    status: completed
  - id: wire
    content: settings.cmos persistieren, App.tsx-Phasen, ScanDisk belassen, Typecheck und Browser-Test aller Boot-Pfade
    status: completed
isProject: false
---

# Erweiterung des Boot-Menüs (Award CMOS Setup)

## Ausgangslage (Ist-Stand im Repo)
- **Phasen:** [src/App.tsx](src/App.tsx) — `power` → `black` → `post` → (`setup` | `scandisk`) → `summary` → `splash` → `desktop`; dazu `shutdown` / `dos`.
- **POST:** [src/boot/BootScreen.tsx](src/boot/BootScreen.tsx) spielt das Skript aus [src/boot/bootScript.ts](src/boot/bootScript.ts) ab: Award-Header (`Award Modular BIOS v4.51PG, An Energy Star Ally`), CPU-Zeile, **Memory Test** 0…65536K OK (rAF), PnP-Zeilen, IDE Primary Master `ST34311A`, Slave mit `[Press F4 to skip]`, Footer `Press DEL to enter SETUP` + BIOS-ID. Logos: [src/boot/BoardLogo.tsx](src/boot/BoardLogo.tsx), [src/boot/EnergyStarLogo.tsx](src/boot/EnergyStarLogo.tsx) (`/img/energy-star.png`).
- **Setup:** [src/boot/BiosSetup.tsx](src/boot/BiosSetup.tsx) — zweispaltiges Award-"CMOS SETUP UTILITY", Navigation Pfeiltasten, Styles `.setup-screen` / `.setup-item.is-selected` in [src/index.css](src/index.css). Menülabels aus `setupMenu` in `bootScript.ts`.
- **Nur ein funktionaler Punkt:** `MICROSOFT SCANDISK` → [src/boot/ScanDisk.tsx](src/boot/ScanDisk.tsx). `SAVE & EXIT` / `EXIT WITHOUT SAVING` / ESC / F10 rufen nur `onExit` → `boot(false)`. Übrige Einträge sind tote Labels.
- **Overlay:** Fester Dialog „Welcome to the 90s…“ blockiert faktisch die Nutzung echter Unterseiten.
- **System Summary:** [src/boot/SystemSummary.tsx](src/boot/SystemSummary.tsx) — Box mit CPU/Memory/IDE, PCI-Listing, `Verifying DMI Pool Data ……` (Punkte-Animation). Entspricht dem klassischen Award-/Phoenix-Summary nach POST.
- **Hardware-Fiktion:** `machine.hddModel` = `ST34311A` (4327 MB) = Desktop-Laufwerk `(C:)` in [src/apps/explorer/folders.ts](src/apps/explorer/folders.ts) / [src/apps/SystemApp.tsx](src/apps/SystemApp.tsx).
- **Audio:** [src/audio/audio.ts](src/audio/audio.ts) — `bios-startup.mp3`, Lüfter, `tone()` (Rechteckwelle); kein Disk-Boot-Failure-Piep. **Settings:** [src/settings/settings.ts](src/settings/settings.ts) ohne CMOS-Felder.

## Historischer Kontext (Award / AMI / Phoenix)
Das Projekt bildet bewusst **Award Modular BIOS ~v4.51PG** nach (Textzeilen, blaues Setup, Energy-Star-Ally). Zum Abgrenzen und für glaubwürdige Details:

| Familie | Typisches Look & Feel | Setup-Einstieg | Boot-Optionen |
|---------|----------------------|----------------|---------------|
| **Award** (hier Zielbild) | Schwarzer POST, cyan/weiß; Setup tiefblau `#0000AA`, gelbe Selection, zweispaltiges Hauptmenü | `Press DEL to enter SETUP` | Älter: `Boot Sequence` A,C / C,A; neuer (4.5x+): First/Second/Third Boot Device; Quick Power-On Self Test; Boot Up Floppy Seek; Boot Up NumLock; Virus Warning; Security Option Setup/System |
| **AMI** (AMIBIOS) | Oft grau/blau HIFLEX, andere Menünamen | `Hit DEL if you want to run setup` | Quick Boot; 1st/2nd/3rd Boot Device; Floppy Drive Seek; BootUp Num-Lock; Password Check; Optimal/Fail-Safe Defaults |
| **Phoenix** (4.0 / später Phoenix-Award) | Graue Tab-UI oder QuietBoot-Grafik; MultiBoot „Boot First Menu“ | Setup prompt ein/aus; ESC/F2 je nach OEM | Boot sequence A then C / C then A; Floppy check; Summary screen; POST Errors |

**Quellen (kurz):**
- Award CMOS Setup / Features: [Award BIOS 4.50 Guide (arxvaldex)](https://www.arxvaldex.com/pb/files/manuals/BIOS/450GEN.pdf), [dosdays Award generic PDF](https://dosdays.co.uk/media/award/bios-award-generic.pdf) (Fehlertexte inkl. `DISK BOOT FAILURE, INSERT SYSTEM DISK AND PRESS ENTER`), Mainboard-Manual z. B. [RetroWeb 6EMM BIOS](https://theretroweb.com/motherboard/manual/6emm-10-1-may0598-b-61b34e03ef583416088547.pdf).
- AMI: [MSI AMIBIOS User's Guide](https://www.gdt.id.au/~gdt/manuals/msi-6178/e61781-10c/6178-4.pdf) (Hit DEL, Advanced CMOS, Quick Boot, Boot Devices).
- Phoenix: [PhoenixBIOS 4.0 Rev. 6 User's Manual (bitsavers)](https://bitsavers.org/pdf/phoenix/PhoenixBIOS_4.0_Users_Manual_2000.pdf) (Boot Options, Setup prompt, Floppy seek, Summary screen, QuietBoot/MultiBoot).

Wir **wechseln nicht** zu AMI/Phoenix-UI — nur Optionen und Verhaltensdetails übernehmen, die Award-Nutzer 1998–2000 erwartet hätten.

## Ziele
1. Mehrere Setup-Punkte **originalgetreu** animieren und funktional machen (nicht nur Labels).
2. **Boot-Reihenfolge** steuert den echten Boot: Default = Projekt-Festplatte; sonst kein Windows.
3. Bei Fehlboot: Award-Meldung + PC-Speaker-Fehlerton.
4. CMOS-Schalter wirken spürbar auf den **POST** (Quick Boot, Floppy Seek, Prompt).
5. Zurückhaltende Easter Eggs — retro, nicht verspielt.
6. **USB-Boot** in der Boot Sequence (Award-typisch), mit Browser-Zustimmung und nur lesendem Dateizugriff.

---

## 1. Unterseiten-Framework in `BiosSetup`
- Zustand `view: 'main' | pageId`; Enter öffnet, ESC zurück zum Hauptmenü; F10 = Save & Exit (mit Confirm).
- Layout beibehalten: Titel `ROM PCI/ISA BIOS (2A69KA1J)` / `CMOS SETUP UTILITY` / `AWARD SOFTWARE, INC.`, Fuß `Esc : Quit` / `↑↓←→ : Select Item` / auf Unterseiten zusätzlich `Pu/Pd/+/- : Modify`, `F1 : Help` (optional Item-Help unten, wie Phoenix Item Specific Help — bei Award oft Statuszeile).
- Save/Exit-Confirm wie Original: kleines Doppelrahmen-Fenster „SAVE to CMOS and EXIT (Y/N)?“ bzw. „Quit Without Saving (Y/N)?“.
- ScanDisk-Pfad unverändert (`onScanDisk`).
- Welcome-Dialog nur noch als Easter Egg (erster Besuch oder Konami), damit Unterseiten bedienbar sind.

## 2. `BIOS FEATURES SETUP` — Kernseite
Zweispaltige Feldliste (Award-Stil), Werte per `+/-` oder PgUp/PgDn:

| Option | Default | Wirkung im Projekt |
|--------|---------|-------------------|
| **Virus Warning** | Disabled | Enabled: beim nächsten „Boot“ einmalig Award-Warntext `! WARNING ! Disk boot sector is to be modified…` (nur kosmetisch / Pause mit Y/N) |
| **CPU Internal/External Cache** | Enabled | Anzeige; Disabled → kurzer Hinweis im Summary „Cache Disabled“ |
| **Quick Power On Self Test** | Enabled | **Koppelt an POST:** Enabled kürzt `memoryDurationMs` und IDE-Delays in [src/boot/BootScreen.tsx](src/boot/BootScreen.tsx); Disabled = heutiges langsames Hochzählen |
| **First / Second / Third Boot Device** | HDD-0 / CDROM / Floppy | Steuert Boot-Erfolg (Abschnitt 3); zusätzlich Award-Werte `USB-HDD` / `USB-ZIP` (siehe unten + Abschnitt 7) |
| **Boot Up Floppy Seek** | Enabled | Enabled: kurzes Floppy-Seek-Geräusch (`tone` oder bestehendes Seek-Feeling) + 200–400 ms Pause nach Memory-Test; Disabled = überspringen (wie Phoenix „Floppy check“) |
| **Boot Up NumLock Status** | On | Merkt `cmos.numLock`; optional Taskleisten-/Desktop-Hinweis oder nur CMOS-Echo (Browser kann echte NumLock selten setzen) |
| **Gate A20 Option** | Fast | Rein kosmetisch |
| **Typematic Rate/Delay** | Disabled / 6 / 250 | Optional: beeinflusst Tastatur-Wiederholung nur im Setup selbst |
| **Security Option** | Setup | Setup = Passwort nur für DEL-Setup; System = zusätzlich Boot-Prompt vor Windows |

**Default Boot Device = `HDD-0`** (= `machine.hddModel` / C:), damit Besucher ohne Setup-Besuch unverändert Windows erreichen.

### Boot Sequence / USB an dieser Setup-Stelle
Die Boot-Geräte-Liste auf dieser Unterseite (First/Second/Third bzw. ältere Award-`Boot Sequence`) ist der **Einstellort** für USB:

- Per `+/-` / PgUp/PgDn erscheinen u. a. `HDD-0`, `Floppy`, `CDROM`, **`USB-HDD`**, **`USB-ZIP`**, `Disabled` (Award-typische USB-Einträge der späteren 4.5x-/Phoenix-Award-Ära).
- Setzt der Nutzer z. B. First = `USB-HDD` und speichert, wertet der nächste Boot diese Wahl aus (Abschnitt 3 + 7): Zuerst der **BIOS-Zustimmungsdialog** („Zugriff auf USB-Stick erlauben?“), Bestätigung per Klick oder Enter — das simulierte „Stick einstecken“ und zugleich die erforderliche Nutzergeste.
- Erst danach `showDirectoryPicker({ mode: 'read' })` (nur Lesen). Abbruch des Dialogs oder des Pickers → wie leeres USB-Laufwerk → `bootfail`.
- Optional dieselbe Bestätigung schon **probeweise** aus der Boot-Priority-Zeile heraus (Enter auf dem USB-Eintrag = „Detect USB device…“), ohne SAVE — analog IDE Auto Detection; wirksam für den Windows-/Alternativ-Boot bleibt trotzdem nur SAVE & EXIT.
- Durchgängiger Ablauf: **BIOS FEATURES (hier) → SAVE → Zustimmungsdialog → Picker → Inhalt starten oder Failure** (Details und Formate: Abschnitte 7–8).

## 3. Boot-Reihenfolge → Windows oder Failure
**Regel:** Phasen `summary` → `splash` → `desktop` nur, wenn das erste *wirksame* bootfähige Gerät die Systemplatte ist (`hddPresent && first usable === 'HDD-0'`).

Blockiert Windows:
- First = Floppy oder CDROM (Simulation: Laufwerke immer leer / kein System).
- First = `USB-HDD` / `USB-ZIP` ohne erfolgreichen lesenden Picker (Abschnitt 7) → ebenfalls Failure.
- Sequenz ohne HDD-0 / First = Disabled.
- `hddPresent: false` (IDE Auto Detection „None“ oder HDD aus Priority entfernt).

Ablauf nach SAVE & EXIT:
1. Optional kurzer POST-Nachlauf oder direkt Fehlerphase.
2. Neue Phase `bootfail` in [src/App.tsx](src/App.tsx): schwarzer `.bios-screen`, VGA-Font.
3. **Award-Originaltext:**

> DISK BOOT FAILURE, INSERT SYSTEM DISK AND PRESS ENTER

   (Quelle: Award POST Error Messages, dosdays Award-PDF.)  
   Variante bei First=Floppy optional: `Non-System disk or disk error` / `Replace and strike any key when ready` (DOS/IBM-Floppy-Pfad) — klar kennzeichnen, nicht vermischen.

4. Enter → zurück zu `setup` (oder POST), damit man korrigieren kann. Escape-Skip-to-Desktop in `bootfail` **aus** (oder nur versteckter Chord), sonst entfällt das Gimmick.

## 4. BIOS-Fehler-Piep
- `playDiskBootFailureBeep()` in [src/audio/audio.ts](src/audio/audio.ts) via `tone()` (Rechteck ~1 kHz).
- Muster: ein längerer Piep oder kurze Wiederholschleife, bis Enter — an POST-Beep-Codes angelehnt, ohne MP3.
- Lautstärke: `effectiveVolume()` / Mute.

## 5. POST an CMOS koppeln (Animationen & Hinweise)
Bereits vorhanden und bewusst **beibehalten/verfeinern**:
- Memory-Zähler (`formatMemory`, rAF) — Tempo über Quick Boot.
- Energy-Star-Logo + Board-Logo.
- `Press DEL to enter SETUP` + BIOS-Datumszeile — abschaltbar analog Phoenix „Setup prompt“ / AMI „Hit DEL Message Display“ als Option `Show Setup Prompt` in Features (Default Enabled).
- IDE-Detect-Zeilen; F4 skip Slave.
- Summary mit DMI-Punkten — abschaltbar analog Phoenix „Summary screen“ (Default Enabled; Disabled → nach POST direkt Splash, wenn bootfähig).

Neu / schärfen:
- Einmaliger POST-OK-Piep beim Memory-Test-Ende (Web-Audio, wie im Portfolio-Plan skizziert), getrennt vom Failure-Piep.
- Floppy-Seek-Animation: kurze Zeile `Floppy drive(s) seek …` oder nur akustisch.
- DEL akzeptieren während Memory-Test und danach (wie jetzt: `setupRequested` + `selfTestDone`) — Zeitfenster dokumentieren, nicht verkleinern.

## 6. Weitere Menüpunkte (Priorität)
| Menüpunkt | Umsetzung |
|-----------|-----------|
| `STANDARD CMOS SETUP` | Date/Time aus Browser; Drive A `1.44M, 3.5 in.`; Drive B None; IDE Pri Master Typ/Größe aus `machine`; Halt On All Errors (kosmetisch) |
| `CHIPSET FEATURES SETUP` | Read-only/wenige Toggles (SDRAM Timing aus `machine.sdramRows`) |
| `POWER MANAGEMENT SETUP` | Green PC / Power Management = Enabled; Doze/Standby/Suspend Zeiten; optional Brücke zur späteren Energieverwaltung |
| `PNP/PCI CONFIGURATION` | Resources Controlled By = Auto; PCI-IRQ-Tabelle an Summary-Devices angelehnt |
| `INTEGRATED PERIPHERALS` | Onboard IDE, Floppy Controller, Serial/Parallel aus `machine` |
| `LOAD BIOS DEFAULTS` / `LOAD SETUP DEFAULTS` | Confirm Y/N; setzt `cmos` zurück (BIOS = fail-safe/konservativ, Setup = „optimized“ inkl. Quick Boot On) — analog AMI Optimal/Fail-Safe, aber Award-Wortlaut behalten |
| `SUPERVISOR` / `USER PASSWORD` | Enter Password-Dialog; leeres Feld = clear; Security Option greift |
| `IDE HDD AUTO DETECTION` | Animiertes Detecting…; Ergebnis `ST34311A` oder None → `hddPresent` |
| `MICROSOFT SCANDISK` | Unverändert |
| `SAVE & EXIT` / `EXIT WITHOUT SAVING` | Confirm; Save wertet Boot-Order aus |

## 7. USB-Boot (`USB-HDD` / `USB-ZIP`)
Award-Boards der späten 90er/frühen 2000er listeten in der Boot Sequence oft **USB-HDD** und **USB-ZIP** neben Floppy/HDD/CDROM. Diese Werte kommen in First/Second/Third Boot Device dazu (Default bleibt HDD-0; USB nicht vorausgewählt).

### Ablauf in der Web-App
1. Nutzer setzt z. B. First Boot Device = `USB-HDD` (oder `USB-ZIP`) und speichert mit SAVE & EXIT.
2. Beim „Boot von USB“ erscheint ein **BIOS-artiger Zustimmungsdialog** (blaues Setup-Fenster, VGA-Font): sinngemäß, ob der Zugriff auf den USB-Stick erlaubt wird. Bestätigung per Klick auf OK oder Enter; Abbruch = Esc / Nein.
3. **Erst nach Bestätigung** ruft die App `window.showDirectoryPicker({ mode: 'read' })` auf (File System Access API). Nur Lesen — kein `readwrite`, keine Schreibversuche auf den Stick.
4. Erfolgreicher Picker: Verzeichnisinhalt nur lesen (Dateiliste / „bootfähige“ Dateien prüfen oder als Gimmick anzeigen). Ob daraus ein echter Alternativ-Boot (z. B. Mini-DOS) folgt, bleibt optional; Minimum ist glaubwürdige Erkennung + Weiterboot oder kontrollierter Failure.
5. Picker abgebrochen oder leer → Verhalten wie **kein bootfähiges Gerät** (Phase `bootfail`, Abschnitt 3).

### Technische Fakten (Browser)
- Ein Browser kann das **physikalische Einstecken** eines Sticks nicht erkennen. Das „Einstecken“ ist daher eine **simulierte Aktion** bzw. der Bestätigungsdialog selbst (die Nutzergeste).
- `showDirectoryPicker` braucht eine **aktive Nutzergeste** — Klick/Enter im Dialog liefert sie; Aufruf ohne Geste scheitert.
- API nur über **HTTPS** und in **Chromium-Desktop** (Chrome, Edge, Opera). Nicht in Firefox/Safari in gleicher Form.
- **Fallback Firefox/Safari:** `input type="file"` mit `webkitdirectory` (nur lesend, einmalige Auswahl) **oder** originalgetreue Meldung, dass kein USB-Gerät gefunden wurde → `bootfail`.
- **iPhone/iPad:** USB-Boot irrelevant — Menüpunkt ausblenden oder kurz als „N/A“ führen, keinen Picker anbieten.
- **WebUSB ist keine Option:** Chrome sperrt Massenspeicher-Klassen; Stick-Dateisystem darüber nicht nutzbar.

Technik-Hinweis: kleine Hilfsfunktion z. B. in `src/boot/usbBoot.ts` (Feature-Detect `showDirectoryPicker`, Dialog-Komponente im Setup-/BIOS-Look, Fallback-Input versteckt). Anbindung in [src/App.tsx](src/App.tsx) beim Auswerten der Boot-Order nach SAVE & EXIT / POST. Der Bestätigungsdialog gehört fachlich zur Boot-Sequence in Abschnitt 2; dieser Abschnitt beschreibt den Laufzeitpfad.

### Was der Emulator im Projekt heute kann
Ist-Stand laut [public/dos/index.html](public/dos/index.html), [src/apps/DosApp.tsx](src/apps/DosApp.tsx), [src/content/dosGames.ts](src/content/dosGames.ts):
- **js-dos 8** (DOSBox-Backend): akzeptiert **`.zip`** und **`.jsdos`**. Bundles mit `.jsdos/dosbox.conf` starten direkt; sonstige ZIPs werden mit generierter `dosbox.conf` + `initFs` gemountet (EXE/COM/BAT im Archiv).
- **Kein natives Booten von `.img` / `.iso` / Roh-Floppy** in der aktuellen DOS-Box — solche Images brauchen einen zweiten Pfad.
- **v86** ([copy/v86](https://github.com/copy/v86), Demo [copy.sh/v86](https://copy.sh/v86/)): sinnvoll als **optionale** Phase für echte Disketten-/USB-Images und kleine Fremd-OS (KolibriOS, FreeDOS-IMG, Boot-Sector). Nicht einbauen, bevor der js-dos-Pfad für ZIP/JSDOS auf dem Stick steht; WebUSB bleibt tabu.

Start-Logik nach erfolgreichem Picker (Vorschlag):
1. Im Stick-Verzeichnis nach `.jsdos` / `.zip` mit DOS-Programm suchen → bestehende js-dos-Pipeline (`Dos` / `DosMode`).
2. Sonst `.img` / `.flp` / 512-Byte-Bootsector → optional v86; fehlt v86 → klare BIOS-Zeile „Unsupported boot media“ / `bootfail`.
3. Nichts Passendes → `DISK BOOT FAILURE…`.

## 8. Bootbare Inhalte für den USB-Test
Nur **Freeware, Shareware, Public Domain oder Open Source** — offizielle bzw. vom Rechteinhaber autorisierte Spiegel. Jeder Direktlink wurde per HTTP-Abruf geprüft (Status 200, Dateiinhalt). Keine kommerziellen Abandonware-Shops.

| # | Name | Was | Lizenz | Download (geprüft) | Format auf dem Stick | Start im Plan |
|---|------|-----|--------|--------------------|----------------------|---------------|
| 1 | **FreeDOS 1.4 LiteUSB** | Freies DOS-System (Installer-/Live-USB-Image) | GPL (FreeDOS-Projekt) | https://download.freedos.org/1.4/FD14-LiteUSB.zip (Seite: https://www.freedos.org/download/) | ZIP → darin `FD14LITE.IMG` auf den Stick legen | **v86** mit Floppy/HDD-Image; ZIP allein startet in js-dos nicht als OS |
| 2 | **KolibriOS** (Nightly Floppy) | Win95-artiges Asm-OS, passt auf eine Diskette | GPLv2 | https://builds.kolibrios.org/en_US/latest-img.7z (Übersicht: https://kolibrios.org/en/download) | `.7z` entpacken → `kolibri.img` (o. ä.) auf den Stick | **v86** (`fda`/`hda` = IMG); nicht js-dos |
| 3 | **Doom v1.9 Shareware** | Episode 1 „Knee-Deep in the Dead“ | Shareware (id Software) | https://ftp.gwdg.de/pub/misc/ftp.idsoftware.com/idstuff/doom/doom19s.zip (historischer id-FTP-Spiegel) | `doom19s.zip` unverändert oder entpackt als Ordner | **js-dos**: ZIP laden, `DOOM.EXE` (wie bestehendes `doom1` in `dosGames.ts`) |
| 4 | **Commander Keen 1** | „Marooned on Mars“, Shareware-Episode | Shareware (id/Apogee; Weitergabe laut Legacy-3D-Realms erlaubt) | https://ftp.funet.fi/pub/msdos/games/apogee/1keen.zip | `1keen.zip` | **js-dos** → `KEEN1.EXE` (entspricht bestehendem Keen-Eintrag) |
| 5 | **One Must Fall: 2097** (Shareware) | Robot-Kampfspiel, offizielle SW-Episode | Shareware / später Freeware der Vollversion; SW-Paket vom Projektwiki | https://www.omf2097.com/pub/files/omf/omf21sw.zip (Wiki: https://www.omf2097.com/wiki/doku.php?id=download) | `omf21sw.zip` | **js-dos** → `OMF.EXE` / Setup im Archiv |
| 6 | **Tyrian 2.1 Daten** (Freeware-Basis) | Vertikal-Shooter; Autor gab Tyrian 2000 später als Freeware frei; Datenpaket für OpenTyrian/DOS | Freeware (Jason Emery / Community-Spiegel) | https://camanis.net/tyrian/tyrian21.zip | `tyrian21.zip` | **js-dos** → `TYRIAN.EXE` (ähnlich `tyrian2k` im Repo) |
| 7 | **Duke Nukem 1 Shareware** | Episode 1 der Apogee-Trilogie | Shareware (3D Realms/Apogee-FTP-Spiegel) | https://ftp.zx.net.nz/pub/mirror/ftp.3drealms.com/share/1duke.zip | `1duke.zip` | **js-dos** → Duke-EXE im Archiv |
| 8 | **BootChess** (Red Sector Inc.) | Schach im 512-Byte-Bootsector + DOS-.COM | WTFPL v2 (Baudsurfer/RSi) | http://olivier.poudade.free.fr/arc/BootChess.zip | ZIP enthält u. a. `BootChess.img`, `.com`, `.bin` — IMG oder COM auf den Stick | **v86** mit `BootChess.img` **oder** **js-dos** mit `BootChess.com` / `.zip` |
| 9 | **bootOS** (nanochess) | Minimales Bootsector-OS (512 Byte) | BSD-2-Clause (Oscar Toledo) | https://raw.githubusercontent.com/nanochess/bootOS/master/os.img (Repo: https://github.com/nanochess/bootOS) | `os.img` (512 Byte) | **v86** als Floppy-Image; nicht js-dos |

**Hinweise zur Nutzung:** Stick unter Chromium/HTTPS als First Boot Device wählen (Abschnitt 2/7), Dialog bestätigen, Ordner mit einer der Dateien oben freigeben. Für reine ZIP-Spiele reicht der vorhandene js-dos-Stack; für FreeDOS/Kolibri/bootOS/BootChess-IMG ist v86 (oder ein späterer Image-Pfad) nötig. **MenuetOS** (https://www.menuetos.net/download.htm, Seite erreichbar) wäre thematisch passend (Menuet32 GPL), direkte Binär-URLs waren hier per Abruf nicht stabil verifizierbar (SourceForge 403) — daher nicht in der Tabelle, optional nachziehbar.

## 9. Cooles, aber retro-treu
Leitplanke: wirkt wie vergessenes OEM-Detail, nicht wie Minispiel-Sammlung.

1. **Welcome-Dialog** nur nach Konami oder geheimen F10+F10 — sonst weg vom Hauptmenü.
2. **Supervisor-Passwort `sa85` / `90s`:** öffnet schlichte OEM-Seite (BIOS-String, Build, Credits) in VGA-Text — kein buntes UI.
3. **Virus Warning Enabled** + „Schreiben“ simulieren: originaler Award-Warnblock, Y/N.
4. **Seltener CMOS CHECKSUM ERROR** nach absichtlichem Corrupt-Flag → erzwungene Defaults (klassischer Schock).
5. **Floppy-First-Failure:** Enter auf Failure-Screen startet optional 10-Sekunden „Insert system disk“-Warteschleife mit blinkendem Cursor — kein Score, kein Highscore.
6. **IDE Detection 1:50:** erkennt kurz `QUANTUM FIREBALL` → bootfail bis Defaults.
7. **F4 auf bootfail:** stoppt nur den Piep-Loop (Echo der POST-Zeile).
8. **Phoenix MultiBoot light (optional, versteckt):** während POST `Esc` öffnet einmalig textbasiertes „Boot Menu“ (HDD-0 / CDROM / Floppy) ohne Setup — nur wenn Feature-Flag; optisch Award-schwarz, nicht Phoenix-grau.

## Ablauf
```mermaid
flowchart TD
  power[PowerScreen] --> post[BootScreen POST]
  post -->|DEL| setup[BiosSetup]
  post -->|fertig und bootfähig| summary[SystemSummary]
  post -->|fertig und nicht bootfähig| fail[bootfail]
  setup --> features[BIOS FEATURES u.a.]
  features -->|SAVE HDD-0 first| post
  features -->|SAVE falsch / kein HDD| fail
  fail -->|Enter| setup
  setup -->|SCANDISK| scan[ScanDisk]
  scan --> summary
  summary --> splash[Splash] --> desktop[Desktop]
```

## Neue Einstellungen in `settings.ts`
```ts
cmos: {
  bootOrder: ['HDD-0', 'CDROM', 'Floppy'], // wählbar u. a. USB-HDD, USB-ZIP
  hddPresent: true,
  quickBoot: true,
  floppySeek: true,
  numLock: true,
  virusWarning: false,
  showSetupPrompt: true,
  showSummary: true,
  securityOption: 'setup' | 'system',
  supervisorPassword: string | null,
  // …
}
```
Defaults so wählen, dass **Erstbesucher ohne DEL** denselben Weg wie heute sehen (voller oder Quick-POST → Summary → Splash → Desktop).

## Prüfung
`npm run typecheck`. Manuell:
1. Kaltstart ohne Setup → Windows wie bisher.
2. DEL → BIOS FEATURES → First=Floppy → SAVE → `DISK BOOT FAILURE…` + Piep → Enter → First=HDD-0 → SAVE → Splash/Desktop.
3. Quick Boot Off → spürbar längerer Memory-Test; Floppy Seek Off → kein Seek-Pause.
4. IDE Auto Detection → None → Failure; Load Setup Defaults → wieder bootfähig.
5. In BIOS FEATURES First=`USB-HDD` setzen → SAVE → Zustimmungsdialog → Enter → Directory-Picker (Chromium/HTTPS); Abbruch → `bootfail`. Stick mit z. B. `doom19s.zip` → js-dos; mit `BootChess.img` → v86-Pfad oder kontrollierte Ablehnung. Firefox/Safari-Fallback; iOS ohne USB-Punkt.
6. ScanDisk, EXIT WITHOUT SAVING, Escape-Skip auf normalen Phasen regressen; Escape auf `bootfail` blockiert.

## Umsetzungshinweise
- CMOS liegt nicht in `settings.cmos`, sondern in einem eigenen Store `sa85-cmos` ([src/boot/cmos.ts](src/boot/cmos.ts)) mit 16-Bit-Prüfsumme; so bleibt `settings.ts` (Systemsteuerung) unberührt und ein abgebrochener Schreibvorgang führt glaubwürdig zu `CMOS checksum error - Defaults loaded`.
- USB-Inhalte: `.jsdos`/ZIP/Programmordner → js-dos (`/dos/index.html?mode=usb`), `img`/`ima`/`flp`/`iso` sowie ZIP mit genau einem Image → v86 mit SeaBIOS (LGPL, `public/firmware`). `.7z` wird nicht entpackt.
