import { useState } from 'react';
import { Button, Frame, GroupBox, Monitor, Tab, TabBody, Tabs, TreeView, type TreeLeaf } from 'react95';
import { machine } from '../boot/bootScript';
import { profile } from '../content/profile';
import { DialogFooter } from './DialogFooter';
import type { AppProps } from './types';

const ramMb = (machine.totalMemoryK / 1024).toFixed(1).replace('.', ',');

const devices: TreeLeaf<string>[] = [
  {
    id: 'computer',
    label: 'Computer',
    items: [
      group('Anschlüsse (COM und LPT)', ['Kommunikationsanschluss (COM1)', 'Kommunikationsanschluss (COM2)', 'Druckeranschluss (LPT1)']),
      group('Audio-, Video- und Gamecontroller', ['Creative SB Live! (EMU10K1)', 'Creative Gameport-Joystick']),
      group('CD-ROM', ['CD-ROM-Laufwerk (Sekundär Master)', 'CD-ROM-Laufwerk (Sekundär Slave)']),
      group('Diskettenlaufwerk-Controller', ['Standard-Diskettenlaufwerk-Controller']),
      group('Festplattencontroller', [
        'Intel 82371AB/EB PCI Bus Master IDE Controller',
        'Primärer IDE-Controller (Dual FIFO)',
        'Sekundärer IDE-Controller (Dual FIFO)',
      ]),
      group('Grafikkarten', ['NVIDIA GeForce4 MX 440']),
      group('Laufwerke', ['GENERIC NEC FLOPPY DISK', machine.hddModel]),
      group('Maus', ['PS/2-kompatible Maus']),
      group('Monitore', ['Plug & Play-Monitor']),
      group('Systemkomponenten', [
        'Intel 82443BX Pentium(r) II Processor to PCI Bridge',
        'Intel 82371AB/EB PCI to ISA Bridge',
        'Systemzeitgeber',
        'Numerischer Coprozessor',
      ]),
      group('Tastatur', ['Standardtastatur (101/102 Tasten)']),
      group('USB-Controller', ['Intel 82371AB/EB PCI to USB Universal Host Controller', 'USB-Root-Hub']),
    ],
  },
];

function group(label: string, items: string[]): TreeLeaf<string> {
  return { id: label, label, items: items.map((item) => ({ id: `${label}/${item}`, label: item })) };
}

export function SystemApp({ onClose }: AppProps) {
  const [tab, setTab] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="props-dialog">
      <Tabs value={tab} onChange={(value) => setTab(value as number)}>
        <Tab value={0}>Allgemein</Tab>
        <Tab value={1}>Geräte-Manager</Tab>
        <Tab value={2}>Hardwareprofile</Tab>
        <Tab value={3}>Leistungsmerkmale</Tab>
      </Tabs>
      <TabBody className="props-body">
        {tab === 0 ? (
          <div className="system-general">
            <Monitor backgroundStyles={{ background: '#008080' }}>
              <div className="monitor-logo">
                <img src="/img/win98.png" alt="" width={64} height={64} />
              </div>
            </Monitor>
            <div className="system-facts">
              <p>System:</p>
              <p className="indent">Microsoft Windows 98</p>
              <p className="indent">Zweite Ausgabe</p>
              <p className="indent">4.10.2222 A</p>
              <p>Registriert für:</p>
              <p className="indent">{profile.name}</p>
              <p className="indent">sa85.de</p>
              <p className="indent">23009-OEM-0085085-85085</p>
              <p className="spaced">Computer:</p>
              <p className="indent">GenuineIntel</p>
              <p className="indent">Pentium(r) II-Prozessor, {machine.clock}</p>
              <p className="indent">{ramMb} MB RAM</p>
            </div>
          </div>
        ) : null}
        {tab === 1 ? (
          <div className="stack">
            <Frame variant="field" className="device-tree">
              <TreeView tree={devices} defaultExpanded={['computer']} />
            </Frame>
          </div>
        ) : null}
        {tab === 2 ? (
          <div className="stack">
            <p>
              Hardwareprofile ermöglichen das Auswählen unterschiedlicher Hardwarekonfigurationen beim Starten.
            </p>
            <Frame variant="field" className="profile-list">
              <span className="is-selected">Originalkonfiguration</span>
            </Frame>
            <div className="button-row">
              <Button disabled>Kopieren</Button>
              <Button disabled>Umbenennen</Button>
              <Button disabled>Löschen</Button>
            </div>
          </div>
        ) : null}
        {tab === 3 ? (
          <div className="stack">
            <GroupBox label="Leistungsmerkmale">
              <dl className="facts">
                <dt>Arbeitsspeicher:</dt><dd>{ramMb} MB RAM</dd>
                <dt>Systemressourcen:</dt><dd>85% frei</dd>
                <dt>Dateisystem:</dt><dd>32 Bit</dd>
                <dt>Virtueller Speicher:</dt><dd>32 Bit</dd>
                <dt>Datenträgerkomprimierung:</dt><dd>Nicht installiert</dd>
                <dt>PC-Karten (PCMCIA):</dt><dd>Keine PC-Kartensockel installiert</dd>
              </dl>
              <p>Ihr System ist optimal konfiguriert.</p>
            </GroupBox>
            <GroupBox label="Weitere Einstellungen">
              <div className="button-row">
                {['Dateisystem...', 'Grafik...', 'Virtueller Arbeitsspeicher...'].map((label) => (
                  <Button key={label} onClick={() => setNote(label.replace('...', ''))}>{label}</Button>
                ))}
              </div>
              {note ? <p className="muted">{note}: Die Einstellungen sind bereits optimal gewählt.</p> : null}
            </GroupBox>
          </div>
        ) : null}
      </TabBody>
      <DialogFooter onOk={onClose} onCancel={onClose} />
    </div>
  );
}
