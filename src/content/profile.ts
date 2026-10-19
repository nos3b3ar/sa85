export type SkillGroup = {
  title: string;
  items: string[];
};

export type Project = {
  title: string;
  description: string;
  url?: string;
};

export const profile = {
  name: 'Stefan Andernach',
  brand: 'sa85',
  role: 'Software-Developer seit über 20 Jahren',
  email: 'business@sa85.de',
  linkedinUrl: 'https://www.linkedin.com/in/stefan-andernach-7a2828322/',
  photo: '/img/stefan-andernach.jpg',
  location: 'Koblenz',
  bio: [
    'Schwerpunkt Webentwicklung: PHP, React.js, Ruby on Rails, relationale Datenbanken und KI-gestützte Software.',
    'Diese Seite ist mein Schreibtisch: erst fährt der Pentium hoch, dann liegt Windows 98 auf dem Tisch.',
  ],
  skills: [
    {
      title: 'Skills',
      items: [
        'Softwareentwicklung',
        'Webentwicklung',
        'PHP-Anwendungen',
        'React.js',
        'Ruby on Rails',
        'Progressive Web Applications',
        'Relationale Datenbanken',
        'Künstliche Intelligenz',
      ],
    },
  ] satisfies SkillGroup[],
  projects: [
    {
      title: 'sa85',
      description: 'Dieser Schreibtisch. BIOS-Boot, Windows-98-Splash und Fenster für Profil, Skills und Kontakt.',
    },
    {
      title: 'Weitere Projekte',
      description: 'Externe Seiten und kleine Spiele werden später eigene Desktop-Icons. Ein Link-Eintrag in der App-Registry genügt.',
    },
  ] as Project[],
};
