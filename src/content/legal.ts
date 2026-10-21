import { profile } from './profile';

export type Inline = string | { label: string; app: string } | { label: string; href: string };

export type LegalBlock =
  | { type: 'lines'; lines: string[] }
  | { type: 'p'; parts: Inline[] };

export type LegalSection = {
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  title: string;
  sections: LegalSection[];
};

const address = ['Stefan Andernach', 'In der Mühlhöll 10 A', '56332 Dieblich'];

const mail: Inline = { label: profile.email, href: `mailto:${profile.email}` };

export const impressum: LegalDocument = {
  title: 'Impressum',
  sections: [
    {
      heading: 'Angaben gemäß § 5 DDG',
      blocks: [
        { type: 'lines', lines: address },
        { type: 'p', parts: ['E-Mail: ', mail] },
        {
          type: 'p',
          parts: [
            'Kontaktformular: ',
            { label: 'Nachricht an Stefan Andernach', app: 'contact' },
          ],
        },
      ],
    },
    {
      heading: 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV',
      blocks: [
        { type: 'lines', lines: address },
      ],
    },
    {
      heading: 'Marken',
      blocks: [
        {
          type: 'p',
          parts: [
            'Diese Seite ist ein privates Fanprojekt. Es besteht keine geschäftliche Verbindung zu Microsoft, Netscape, Winamp, dem ENERGY-STAR-Programm oder den Herstellern der Spiele im Fenster „MS DOS“.',
          ],
        },
        {
          type: 'p',
          parts: [
            'Windows, das Windows-Logo, MS-DOS, Internet Explorer und MS Sans Serif sind Marken der Microsoft Corporation. Netscape, Winamp, ENERGY STAR, Commander Keen, Doom, Apogee, One Must Fall und Tyrian sind Marken ihrer jeweiligen Inhaber.',
          ],
        },
      ],
    },
    {
      heading: 'Lizenzen',
      blocks: [
        {
          type: 'p',
          parts: [
            'Die Schrift „The Ultimate Oldschool PC Font Pack“ stammt von VileR und steht unter der Lizenz Creative Commons Attribution-ShareAlike 4.0 International: ',
            { label: 'int10h.org/oldschool-pc-fonts', href: 'https://int10h.org/oldschool-pc-fonts/' },
            ', ',
            { label: 'creativecommons.org/licenses/by-sa/4.0', href: 'https://creativecommons.org/licenses/by-sa/4.0/' },
            '.',
          ],
        },
        {
          type: 'p',
          parts: ['Die Fenster und Symbole stammen aus der Bibliothek react95.'],
        },
        {
          type: 'p',
          parts: [
            'Das Fenster „MS DOS“ nutzt den Emulator js-dos von Alexander Guryanov mit DOSBox. Beide stehen unter der GNU General Public License, Version 2. Der Quellcode steht unter ',
            { label: 'github.com/caiiiycuk/js-dos', href: 'https://github.com/caiiiycuk/js-dos' },
            ', der Lizenztext unter ',
            { label: 'gnu.org/licenses/old-licenses/gpl-2.0', href: 'https://www.gnu.org/licenses/old-licenses/gpl-2.0.html' },
            '. Laden Sie über „Programm öffnen...“ nur Dateien, an denen Sie die Rechte haben, etwa Freeware, Shareware oder eigene Kopien.',
          ],
        },
        {
          type: 'p',
          parts: [
            'Im Menü „Spiele“ und im MS-DOS-Modus unter C:\\GAMES liegen die unveränderten Originaldateien von Spielen, deren Rechteinhaber die kostenlose Weitergabe erlaubt haben: Commander Keen 1 „Marooned on Mars“ (Shareware-Episode, © 1990 id Software, vertrieben von Apogee Software), Doom (Shareware-Episode, © 1993 id Software), One Must Fall: 2097 (© 1994 Diversions Entertainment, seit 1999 Freeware) und Tyrian 2000 (© 1999 Eclipse Software, seit 2004 Freeware). Alle Rechte bleiben bei den jeweiligen Inhabern. Die mitgelieferten Lizenz- und Hinweisdateien liegen jeweils im Spielordner.',
          ],
        },
        {
          type: 'p',
          parts: [
            'Die 30-Sekunden-Hörproben im Winamp-Player werden direkt von Apple Music gestreamt und nicht auf dieser Seite gespeichert. Alle Rechte an den Titeln liegen bei den jeweiligen Künstlern und Labels: ',
            { label: 'music.apple.com', href: 'https://music.apple.com/de/' },
            '.',
          ],
        },
      ],
    },
    {
      heading: 'Datenschutz',
      blocks: [
        {
          type: 'p',
          parts: [
            'Informationen zur Verarbeitung personenbezogener Daten stehen in der ',
            { label: 'Datenschutzerklärung', app: 'datenschutz' },
            '.',
          ],
        },
      ],
    },
  ],
};

export const datenschutz: LegalDocument = {
  title: 'Datenschutzerklärung',
  sections: [
    {
      heading: 'Verantwortlicher',
      blocks: [
        { type: 'lines', lines: address },
        { type: 'p', parts: ['E-Mail: ', mail] },
      ],
    },
    {
      heading: 'Hosting und Server-Logfiles',
      blocks: [
        {
          type: 'p',
          parts: [
            'Diese Seite wird bei Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, USA, gehostet. Beim Aufruf entstehen Server-Logfiles mit IP-Adresse, Datum und Uhrzeit, aufgerufener Adresse, Browsertyp und Betriebssystem. Die Verarbeitung ist nötig, um die Seite auszuliefern und Missbrauch abzuwehren. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.',
          ],
        },
        {
          type: 'p',
          parts: [
            'Netlify verarbeitet diese Daten in unserem Auftrag auf Grundlage des Data Processing Addendum. Übermittlungen in die USA stützen sich auf die Zertifizierung von Netlify nach dem EU-US Data Privacy Framework. Soweit diese wegfällt, gelten die Standardvertragsklauseln aus dem Addendum. Unterauftragnehmer stehen in der Liste unter ',
            { label: 'netlify.com/legal/subprocessors', href: 'https://www.netlify.com/legal/subprocessors/' },
            '.',
          ],
        },
      ],
    },
    {
      heading: 'Speicherung im Browser',
      blocks: [
        {
          type: 'p',
          parts: ['Die Seite setzt keine Cookies zu Analyse- oder Werbezwecken.'],
        },
        {
          type: 'p',
          parts: [
            'Im lokalen Speicher des Browsers liegen Einträge, die Sie selbst auslösen. Unter „sa85-settings“ stehen Lautstärke, Stummschaltung, Desktopfarbe, Anordnung der Symbole, Bildschirmschoner und, wenn Sie es im Einwahl-Dialog ankreuzen, die Erlaubnis, den Retro-Browser künftig ohne neue Nachfrage zu verbinden. Unter „sa85-dst-…“ steht, dass der Hinweis zur Zeitumstellung schon angezeigt wurde.',
          ],
        },
        {
          type: 'p',
          parts: [
            'Der DOS-Emulator im Fenster „MS DOS“ läuft vollständig in Ihrem Browser. Dateien, die Sie dort öffnen oder anlegen, werden nicht hochgeladen. Der Emulator legt Startdateien und geöffnete Programme im Dateisystem des Browsers (Origin Private File System, Ordner „jsdos“) und Anzeigeeinstellungen im lokalen Speicher unter Schlüsseln ab, die mit „jsdos“ beginnen. Diese Daten verlassen Ihr Gerät nicht. Sie löschen sie über „Cache leeren“ im Fenster oder über die Rückfrage beim Schließen.',
          ],
        },
        {
          type: 'p',
          parts: [
            'Das ist für diese Funktionen erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG, Art. 6 Abs. 1 lit. f DSGVO). Sie können die Einträge in Ihrem Browser löschen.',
          ],
        },
      ],
    },
    {
      heading: 'Retro-Browser',
      blocks: [
        {
          type: 'p',
          parts: [
            'Internet Explorer und Netscape Navigator laden fremde Seiten erst, nachdem Sie im Einwahl-Dialog auf „Verbinden“ geklickt haben. Dabei wird Ihre IP-Adresse an den jeweiligen Anbieter übertragen. Archivseiten kommen vom Internet Archive, 300 Funston Avenue, San Francisco, CA 94118, USA (web.archive.org). Außerdem können cameronsworld.net, zombo.com, windows93.net, theoldnet.com, toastytech.com, winhistory.de und arngren.net geladen werden. Andere Adressen laufen über einen Schnappschuss der Wayback Machine.',
          ],
        },
        {
          type: 'p',
          parts: [
            'Diese Anbieter können eigene Cookies setzen und Daten in Drittländer übermitteln, insbesondere in die USA. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a und Art. 49 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Sie widerrufen sie für die Zukunft über „Datei“ und „Offline arbeiten“ oder über „Trennen“ am Verbindungssymbol im Infobereich.',
          ],
        },
      ],
    },
    {
      heading: 'Kontaktformular',
      blocks: [
        {
          type: 'p',
          parts: [
            'Wenn Sie das Formular absenden, verarbeiten wir Name, E-Mail-Adresse, Betreff und Nachricht, um die Anfrage zu beantworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit es um einen Vertrag oder eine vorvertragliche Anfrage geht, sonst Art. 6 Abs. 1 lit. f DSGVO. Die Angaben werden gelöscht, sobald die Anfrage erledigt ist und keine Aufbewahrungspflicht entgegensteht.',
          ],
        },
        {
          type: 'p',
          parts: [
            'Der Versand läuft über Netlify Forms. Netlify speichert die Einsendung und prüft sie mit dem Spamfilter Akismet der Automattic, Inc. (USA), einem Unterauftragnehmer von Netlify. Eine Benachrichtigung geht an das Postfach ',
            mail,
            '. Dieses Postfach wird mit Microsoft 365 betrieben (Microsoft Corporation, One Microsoft Way, Redmond, WA 98052, USA). Microsoft ist nach dem EU-US Data Privacy Framework zertifiziert.',
          ],
        },
        {
          type: 'p',
          parts: [
            'Ein für Menschen unsichtbares Feld dient der Abwehr automatisierter Einsendungen.',
          ],
        },
      ],
    },
    {
      heading: 'Links',
      blocks: [
        {
          type: 'p',
          parts: [
            'Ein Klick auf ',
            { label: 'LinkedIn', href: profile.linkedinUrl },
            ' oder einen anderen externen Link verlässt diese Seite. Erst dann verarbeitet der andere Anbieter Daten. Für diese Seiten sind wir nicht verantwortlich.',
          ],
        },
      ],
    },
    {
      heading: 'Ihre Rechte',
      blocks: [
        {
          type: 'p',
          parts: [
            'Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit sowie das Recht, einer Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO zu widersprechen. Eine Einwilligung können Sie mit Wirkung für die Zukunft widerrufen. Außerdem können Sie sich bei einer Aufsichtsbehörde beschweren.',
          ],
        },
      ],
    },
    {
      heading: 'Aufsichtsbehörde',
      blocks: [
        {
          type: 'lines',
          lines: [
            'Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Rheinland-Pfalz',
            'Hintere Bleiche 34',
            '55116 Mainz',
          ],
        },
        {
          type: 'p',
          parts: [
            'E-Mail: ',
            { label: 'poststelle@datenschutz.rlp.de', href: 'mailto:poststelle@datenschutz.rlp.de' },
          ],
        },
        {
          type: 'p',
          parts: [
            { label: 'datenschutz.rlp.de', href: 'https://www.datenschutz.rlp.de/' },
          ],
        },
      ],
    },
    {
      heading: 'Stand',
      blocks: [{ type: 'p', parts: ['19. Oktober 2026'] }],
    },
    {
      heading: 'Impressum',
      blocks: [
        {
          type: 'p',
          parts: ['Die Anbieterangaben stehen im ', { label: 'Impressum', app: 'impressum' }, '.'],
        },
      ],
    },
  ],
};
