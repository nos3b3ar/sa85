import { MicrosoftNetwork } from '@react95/icons/MicrosoftNetwork';
import { Network3 } from '@react95/icons/Network3';
import { Network } from '@react95/icons/Network';
import { Nwnp32PrinterIcon } from '@react95/icons/Nwnp32PrinterIcon';
import { Rnaui101 } from '@react95/icons/Rnaui101';
import { useEffect, useState, type ComponentType } from 'react';
import { Button, Checkbox, Frame, GroupBox, Radio, Select, Tab, TabBody, Tabs, TextInput } from 'react95';
import { useT, type Messages } from '../i18n';
import { getSettings, updateSettings, type NetworkIdentity } from '../settings/settings';
import { useOnline } from './browser/connection';
import { DialogFooter } from './DialogFooter';
import { MessageDialog, SubDialog } from './shared/SubDialog';
import type { AppProps } from './types';

type ComponentId = keyof Messages['network']['components'];

const components: { id: ComponentId; icon: ComponentType<{ variant?: '16x16_4' }> }[] = [
  { id: 'client', icon: MicrosoftNetwork },
  { id: 'dialup', icon: Rnaui101 },
  { id: 'realtek', icon: Network3 },
  { id: 'tcpDialup', icon: Network },
  { id: 'tcpRealtek', icon: Network },
  { id: 'sharing', icon: Nwnp32PrinterIcon },
];

type Dialog = 'tcp' | 'add' | 'insert' | 'remove' | 'none' | 'sharing';

export function NetworkApp({ onClose }: AppProps) {
  const t = useT();
  const n = t.network;
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState<ComponentId>('client');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [draft, setDraft] = useState<NetworkIdentity>(() => getSettings().network);
  const [saved, setSaved] = useState<NetworkIdentity>(draft);
  const [logon, setLogon] = useState('client');
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const patch = (next: Partial<NetworkIdentity>) => setDraft((prev) => ({ ...prev, ...next }));

  const apply = () => {
    const next = {
      ...draft,
      computerName: draft.computerName.trim() || saved.computerName,
      workgroup: draft.workgroup.trim() || saved.workgroup,
    };
    updateSettings({ network: next });
    setDraft(next);
    setSaved(next);
  };

  const openProperties = () => setDialog(selected.startsWith('tcp') ? 'tcp' : selected === 'sharing' ? 'sharing' : 'none');

  return (
    <div className="props-dialog">
      <Tabs value={tab} onChange={(value) => setTab(value as number)}>
        {n.tabs.map((label, index) => <Tab key={label} value={index}>{label}</Tab>)}
      </Tabs>
      <TabBody className="props-body">
        {tab === 0 ? (
          <div className="stack">
            <span>{n.installed}</span>
            <Frame variant="field" className="net-list">
              {components.map(({ id, icon: Icon }) => (
                <div
                  key={id}
                  tabIndex={0}
                  className={id === selected ? 'net-row is-selected' : 'net-row'}
                  onClick={() => setSelected(id)}
                  onDoubleClick={openProperties}
                  onKeyDown={(event) => {
                    const index = components.findIndex((item) => item.id === id);
                    if (event.key === 'ArrowDown') setSelected(components[Math.min(components.length - 1, index + 1)].id);
                    if (event.key === 'ArrowUp') setSelected(components[Math.max(0, index - 1)].id);
                    if (event.key === 'Enter') openProperties();
                  }}
                >
                  <Icon variant="16x16_4" />
                  <span>{n.components[id]}</span>
                </div>
              ))}
            </Frame>
            <div className="button-row">
              <Button onClick={() => setDialog('add')}>{t.common.add}</Button>
              <Button onClick={() => setDialog('remove')}>{t.common.remove}</Button>
              <Button onClick={openProperties}>{t.common.properties}</Button>
            </div>
            <div className="net-logon">
              <span>{n.primaryLogon}</span>
              <Select
                width="100%"
                options={[
                  { value: 'client', label: n.components.client },
                  { value: 'windows', label: n.windowsLogon },
                ]}
                value={logon}
                onChange={(option) => setLogon(option.value)}
              />
            </div>
            <Button onClick={() => setDialog('sharing')} style={{ alignSelf: 'flex-start' }}>{n.sharingButton}</Button>
            <GroupBox label={n.description}>
              <p className="net-description">{n.descriptions[selected]}</p>
            </GroupBox>
          </div>
        ) : null}
        {tab === 1 ? (
          <div className="stack">
            <p>{n.identText}</p>
            <div className="regional-grid">
              <span>{n.computerName}</span>
              <TextInput value={draft.computerName} maxLength={15} onChange={(event) => patch({ computerName: event.target.value.toUpperCase() })} fullWidth />
              <span>{n.workgroup}</span>
              <TextInput value={draft.workgroup} maxLength={15} onChange={(event) => patch({ workgroup: event.target.value.toUpperCase() })} fullWidth />
              <span>{n.computerDescription}</span>
              <TextInput value={draft.description} maxLength={48} onChange={(event) => patch({ description: event.target.value })} fullWidth />
            </div>
          </div>
        ) : null}
        {tab === 2 ? (
          <div className="stack">
            <GroupBox label={n.access}>
              <div className="net-access">
                <Radio
                  name="net-access"
                  value="share"
                  label={n.shareLevel}
                  checked={draft.accessControl === 'share'}
                  onChange={() => patch({ accessControl: 'share' })}
                />
                <p className="indent">{n.shareLevelText}</p>
                <Radio
                  name="net-access"
                  value="user"
                  label={n.userLevel}
                  checked={draft.accessControl === 'user'}
                  onChange={() => patch({ accessControl: 'user' })}
                />
                <p className="indent">{n.userLevelText}</p>
              </div>
            </GroupBox>
          </div>
        ) : null}
        {tab === 3 ? <ConnectionStatus /> : null}
      </TabBody>
      <DialogFooter
        onOk={() => {
          apply();
          onClose();
        }}
        onCancel={onClose}
        onApply={apply}
        applyDisabled={!dirty}
      />

      {dialog === 'tcp' ? <TcpDialog onClose={() => setDialog(null)} dialup={selected === 'tcpDialup'} host={draft.computerName} /> : null}
      {dialog === 'add' ? <AddDialog onCancel={() => setDialog(null)} onPick={() => setDialog('insert')} /> : null}
      {dialog === 'insert' ? <MessageDialog title={n.insertDiskTitle} message={n.insertDisk} onClose={() => setDialog(null)} /> : null}
      {dialog === 'remove' ? <MessageDialog title={n.components[selected]} message={n.cannotRemove} onClose={() => setDialog(null)} /> : null}
      {dialog === 'none' ? <MessageDialog title={n.components[selected]} message={n.noProperties} onClose={() => setDialog(null)} /> : null}
      {dialog === 'sharing' ? <SharingDialog onClose={() => setDialog(null)} /> : null}
    </div>
  );
}

type NetworkInformation = EventTarget & {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
};

function readConnection() {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  return {
    online: navigator.onLine,
    supported: Boolean(connection),
    type: connection?.type,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
    saveData: connection?.saveData,
  };
}

function useConnection() {
  const [state, setState] = useState(readConnection);
  useEffect(() => {
    const update = () => setState(readConnection());
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    connection?.addEventListener('change', update);
    const timer = window.setInterval(update, 5000);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      connection?.removeEventListener('change', update);
      window.clearInterval(timer);
    };
  }, []);
  return state;
}

function ConnectionStatus() {
  const t = useT();
  const n = t.network;
  const state = useConnection();
  const dialup = useOnline();
  const missing = t.common.notAvailable;
  const typeName = state.type ? (n.types as Record<string, string | undefined>)[state.type] ?? state.type : missing;
  return (
    <div className="stack">
      <p>{n.statusIntro}</p>
      <GroupBox label={n.status}>
        <div className="net-status">
          <span className={state.online ? 'net-led is-on' : 'net-led'} aria-hidden />
          <dl className="facts">
            <dt>{n.browser}</dt>
            <dd>{state.online ? n.online : n.offline}</dd>
            <dt>{n.dialupState}</dt>
            <dd>{dialup ? n.connected : n.disconnected}</dd>
            <dt>{n.type}</dt>
            <dd>{typeName}</dd>
            <dt>{n.quality}</dt>
            <dd>{state.effectiveType ? state.effectiveType.toUpperCase() : missing}</dd>
            <dt>{n.downlink}</dt>
            <dd>{state.downlink !== undefined ? `${state.downlink} Mbit/s` : missing}</dd>
            <dt>{n.rtt}</dt>
            <dd>{state.rtt !== undefined ? `${state.rtt} ms` : missing}</dd>
            <dt>{n.saveData}</dt>
            <dd>{state.saveData === undefined ? missing : state.saveData ? n.on : n.off}</dd>
          </dl>
        </div>
      </GroupBox>
      {state.supported ? null : <p className="muted">{n.apiNote}</p>}
    </div>
  );
}

function TcpDialog({ onClose, dialup, host }: { onClose: () => void; dialup: boolean; host: string }) {
  const t = useT();
  const n = t.network;
  const [tab, setTab] = useState(0);
  const [dns, setDns] = useState(true);
  return (
    <SubDialog title={n.tcpTitle} onClose={onClose} width={420}>
      <Tabs value={tab} onChange={(value) => setTab(value as number)}>
        {n.tcpTabs.map((label, index) => <Tab key={label} value={index}>{label}</Tab>)}
      </Tabs>
      <TabBody className="tcp-body">
        {tab === 0 ? (
          <div className="stack">
            <p>{n.ipText}</p>
            <Radio name="tcp-ip" value="auto" label={n.ipAuto} checked onChange={() => undefined} />
            <Radio name="tcp-ip" value="manual" label={n.ipManual} checked={false} disabled onChange={() => undefined} />
            <div className="regional-grid indent">
              <span>{n.ipAddress}</span>
              <TextInput disabled value={dialup ? '0.0.0.0' : '192.168.0.85'} />
              <span>{n.subnet}</span>
              <TextInput disabled value="255.255.255.0" />
            </div>
          </div>
        ) : null}
        {tab === 1 ? (
          <div className="stack">
            <p>{n.gatewayText}</p>
            <div className="regional-grid">
              <span>{n.newGateway}</span>
              <TextInput disabled value="" />
            </div>
            <span>{n.installedGateways}</span>
            <Frame variant="field" className="tcp-list">
              <span>192.168.0.1</span>
            </Frame>
          </div>
        ) : null}
        {tab === 2 ? (
          <div className="stack">
            <Radio name="tcp-dns" value="off" label={n.dnsOff} checked={!dns} onChange={() => setDns(false)} />
            <Radio name="tcp-dns" value="on" label={n.dnsOn} checked={dns} onChange={() => setDns(true)} />
            <div className="regional-grid">
              <span>{n.host}</span>
              <TextInput disabled={!dns} readOnly value={host.toLowerCase()} />
              <span>{n.domain}</span>
              <TextInput disabled={!dns} readOnly value="sa85.de" />
            </div>
            <span>{n.dnsOrder}</span>
            <Frame variant="field" className="tcp-list">
              <span>194.25.2.129</span>
              <span>194.25.2.130</span>
            </Frame>
          </div>
        ) : null}
      </TabBody>
      <div className="dialog-footer">
        <Button onClick={onClose} style={{ minWidth: 84 }}>{t.common.ok}</Button>
        <Button onClick={onClose} style={{ minWidth: 84 }}>{t.common.cancel}</Button>
      </div>
    </SubDialog>
  );
}

const addTypes = ['client', 'adapter', 'protocol', 'service'] as const;

function AddDialog({ onCancel, onPick }: { onCancel: () => void; onPick: () => void }) {
  const t = useT();
  const n = t.network;
  const [type, setType] = useState<(typeof addTypes)[number]>('client');
  return (
    <SubDialog title={n.addTitle} onClose={onCancel} width={400}>
      <p>{n.addText}</p>
      <Frame variant="field" className="net-list is-short">
        {addTypes.map((item) => (
          <div
            key={item}
            tabIndex={0}
            className={item === type ? 'net-row is-selected' : 'net-row'}
            onClick={() => setType(item)}
            onDoubleClick={onPick}
          >
            <Network variant="16x16_4" />
            <span>{n.addTypes[item]}</span>
          </div>
        ))}
      </Frame>
      <p className="net-description">{n.addTypeText[type]}</p>
      <div className="dialog-footer">
        <Button onClick={onPick} style={{ minWidth: 84 }}>{t.common.add}</Button>
        <Button onClick={onCancel} style={{ minWidth: 84 }}>{t.common.cancel}</Button>
      </div>
    </SubDialog>
  );
}

function SharingDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const n = t.network;
  const [files, setFiles] = useState(true);
  const [printers, setPrinters] = useState(false);
  return (
    <SubDialog title={n.sharingTitle} onClose={onClose} width={420}>
      <div className="stack">
        <Checkbox label={n.shareFiles} checked={files} onChange={(event) => setFiles(event.target.checked)} />
        <Checkbox label={n.sharePrinters} checked={printers} onChange={(event) => setPrinters(event.target.checked)} />
      </div>
      <div className="dialog-footer">
        <Button onClick={onClose} style={{ minWidth: 84 }}>{t.common.ok}</Button>
        <Button onClick={onClose} style={{ minWidth: 84 }}>{t.common.cancel}</Button>
      </div>
    </SubDialog>
  );
}
