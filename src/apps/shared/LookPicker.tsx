import { Desktop } from '@react95/icons/Desktop';
import { Ie } from '@react95/icons/Ie';
import { Mail } from '@react95/icons/Mail';
import { GroupBox, Radio } from 'react95';
import type { Look } from '../../settings/settings';
import { lookInfo } from '../../styles/themes';

const looks: { id: Look; features: string }[] = [
  {
    id: '98',
    features: 'Farbverlauf in Titelleisten, Schnellstart, Ordner mit Web-Ansicht und Adressleiste.',
  },
  {
    id: '95',
    features: 'Einfarbige Titelleisten, schlichte Ordner, Taskleiste ohne Schnellstart.',
  },
];

function Screenshot({ look }: { look: Look }) {
  return (
    <span className={`look-shot is-${look}`} aria-hidden>
      <span className="look-shot-title">
        <span className="look-shot-controls">
          <i />
          <i />
          <i />
        </span>
      </span>
      <span className="look-shot-desktop">
        <img src="/img/win98.png" alt="" width={44} height={44} />
        <span className="look-shot-name">Windows {look}</span>
      </span>
      <span className="look-shot-taskbar">
        <span className="look-shot-start">
          <img src="/img/win98.png" alt="" width={12} height={12} />
          Start
        </span>
        {look === '98' ? (
          <span className="look-shot-quick">
            <Ie variant="16x16_4" />
            <Mail variant="16x16_4" />
            <Desktop variant="16x16_4" />
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function LookPicker({ value, onChange, name }: { value: Look; onChange: (look: Look) => void; name: string }) {
  return (
    <div className="stack">
      <p>Wählen Sie, welche Windows-Version auf diesem Computer ausgeführt werden soll.</p>
      <GroupBox label="Windows-Version">
        <div className="look-options">
          {looks.map((item) => {
            const info = lookInfo[item.id];
            return (
              <div key={item.id} className="look-option">
                <button
                  type="button"
                  className={value === item.id ? 'look-preview is-selected' : 'look-preview'}
                  tabIndex={-1}
                  onClick={() => onChange(item.id)}
                >
                  <Screenshot look={item.id} />
                </button>
                <Radio
                  name={name}
                  value={item.id}
                  label={`Windows ${item.id}`}
                  checked={value === item.id}
                  onChange={() => onChange(item.id)}
                />
                <span className="muted">{info.edition ? `${info.edition}, ` : ''}Version {info.build}</span>
                <span className="muted">{item.features}</span>
              </div>
            );
          })}
        </div>
      </GroupBox>
      <p>Startbildschirm und Startklang wechseln beim nächsten Neustart mit.</p>
    </div>
  );
}
