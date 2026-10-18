import { profile } from '../content/profile';

export function PortfolioApp() {
  return (
    <div className="doc-field">
      {profile.projects.map((project) => (
        <section key={project.title} className="project">
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          {project.url ? (
            <p>
              <a className="win-link" href={project.url} target="_blank" rel="noreferrer">
                {project.url}
              </a>
            </p>
          ) : null}
        </section>
      ))}
    </div>
  );
}
