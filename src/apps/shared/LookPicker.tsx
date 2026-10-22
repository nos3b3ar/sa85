import { Desktop } from '@react95/icons/Desktop';
import { Ie } from '@react95/icons/Ie';
import { Mail } from '@react95/icons/Mail';
import { GroupBox, Radio } from 'react95';
import { useT } from '../../i18n';
import type { Look } from '../../settings/settings';
import { lookInfo } from '../../styles/themes';

const looks: Look[] = ['98', '95'];

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
  const t = useT();
  return (
    <div className="stack">
      <p>{t.look.intro}</p>
      <GroupBox label={t.look.group}>
        <div className="look-options">
          {looks.map((id) => {
            const info = lookInfo[id];
            const features = id === '98' ? t.look.features98 : t.look.features95;
            return (
              <div key={id} className="look-option">
                <button
                  type="button"
                  className={value === id ? 'look-preview is-selected' : 'look-preview'}
                  tabIndex={-1}
                  onClick={() => onChange(id)}
                >
                  <Screenshot look={id} />
                </button>
                <Radio
                  name={name}
                  value={id}
                  label={`Windows ${id}`}
                  checked={value === id}
                  onChange={() => onChange(id)}
                />
                <span className="muted">{info.edition ? `${info.edition}, ` : ''}
                  {t.look.version(info.build)}</span>
                <span className="muted">{features}</span>
              </div>
            );
          })}
        </div>
      </GroupBox>
      <p>{t.look.restartNote}</p>
    </div>
  );
}
