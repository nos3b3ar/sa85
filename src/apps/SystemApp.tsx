import { useMemo, useState } from 'react';
import { Button, Frame, GroupBox, Monitor, Tab, TabBody, Tabs, TreeView, type TreeLeaf } from 'react95';
import { machine } from '../boot/bootScript';
import { profile } from '../content/profile';
import { updateSettings, useSettings, type Look } from '../settings/settings';
import { lookInfo } from '../styles/themes';
import { useT, type Messages } from '../i18n';
import { DialogFooter } from './DialogFooter';
import { LookPicker } from './shared/LookPicker';
import type { AppProps } from './types';

const ramMb = (machine.totalMemoryK / 1024).toFixed(1).replace('.', ',');

function buildDevices(t: Messages): TreeLeaf<string>[] {
  const { groups, devices } = t.system;
  return [
    {
      id: 'computer',
      label: 'Computer',
      items: [
        group('ports', groups.ports, [devices.com(1), devices.com(2), devices.lpt]),
        group('media', groups.media, ['Creative SB Live! (EMU10K1)', 'Creative Gameport-Joystick']),
        group('cdrom', groups.cdrom, [devices.cdMaster, devices.cdSlave]),
        group('floppy', groups.floppy, [devices.floppy]),
        group('hdd', groups.hdd, ['Intel 82371AB/EB PCI Bus Master IDE Controller', devices.ide1, devices.ide2]),
        group('display', groups.display, ['NVIDIA GeForce4 MX 440']),
        group('drives', groups.drives, ['GENERIC NEC FLOPPY DISK', machine.hddModel]),
        group('mouse', groups.mouse, [devices.mouse]),
        group('monitors', groups.monitors, [devices.monitor]),
        group('system', groups.system, [
          'Intel 82443BX Pentium(r) II Processor to PCI Bridge',
          'Intel 82371AB/EB PCI to ISA Bridge',
          devices.timer,
          devices.fpu,
        ]),
        group('keyboard', groups.keyboard, [devices.keyboard]),
        group('usb', groups.usb, ['Intel 82371AB/EB PCI to USB Universal Host Controller', 'USB-Root-Hub']),
      ],
    },
  ];
}

function group(id: string, label: string, items: string[]): TreeLeaf<string> {
  return { id, label, items: items.map((item, index) => ({ id: `${id}/${index}`, label: item })) };
}

export function SystemApp({ onClose }: AppProps) {
  const t = useT();
  const devices = useMemo(() => buildDevices(t), [t]);
  const settings = useSettings();
  const [tab, setTab] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [look, setLook] = useState<Look>(settings.look);
  const info = lookInfo[settings.look];
  const apply = () => updateSettings({ look });

  return (
    <div className="props-dialog">
      <Tabs value={tab} onChange={(value) => setTab(value as number)}>
        {t.system.tabs.map((label, index) => (
          <Tab key={label} value={index}>
            {label}
          </Tab>
        ))}
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
              <p>{t.system.system}</p>
              <p className="indent">{info.name}</p>
              {info.edition ? <p className="indent">{info.edition}</p> : null}
              <p className="indent">{info.build}</p>
              <p>{t.system.registeredTo}</p>
              <p className="indent">{profile.name}</p>
              <p className="indent">sa85.de</p>
              <p className="indent">23009-OEM-0085085-85085</p>
              <p className="spaced">{t.system.computer}</p>
              <p className="indent">GenuineIntel</p>
              <p className="indent">{t.system.processor(machine.clock)}</p>
              <p className="indent">{t.system.ram(ramMb)}</p>
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
            <p>{t.system.profilesText}</p>
            <Frame variant="field" className="profile-list">
              <span className="is-selected">{t.system.originalConfig}</span>
            </Frame>
            <div className="button-row">
              <Button disabled>{t.system.copy}</Button>
              <Button disabled>{t.system.rename}</Button>
              <Button disabled>{t.system.delete}</Button>
            </div>
          </div>
        ) : null}
        {tab === 3 ? (
          <div className="stack">
            <GroupBox label={t.system.performance}>
              <dl className="facts">
                <dt>{t.system.memory}</dt><dd>{t.system.ram(ramMb)}</dd>
                <dt>{t.system.resources}</dt><dd>{t.system.resourcesValue}</dd>
                <dt>{t.system.fileSystem}</dt><dd>{t.system.bits}</dd>
                <dt>{t.system.virtualMemory}</dt><dd>{t.system.bits}</dd>
                <dt>{t.system.compression}</dt><dd>{t.system.notInstalled}</dd>
                <dt>{t.system.pcCards}</dt><dd>{t.system.noPcCards}</dd>
              </dl>
              <p>{t.system.optimal}</p>
            </GroupBox>
            <GroupBox label={t.system.advanced}>
              <div className="button-row">
                {t.system.advancedButtons.map((label) => (
                  <Button key={label} onClick={() => setNote(label.replace('...', ''))}>{label}</Button>
                ))}
              </div>
              {note ? <p className="muted">{t.system.advancedNote(note)}</p> : null}
            </GroupBox>
          </div>
        ) : null}
        {tab === 4 ? <LookPicker name="system-look" value={look} onChange={setLook} /> : null}
      </TabBody>
      <DialogFooter
        onOk={() => {
          apply();
          onClose();
        }}
        onCancel={onClose}
        onApply={apply}
        applyDisabled={look === settings.look}
      />
    </div>
  );
}
