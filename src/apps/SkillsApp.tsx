import { Frame } from 'react95';
import { profile } from '../content/profile';

export function SkillsApp() {
  return (
    <Frame variant="field" className="skill-list-frame">
      {profile.skills.map((group) => (
        <section key={group.title} className="skill-group">
          <h3>{group.title}</h3>
          <ul className="skill-list">
            {group.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </Frame>
  );
}
