export type SkillGroup = {
  title: string;
  items: string[];
};

export type Project = {
  title: string;
  description: string;
  url?: string;
};

/** Liegt rückwärts und Base64-codiert vor, damit Harvester die Adresse nicht im Bundle finden. */
function decodeMail(encoded: string) {
  return [...atob(encoded)].reverse().join('');
}

export const profile = {
  name: 'Stefan Andernach',
  brand: 'sa85',
  role: 'Software-Developer seit über 25 Jahren',
  email: decodeMail('ZWQuNThhc0Bzc2VuaXN1Yg=='),
  linkedinUrl: 'https://www.linkedin.com/in/stefan-andernach-7a2828322/',
  photo: '/img/stefan-andernach.jpg',
  location: 'Koblenz',
  bio: [
    'Mit 14 bekam ich meinen ersten eigenen Computer, und schnell war klar: Wir brauchen Internet! Es war die Zeit der 56K-Modems, ISDN war gerade im Kommen. Ich konnte meine Eltern überzeugen und durfte den Vertrag sogar selbst am Telefon abschließen und die ISDN-Anlage bei uns im Flur installieren. Von da an surfte ich mit 64 kbit/s, mit Kanalbündelung sogar mit 128 kbit/s, und damit fast so schnell, wie es privat damals überhaupt ging.',
    'Beim Surfen wollte ich sofort wissen, wie eine Webseite eigentlich funktioniert. Also schaute ich mir den Quellcode an: alles schlichtes HTML, gebaut mit Tabellen. Etwas später kam JavaScript dazu, doch damals hieß es noch: „Verwende kein JavaScript, es könnte User geben, die es ausgeschaltet haben.“ Das war mir schon damals ein Dorn im Auge, denn ich habe JavaScript von Anfang an geliebt. Endlich gab es Interaktion ohne Seitenreload, und Reloads dauerten damals deutlich länger als heute. Statt flüssiger Animationen gab es ständig Unterbrechungen.',
    'Rund zwei Jahre später begann ich meine Ausbildung zum IT-Systemelektroniker: PC-Hard- und -Software, Netzwerktechnik und die neue Welt der Internetverbindungen per Modem, ISDN und ganz frisch DSL. Im Betrieb zerlegte und reparierte ich Faxgeräte, Drucker und Computer, und fürs Weihnachtsgeschäft bauten wir PCs und Notebooks im Akkord am Fließband. Wie jeder damals liebte ich PC-Spiele: erst die Klassiker, die man unter DOS startete, später die moderneren Titel per .exe unter Windows. Und natürlich dürfen die LAN-Partys nicht fehlen, die kamen dann etwas später.',
    'Nach der Ausbildung war mir das Strippenziehen, also der Aufbau von Netzwerken und Internetverbindungen, nicht anspruchsvoll genug. Ich widmete mich immer mehr der Webentwicklung und baute Webseiten für mich, für meine Schule und schließlich für VivaSolar, die Firma eines Kollegen aus dem Radsportverein. Es folgten die ersten Anwendungen: ein Backend zum Pflegen der Inhalte und ein Solarmonitoring, mit dem Privatleute ihre Solaranlagen verwalten und überwachen konnten.',
    'Nach meinem Zivildienst stand fest: Ich will in die Webentwicklung. Über die Empfehlung eines Bekannten landete ich bei SER Solutions in Neustadt (Wied). Die SER war auf digitales Dokumentenmanagement spezialisiert, ich arbeitete in der kleinen Webabteilung, die sich um die Webauftritte der Firma und ihrer Produkte kümmerte. Schon bald begann ich dort eine zweite, verkürzte Ausbildung zum Fachinformatiker für Anwendungsentwicklung, die ich nach anderthalb Jahren abschloss.',
    'Während dieser Ausbildung ging ich mit 19 Jahren zur Verbandsgemeinde und meldete ein Gewerbe für An- und Verkauf und IT-Dienstleistungen an. Von da an nahm alles seinen Lauf: Ich baute Webseiten und Webanwendungen, privat, nebenberuflich und im Job. Nach der Ausbildung wechselte ich in eine kleine Internet- und Werbeagentur, und auch in den folgenden Jahren suchte ich mir immer wieder neue Herausforderungen.',
    'Heute blicke ich auf 25 Jahre Erfahrung in der Webentwicklung zurück, dazu Java und C/C++ und das Basteln und Programmieren mit Mikrocontrollern wie Arduino und ESP32. Alle Jahre bis heute aufzuzählen würde den Rahmen sprengen, also springe ich ins Hier und Jetzt: Erst kamen wir in der modernen Softwareentwicklung an, mit Git, Deployments und Virtualisierung. Und nur wenige Jahre später muss man keine einzige Klammer mehr selbst schreiben, weil das der KI-Agent erledigt. Erschreckend, aber auch ein Glück, denn genau das macht eine so verrückte Retro-Webseite wie diese möglich, die mich zurück in die Anfänge meines Computerlebens beamt.',
    'Welcome to the 90s! Grüße gehen raus von Stefan.',
  ],
  skills: [
    {
      title: 'KI & moderne Softwareentwicklung',
      items: [
        'KI-gestützte Softwareentwicklung mit KI-Agenten',
        'Künstliche Intelligenz in Webanwendungen',
        'Git, GitHub und GitLab',
        'CI/CD-Pipelines (GitLab) und automatisierte Deployments',
        'Docker und Virtualisierung',
      ],
    },
    {
      title: 'Web-Frameworks & Plattformen',
      items: [
        'React.js und Next.js',
        'Node.js',
        'Progressive Web Apps (PWA)',
        'Ruby on Rails',
        'PHP-Anwendungen',
        'Headless CMS: Directus',
        'WordPress',
      ],
    },
    {
      title: 'Programmier-/Skriptsprachen',
      items: ['JavaScript', 'PHP', 'Ruby', 'SQL', 'HTML und CSS', 'Java', 'C und C++'],
    },
    {
      title: 'Datenbanken',
      items: [
        'Relationale Datenbanken: PostgreSQL, MySQL, MariaDB',
        'NoSQL, Key-Value-Store: Redis',
        'NoSQL, dokumentenorientiert: MongoDB',
      ],
    },
    {
      title: 'Tools & Umgebung',
      items: ['Zsh und Kommandozeile', 'Docker Compose und Container-Setups', 'Git-Workflows mit Merge Requests und Code-Reviews'],
    },
    {
      title: 'Hardware & Basteln',
      items: ['Mikrocontroller: Arduino und ESP32', 'PC-Hardware und Netzwerktechnik (IT-Systemelektroniker)'],
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
