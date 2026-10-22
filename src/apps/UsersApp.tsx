import { useState } from 'react';
import { Button, Checkbox, Frame, Radio, TextInput } from 'react95';
import { useT } from '../i18n';
import {
  administrator,
  personalItems,
  updateSettings,
  useSettings,
  type PersonalItem,
  type UserAccount,
} from '../settings/settings';
import { SubDialog } from './shared/SubDialog';
import { UsersIcon } from './systemIcons';
import type { AppProps } from './types';

type Dialog =
  | { kind: 'wizard'; copyOf?: UserAccount }
  | { kind: 'password'; user: UserAccount }
  | { kind: 'personal'; user: UserAccount }
  | { kind: 'delete'; user: UserAccount };

function saveUsers(users: UserAccount[]) {
  updateSettings({ users });
}

export function UsersApp({ onClose }: AppProps) {
  const t = useT();
  const { users } = useSettings();
  const [selected, setSelected] = useState(administrator);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const current = users.find((user) => user.name === selected) ?? users[0];
  const isAdmin = current.name === administrator;

  const replace = (name: string, next: UserAccount) => saveUsers(users.map((user) => (user.name === name ? next : user)));

  return (
    <div className="props-dialog users-app">
      <div className="users-head">
        <UsersIcon variant="32x32_4" />
        <p>{t.users.intro}</p>
      </div>
      <span>{t.users.list}</span>
      <div className="users-body">
        <Frame variant="field" className="users-list" role="listbox" aria-label={t.users.list}>
          {users.map((user) => (
            <div
              key={user.name}
              className={user.name === current.name ? 'users-row is-selected' : 'users-row'}
              tabIndex={0}
              onClick={() => setSelected(user.name)}
              onDoubleClick={() => setDialog({ kind: 'personal', user })}
              onKeyDown={(event) => {
                const index = users.indexOf(user);
                if (event.key === 'ArrowDown') setSelected(users[Math.min(users.length - 1, index + 1)].name);
                if (event.key === 'ArrowUp') setSelected(users[Math.max(0, index - 1)].name);
                if (event.key === 'Delete' && user.name !== administrator) setDialog({ kind: 'delete', user });
              }}
            >
              <span>{user.name}</span>
              <span className="users-meta">
                {user.name === administrator ? `${t.users.standard}, ` : ''}
                {user.hasPassword ? t.users.hasPassword : t.users.noPassword}
              </span>
            </div>
          ))}
        </Frame>
        <div className="users-actions">
          <Button onClick={() => setDialog({ kind: 'wizard' })}>{t.users.new}</Button>
          <Button
            disabled={isAdmin}
            title={isAdmin ? t.users.adminLocked : undefined}
            onClick={() => setDialog({ kind: 'delete', user: current })}
          >
            {t.users.delete}
          </Button>
          <Button onClick={() => setDialog({ kind: 'wizard', copyOf: current })}>{t.users.copy}</Button>
        </div>
      </div>
      <div className="button-row users-bottom">
        <Button onClick={() => setDialog({ kind: 'password', user: current })}>{t.users.setPassword}</Button>
        <Button onClick={() => setDialog({ kind: 'personal', user: current })}>{t.users.changeSettings}</Button>
      </div>
      <p className="muted">{isAdmin ? t.users.adminLocked : t.users.note}</p>
      <div className="dialog-footer">
        <Button onClick={onClose} style={{ minWidth: 84 }}>{t.common.close}</Button>
      </div>

      {dialog?.kind === 'wizard' ? (
        <UserWizard
          users={users}
          copyOf={dialog.copyOf}
          onCancel={() => setDialog(null)}
          onDone={(user) => {
            saveUsers([...users, user]);
            setSelected(user.name);
            setDialog(null);
          }}
        />
      ) : null}
      {dialog?.kind === 'password' ? (
        <PasswordDialog
          user={dialog.user}
          onCancel={() => setDialog(null)}
          onDone={(hasPassword) => {
            replace(dialog.user.name, { ...dialog.user, hasPassword });
            setDialog(null);
          }}
        />
      ) : null}
      {dialog?.kind === 'personal' ? (
        <SubDialog title={`${t.users.personalTitle}: ${dialog.user.name}`} onClose={() => setDialog(null)} width={400}>
          <PersonalForm
            initial={dialog.user.personal}
            onCancel={() => setDialog(null)}
            onDone={(personal) => {
              replace(dialog.user.name, { ...dialog.user, personal });
              setDialog(null);
            }}
          />
        </SubDialog>
      ) : null}
      {dialog?.kind === 'delete' ? (
        <SubDialog title={t.users.deleteTitle} onClose={() => setDialog(null)} width={360}>
          <p className="sub-dialog-message">{t.users.confirmDelete(dialog.user.name)}</p>
          <div className="dialog-footer">
            <Button
              style={{ minWidth: 84 }}
              onClick={() => {
                saveUsers(users.filter((user) => user.name !== dialog.user.name));
                setSelected(administrator);
                setDialog(null);
              }}
            >
              {t.common.yes}
            </Button>
            <Button style={{ minWidth: 84 }} onClick={() => setDialog(null)}>{t.common.no}</Button>
          </div>
        </SubDialog>
      ) : null}
    </div>
  );
}

function PersonalForm({ initial, onDone, onCancel, hideButtons = false, onChange }: {
  initial: PersonalItem[];
  onDone?: (items: PersonalItem[]) => void;
  onCancel?: () => void;
  hideButtons?: boolean;
  onChange?: (items: PersonalItem[], copy: boolean) => void;
}) {
  const t = useT();
  const [items, setItems] = useState<PersonalItem[]>(initial);
  const [copy, setCopy] = useState(true);
  const update = (next: PersonalItem[], nextCopy = copy) => {
    setItems(next);
    setCopy(nextCopy);
    onChange?.(next, nextCopy);
  };
  return (
    <div className="stack">
      <p>{t.users.personalText}</p>
      <div className="users-items">
        {personalItems.map((item) => (
          <Checkbox
            key={item}
            label={t.users.items[item]}
            checked={items.includes(item)}
            onChange={(event) => update(event.target.checked ? personalItems.filter((entry) => entry === item || items.includes(entry)) : items.filter((entry) => entry !== item))}
          />
        ))}
      </div>
      <Radio name="users-copy" value="copy" label={t.users.copyItems} checked={copy} onChange={() => update(items, true)} />
      <Radio name="users-copy" value="new" label={t.users.newItems} checked={!copy} onChange={() => update(items, false)} />
      {hideButtons ? null : (
        <div className="dialog-footer">
          <Button style={{ minWidth: 84 }} onClick={() => onDone?.(items)}>{t.common.ok}</Button>
          <Button style={{ minWidth: 84 }} onClick={onCancel}>{t.common.cancel}</Button>
        </div>
      )}
    </div>
  );
}

function PasswordDialog({ user, onDone, onCancel }: { user: UserAccount; onDone: (hasPassword: boolean) => void; onCancel: () => void }) {
  const t = useT();
  const [old, setOld] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = next !== confirm;
  return (
    <SubDialog title={`${t.users.passwordTitle}: ${user.name}`} onClose={onCancel}>
      <form
        className="users-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!mismatch) onDone(next.length > 0);
        }}
      >
        {user.hasPassword ? (
          <>
            <span>{t.users.oldPassword}</span>
            <TextInput type="password" value={old} onChange={(event) => setOld(event.target.value)} fullWidth />
          </>
        ) : null}
        <span>{t.users.newPassword}</span>
        <TextInput type="password" value={next} onChange={(event) => setNext(event.target.value)} fullWidth />
        <span>{t.users.confirmPassword}</span>
        <TextInput type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} fullWidth />
        {mismatch && confirm ? <p className="form-error users-form-wide">{t.users.mismatch}</p> : null}
        <div className="dialog-footer users-form-wide">
          <Button type="submit" disabled={mismatch} style={{ minWidth: 84 }}>{t.common.ok}</Button>
          <Button type="button" onClick={onCancel} style={{ minWidth: 84 }}>{t.common.cancel}</Button>
        </div>
      </form>
    </SubDialog>
  );
}

function UserWizard({ users, copyOf, onDone, onCancel }: {
  users: UserAccount[];
  copyOf?: UserAccount;
  onDone: (user: UserAccount) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [step, setStep] = useState(copyOf ? 1 : 0);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [personal, setPersonal] = useState<PersonalItem[]>(copyOf?.personal ?? [...personalItems]);
  const trimmed = name.trim();
  const taken = users.some((user) => user.name.toLowerCase() === trimmed.toLowerCase());
  const nameError = !trimmed ? t.users.nameEmpty : taken ? t.users.nameTaken : null;
  const passwordError = password !== confirm ? t.users.mismatch : null;
  const blocked = (step === 1 && Boolean(nameError)) || (step === 2 && Boolean(passwordError));
  const last = 4;

  return (
    <SubDialog title={copyOf ? t.users.copyTitle(copyOf.name) : t.users.wizardTitle} onClose={onCancel} width={460}>
      <div className="wizard">
        <div className="wizard-art" aria-hidden>
          <UsersIcon variant="32x32_4" />
        </div>
        <div className="wizard-page">
          {step === 0 ? <p>{t.users.wizardIntro}</p> : null}
          {step === 1 ? (
            <>
              <p>{t.users.wizardNameText}</p>
              <label className="users-form">
                <span>{t.users.userName}</span>
                <TextInput
                  value={name}
                  maxLength={32}
                  onChange={(event) => setName(event.target.value)}
                  fullWidth
                />
              </label>
              {name && nameError ? <p className="form-error">{nameError}</p> : null}
            </>
          ) : null}
          {step === 2 ? (
            <>
              <p>{t.users.wizardPasswordText}</p>
              <div className="users-form">
                <span>{t.users.password}</span>
                <TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} fullWidth />
                <span>{t.users.confirmPassword}</span>
                <TextInput type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} fullWidth />
              </div>
              {confirm && passwordError ? <p className="form-error">{passwordError}</p> : null}
            </>
          ) : null}
          {step === 3 ? (
            <>
              <strong>{t.users.personalTitle}</strong>
              <PersonalForm initial={personal} hideButtons onChange={(items) => setPersonal(items)} />
            </>
          ) : null}
          {step === 4 ? <p>{t.users.wizardDone(trimmed)}</p> : null}
        </div>
      </div>
      <div className="dialog-footer wizard-footer">
        <Button disabled={step === 0 || (Boolean(copyOf) && step === 1)} onClick={() => setStep((value) => value - 1)} style={{ minWidth: 84 }}>
          {t.common.back}
        </Button>
        {step < last ? (
          <Button disabled={blocked} onClick={() => setStep((value) => value + 1)} style={{ minWidth: 84 }}>
            {t.common.next}
          </Button>
        ) : (
          <Button
            onClick={() => onDone({ name: trimmed, hasPassword: password.length > 0, personal })}
            style={{ minWidth: 84 }}
          >
            {t.common.finish}
          </Button>
        )}
        <Button onClick={onCancel} style={{ minWidth: 84 }}>{t.common.cancel}</Button>
      </div>
    </SubDialog>
  );
}
