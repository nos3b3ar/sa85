import { Frame } from 'react95';
import { profile } from '../content/profile';

export function AboutApp() {
  return (
    <div className="doc-field about-layout">
      <Frame variant="field" className="about-photo">
        <img src={profile.photo} alt={profile.name} />
      </Frame>
      <div className="about-copy">
        <h2 style={{ margin: '0 0 4px' }}>{profile.name}</h2>
        <p className="muted">{profile.role}</p>
        {profile.bio.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>
          E-Mail:{' '}
          <a className="win-link" href={`mailto:${profile.email}`}>{profile.email}</a>
        </p>
        <p>
          LinkedIn:{' '}
          <a className="win-link" href={profile.linkedinUrl} target="_blank" rel="noreferrer">
            {profile.linkedinUrl}
          </a>
        </p>
        <p className="muted">{profile.location}</p>
      </div>
    </div>
  );
}
