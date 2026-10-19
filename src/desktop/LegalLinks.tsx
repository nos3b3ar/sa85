type LegalLinksProps = {
  tone: 'bios' | 'setup' | 'splash';
  onOpen: (appId: string) => void;
};

const links = [
  { id: 'impressum', label: 'Impressum' },
  { id: 'datenschutz', label: 'Datenschutz' },
];

export function LegalLinks({ tone, onOpen }: LegalLinksProps) {
  return (
    <div className={`legal-links is-${tone}`}>
      {links.map((link) => (
        <button key={link.id} type="button" onClick={() => onOpen(link.id)}>
          {link.label}
        </button>
      ))}
    </div>
  );
}
