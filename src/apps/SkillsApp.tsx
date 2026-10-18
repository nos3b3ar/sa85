import { Frame } from 'react95';
import { profile } from '../content/profile';

export function SkillsApp() {
  return (
    <Frame variant="field" className="skill-list-frame">
      <ul className="skill-list">
        {profile.skills.flatMap((group) => group.items).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Frame>
  );
}
