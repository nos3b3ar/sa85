import type { AppProps } from './types';
import { datenschutz, impressum, type Inline, type LegalDocument } from '../content/legal';

const menus = ['Datei', 'Bearbeiten', 'Suchen', '?'];

function LegalApp({ document, openApp }: { document: LegalDocument } & Pick<AppProps, 'openApp'>) {
  return (
    <div className="editor">
      <div className="editor-menubar" aria-hidden="true">
        {menus.map((menu) => (
          <span key={menu} className="editor-menu">{menu}</span>
        ))}
      </div>
      <div className="editor-page">
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.blocks.map((block, index) => (
              block.type === 'lines' ? (
                <p key={index}>
                  {block.lines.map((line) => (
                    <span key={line}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
              ) : (
                <p key={index}>
                  {block.parts.map((part, partIndex) => (
                    <Part key={partIndex} part={part} openApp={openApp} />
                  ))}
                </p>
              )
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function Part({ part, openApp }: { part: Inline; openApp: (appId: string) => void }) {
  if (typeof part === 'string') return part;
  if ('app' in part) {
    return (
      <button type="button" className="text-link" onClick={() => openApp(part.app)}>
        {part.label}
      </button>
    );
  }
  const external = part.href.startsWith('http');
  return (
    <a className="text-link" href={part.href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
      {part.label}
    </a>
  );
}

export function ImpressumApp({ openApp }: AppProps) {
  return <LegalApp document={impressum} openApp={openApp} />;
}

export function DatenschutzApp({ openApp }: AppProps) {
  return <LegalApp document={datenschutz} openApp={openApp} />;
}
