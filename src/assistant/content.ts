import type { AssistantId } from '../settings/settings';

export type AssistantSpeech = {
  text: string;
  animation: string;
};

export type ShowcaseAnimation = {
  id: string;
  label: string;
  line: string;
};

export type AssistantProfile = {
  id: AssistantId;
  name: string;
  galleryName: string;
  description: string;
  galleryQuotes: AssistantSpeech[];
  welcomeAfterWizard: AssistantSpeech;
  welcomeOnBoot: AssistantSpeech[];
  showcaseAnimations: ShowcaseAnimation[];
  discoveryTips: AssistantSpeech[];
  randomRemarks: AssistantSpeech[];
  appReactions: Partial<Record<string, AssistantSpeech>>;
};

export const assistantOrder: AssistantId[] = ['clippy', 'merlin'];

export const assistants: Record<AssistantId, AssistantProfile> = {
  clippy: {
    id: 'clippy',
    name: 'Karl Klammer',
    galleryName: 'Karl Klammer (Clippit)',
    description:
      'Obwohl er eigentlich nur ein dünner gebogener Metalldraht ist, hilft Karl Klammer dabei, Verborgenes auf diesem Schreibtisch aufzuspüren und alles zusammenzuhalten.',
    galleryQuotes: [
      {
        text: 'Wie läuft’s? Immer nur Arbeit und kein Spiel?',
        animation: 'Wave',
      },
      {
        text: 'Es sieht so aus, als bräuchten Sie jemanden, der sich in Windows 98 auskennt!',
        animation: 'GetAttention',
      },
      {
        text: 'Wenn alles andere scheitert: Einfach zwei Blätter Papier zusammenheften!',
        animation: 'Congratulate',
      },
    ],
    welcomeAfterWizard: {
      text: 'Hallo! Ich bin Karl Klammer. Ich bleibe hier unten auf dem Desktop und gebe Ihnen ab und zu subtile Hinweise, was sich auf Stefans Computer alles entdecken lässt!',
      animation: 'Greeting',
    },
    welcomeOnBoot: [
      {
        text: 'Willkommen zurück auf dem Schreibtisch! Klicken Sie mich an, wenn Sie einen kleinen Hinweis für Ihre Entdeckungsreise brauchen.',
        animation: 'Wave',
      },
      {
        text: 'Alle 128 MB RAM sind hochgefahren! Mal sehen, welches Geheimnis Sie heute lüften.',
        animation: 'Greeting',
      },
    ],
    showcaseAnimations: [
      { id: 'GetAttention', label: 'An die Scheibe klopfen', line: 'Klopf, klopf! Jemand vor der Röhre zu Hause?' },
      { id: 'SendMail', label: 'Papierflieger falten', line: 'Achtung, Luftpost auf Bahn 1!' },
      { id: 'GetTechy', label: 'Atom-Modell', line: 'Kurz mal die Elektronen im Pentium II nachzählen...' },
      { id: 'GetWizardy', label: 'Zaubertrick', line: 'Merlin denkt, er wäre hier der Einzige mit einem Zauberstab!' },
      { id: 'EmptyTrash', label: 'Müll rausbringen', line: '0 Byte im Papierkorb – aber das Scheppern macht trotzdem Spaß!' },
      { id: 'Print', label: 'Durch die Druckwalze', line: 'Einmal glattbügeln auf LPT1, bitte!' },
      { id: 'Congratulate', label: 'Feiern', line: 'Tadaa! Das sitzt wie frisch geheftet.' },
      { id: 'Searching', label: 'Mit der Lupe suchen', line: 'Hmm, hier muss doch noch ein Easter Egg versteckt sein...' },
      { id: 'Writing', label: 'Notizen machen', line: 'Ich schreibe das mal lieber auf, bevor der Arbeitsspeicher voll ist.' },
      { id: 'IdleSnooze', label: 'Nickerchen', line: 'Wecken Sie mich, wenn die 56k-Leitung endlich steht... Zzz...' },
    ],
    discoveryTips: [
      {
        text: 'Man munkelt, dass dieser Rechner beim Hochfahren ganz genau hinhört, während der Arbeitsspeicher hochzählt. Wer im richtigen Moment zur »Entf«-Taste greift, landet in einem tiefblauen Raum...',
        animation: 'GetTechy',
      },
      {
        text: 'Wussten Sie schon? Im blauen BIOS-Setup versteckt sich ein Eintrag, mit dem man die Festplatte Sektor für Sektor auf Fehler abklopfen kann – ganz wie früher nach einem Stromausfall.',
        animation: 'Searching',
      },
      {
        text: 'Was passiert wohl, wenn man Windows unter »Start → Beenden...« nicht einfach ausschaltet, sondern die letzte Option ganz unten wählt? Man sagt, auf C:\\GAMES warten dort vier alte Bekannte.',
        animation: 'Thinking',
      },
      {
        text: 'Haben Sie noch ein altes DOS-Spiel als .zip-Archiv auf Ihrem echten Computer? Ziehen Sie die Datei doch mal per Maus direkt mitten ins geöffnete »MS DOS«-Fenster!',
        animation: 'GetAttention',
      },
      {
        text: '25 Zeilen Text sind Ihnen in der DOS-Box zu wenig? Es gibt auf Laufwerk C: ein winziges Programm, das die Zahl 50 im Namen trägt...',
        animation: 'Writing',
      },
      {
        text: 'Ist Ihnen Windows 98 zu neumodisch? In zwei Einstellungsfenstern auf diesem PC gibt es jeweils den letzten Reiter ganz rechts – damit drehen Sie die Uhr bis ins Jahr 1995 zurück, samt Startmelodie!',
        animation: 'GetWizardy',
      },
      {
        text: 'Im Winamp leuchtet grün die verstrichene Zeit. Haben Sie mal direkt auf die Ziffern geklickt? Und über den kleinen Auswurf-Knopf spielt das Deck sogar Musikdateien von Ihrer eigenen Festplatte!',
        animation: 'Congratulate',
      },
      {
        text: 'Wenn das 56k-Modem im Browser erst einmal eingewählt ist, müssen Sie nicht bei den Lesezeichen bleiben. Tippen Sie mal irgendeine Webadresse von damals ein – die Leitung führt direkt ins Jahr 1999!',
        animation: 'Searching',
      },
      {
        text: 'Auf dem Desktop ist kein Netscape-Symbol zu sehen... aber schauen Sie mal genau in die Schnellstartleiste oder ins Startmenü. Und was steht wohl auf der Seite »about:«?',
        animation: 'CheckingSomething',
      },
      {
        text: 'Ein Rechtsklick auf das freie Türkis des Desktops führt zu zehn klassischen Bildschirmschonern. Zwei davon lassen sich unter »Einstellungen...« sogar eigene Botschaften beibringen!',
        animation: 'GetArtsy',
      },
      {
        text: 'Unten rechts neben der Uhrzeit steckt mehr als ein kleiner Regler: Wer auf die Uhr klickt oder zweimal schnell auf den Lautsprecher tippt, öffnet Fenster, die in keinem Startmenü stehen.',
        animation: 'GestureDown',
      },
      {
        text: 'Kleiner Profi-Trick für Minesweeper: Wenn rund um eine aufgedeckte Zahl schon genauso viele Flaggen stehen, wie die Zahl anzeigt, klicken Sie einfach nochmal direkt auf die Zahl!',
        animation: 'Explain',
      },
      {
        text: 'Beim Hochfahren trödelt der Rechner kurz, wenn er nach dem »Primary Slave« sucht. Ungeduldige Naturen drücken in diesem Moment mal auf F4...',
        animation: 'Processing',
      },
      {
        text: 'Neugierig, welche Grafikkarte und welcher Soundblaster in Stefans Kiste stecken? Über den Arbeitsplatz und die Systemsteuerung führt ein Weg direkt in den Geräte-Manager.',
        animation: 'CheckingSomething',
      },
    ],
    randomRemarks: [
      {
        text: 'Es sieht so aus, als würden Sie eine Website aus dem Jahr 1998 betrachten. Soll ich Ihnen helfen, eine Bewerbung per Diskette zu verschicken?',
        animation: 'Writing',
      },
      {
        text: 'Wie läuft’s? Immer nur Arbeit und kein Spiel?',
        animation: 'IdleEyeBrowRaise',
      },
      {
        text: 'Keine Sorge: Für dieses System brauchen Sie garantiert keine 38 Disketten zur Neuinstallation.',
        animation: 'Save',
      },
      {
        text: '85 % der Systemressourcen sind noch frei. Für 1998 ist das quasi Lichtgeschwindigkeit!',
        animation: 'Processing',
      },
      {
        text: 'Ich habe gerade kurz im Papierkorb nachgesehen. Immer noch 0 Byte. Sehr ordentlich!',
        animation: 'EmptyTrash',
      },
      {
        text: 'Hören Sie das auch? Ich glaube, in der Ferne pfeift noch irgendwo ein 56.000-bps-Modem...',
        animation: 'Hearing_1',
      },
      {
        text: 'Ob Stefan wohl weiß, dass ich mich wieder auf seinem Schreibtisch eingenistet habe?',
        animation: 'LookLeft',
      },
      {
        text: 'Tipp des Tages: Vor dem Ausschalten immer brav warten, bis »Sie können den Computer jetzt ausschalten« auf dem Bildschirm steht!',
        animation: 'Alert',
      },
    ],
    appReactions: {
      contact: {
        text: 'Es sieht so aus, als würden Sie Stefan einen Brief schreiben! Keine Briefmarke nötig – ein Klick auf »Senden« genügt.',
        animation: 'SendMail',
      },
      recycle: {
        text: 'Glänzend leer! Hier wurde schon lange nichts mehr weggeworfen.',
        animation: 'EmptyTrash',
      },
      winamp: {
        text: 'It really whips the llama’s ass! Spielen Sie ruhig mal am 10-Band-Equalizer herum.',
        animation: 'Congratulate',
      },
      icq: {
        text: 'Das WinMP Handy! ICQ 99b wählt sich gerade ein. Klicken Sie einen Nickname an — die Antwort kommt per Zufall und meistens daneben.',
        animation: 'GetAttention',
      },
      msdos: {
        text: 'C:\\> – die gute alte Kommandozeile! Probieren Sie oben »Spiele ▾« oder ziehen Sie eine eigene .zip-Datei hinein.',
        animation: 'GetTechy',
      },
      ie: {
        text: 'Vergessen Sie nicht, nach dem Ausflug ins Jahr 1999 unten rechts die Modem-Verbindung wieder zu trennen – sonst wird die Telefonrechnung teuer!',
        animation: 'Searching',
      },
      netscape: {
        text: 'Netscape Navigator 4.85! Klicken Sie mal oben rechts auf das große »N« oder schauen Sie in die Bookmarks.',
        animation: 'Searching',
      },
      minesweeper: {
        text: 'Nur keinen falschen Tritt! Mit Rechtsklick (oder langem Tippen) stecken Sie eine rote Flagge.',
        animation: 'Alert',
      },
      solitaire: {
        text: 'Ein Doppelklick auf eine passende Karte schickt sie direkt nach oben auf den Ablagestapel!',
        animation: 'Explain',
      },
    },
  },
  merlin: {
    id: 'merlin',
    name: 'Merlin',
    galleryName: 'Merlin',
    description:
      'Als weiser Hofmagier aus den Tiefen von Microsoft Agent kennt Merlin jeden Winkel dieses Systems und gibt seine Geheimnisse am liebsten in geheimnisvollen Andeutungen preis.',
    galleryQuotes: [
      {
        text: 'Hallo zusammen, ich bin Merlin. Ich begleite Sie durch die Anwendungsfenster dieses Systems.',
        animation: 'Greet',
      },
      {
        text: 'Willkommen bei Microsoft Windows!',
        animation: 'Announce',
      },
      {
        text: 'Mit ein wenig Magie und einem wachen Auge offenbart dieser Schreibtisch manches verborgene Rätsel...',
        animation: 'DoMagic1',
      },
    ],
    welcomeAfterWizard: {
      text: 'Willkommen bei Microsoft Windows! Ich bin Merlin. Wann immer Ihr nach verborgenen Pfaden auf diesem System sucht, klopft an meinen Zauberhut.',
      animation: 'Announce',
    },
    welcomeOnBoot: [
      {
        text: 'Seid gegrüßt! Ich wache über diesen Schreibtisch und kenne so manches Geheimnis, das unter der Oberfläche schlummert.',
        animation: 'Greet',
      },
      {
        text: 'Willkommen bei Microsoft Windows! Klickt mich an, wenn ich Euch einen rätselhaften Hinweis weisen soll.',
        animation: 'Announce',
      },
    ],
    showcaseAnimations: [
      { id: 'Announce', label: 'Fanfare blasen', line: 'Höret, höret: Willkommen bei Microsoft Windows!' },
      { id: 'DoMagic1', label: 'Zauberspruch wirken', line: 'Abrakadabra – kein einziger Bluescreen weit und breit!' },
      { id: 'DoMagic2', label: 'Großer Funkenzauber', line: 'Ein wenig Sternenstaub für den Pentium II!' },
      { id: 'GetAttention', label: 'An die Scheibe klopfen', line: 'Hallo? Ist dort draußen vor dem Monitor jemand?' },
      { id: 'Reading', label: 'Im Zauberbuch lesen', line: 'Mal sehen, was im Handbuch von 1998 über diese Funktion steht...' },
      { id: 'Searching', label: 'In die Kristallkugel blicken', line: 'Ich blicke tief in die Röhre... ich sehe versteckte Easter Eggs!' },
      { id: 'Process', label: 'Im Zauberkessel rühren', line: 'Ein Löffel React, eine Prise 1998 und zwei Tropfen Nostalgie...' },
      { id: 'Suggest', label: 'Geistesblitz', line: 'Heureka! Mir ist gerade ein vorzüglicher Hinweis eingefallen.' },
      { id: 'Congratulate', label: 'Pokal herbeizaubern', line: 'Meisterhaft! Dafür gebührt Euch dieser güldene Kelch.' },
      { id: 'Writing', label: 'Mit der Feder schreiben', line: 'Ich notiere das geschwind in der Chronik von sa85.' },
    ],
    discoveryTips: [
      {
        text: 'Wenn die weißen Zahlen des Speichers beim Erwachen der Maschine hochzählen, öffnet die Taste »Entf« ein tiefblaues Heiligtum. Wer dort nach ScanDisk ruft, sieht die Sektoren tanzen.',
        animation: 'DoMagic1',
      },
      {
        text: 'Wer dem Grafischen entsagt und unter »Start → Beenden...« den letzten Pfad des reinen MS-DOS wählt, findet in den Katakomben von C:\\GAMES vier alte Spiellegenden.',
        animation: 'Reading',
      },
      {
        text: 'In der schwarzen DOS-Konsole herrscht das Maß von 25 Zeilen – doch wer dort das Zauberwort »MODE50« spricht, verdoppelt sein Sichtfeld wie durch eine alte VGA-Linse.',
        animation: 'Suggest',
      },
      {
        text: 'Das Fenster »MS DOS« nimmt auch Gaben aus Eurer eigenen Welt entgegen: Zieht ein gepacktes .zip-Spiel direkt vom eigenen Rechner hinein, und die Maschine erweckt es zum Leben.',
        animation: 'DoMagic2',
      },
      {
        text: 'Ein einzelner Reiter in den System- oder Anzeigeeigenschaften vermag das Jahr 1998 in das Jahr 1995 zu verwandeln. Selbst die Fanfare beim nächsten Systemstart klingt dann wie einst!',
        animation: 'Announce',
      },
      {
        text: 'Der dunkle Klangkasten namens Winamp birgt zwei Geheimnisse: Ein Klick auf die grünen Zeitziffern kehrt den Lauf der Zeit um – und über »ADD« spielt er selbst Lieder von Eurer Festplatte.',
        animation: 'Explain',
      },
      {
        text: 'Sobald die beiden kleinen Bildschirme unten rechts im Infobereich leuchten, steht das Tor ins Jahr 1999 offen. Tippt im Browser eine beliebige Adresse von damals in die Zeile!',
        animation: 'Searching',
      },
      {
        text: 'Nicht jeder Browser liegt offen auf dem Tisch: Haltet im Startmenü oder in der Schnellstartleiste nach dem alten Nebenbuhler von Microsoft Ausschau – und studiert seine »about:«-Seite.',
        animation: 'Think',
      },
      {
        text: 'Rührt Ihr dreißig Sekunden lang keine Maus, erwachen die Geister der Röhre. Doch wer auf dem freien Türkis die rechte Maustaste bemüht, kann zehn Schoner prüfen und zweien eigene Worte lehren.',
        animation: 'Process',
      },
      {
        text: 'Blickt in die rechte untere Ecke der Taskleiste: Ein Klick auf die Uhrzeit oder ein rascher Doppelklick auf das kleine Hörrohr öffnet Kammern, die im Startmenü verborgen bleiben.',
        animation: 'GestureDown',
      },
      {
        text: 'Im Minenfeld genügt ein Klick auf eine bereits aufgedeckte Zahl, um alle Nachbarfelder auf einmal zu lichten – sofern ringsum die richtige Zahl an Flaggen weht.',
        animation: 'Suggest',
      },
      {
        text: 'Im grünen Kartensaal von Solitär entscheidet das Menü »Spiel«, ob das Schicksal eine oder drei Karten zieht. Und wer gewinnt, erlebt den legendären Kartentanz!',
        animation: 'Congratulate',
      },
      {
        text: 'Wenn die Maschine beim Kaltstart nach einem zweiten Laufwerk horcht und der Cursor blinkt, verkürzt ein kundiger Druck auf die Taste F4 die Geduldsprobe.',
        animation: 'Pleased',
      },
      {
        text: 'Wandert über den Arbeitsplatz und die Systemsteuerung bis in den Geräte-Manager: Dort steht jede einzelne Steckkarte dieser Zeitmaschine fein säuberlich verzeichnet.',
        animation: 'Reading',
      },
    ],
    randomRemarks: [
      {
        text: 'Hallo zusammen, ich bin Merlin. Ich begleite Sie durch die Anwendungsfenster dieses Systems.',
        animation: 'Greet',
      },
      {
        text: 'Willkommen bei Microsoft Windows!',
        animation: 'Announce',
      },
      {
        text: 'Bei meinem Bart! Ein Pentium II mit 350 MHz – welch unerhörte Rechengewalt für das ausgehende Jahrtausend.',
        animation: 'Surprised',
      },
      {
        text: 'In meiner Kristallkugel sehe ich... Türkis. Sehr viel Türkis (#008080, um genau zu sein).',
        animation: 'Searching',
      },
      {
        text: 'Fürchtet Euch nicht vor dem Jahr-2000-Problem – ich habe die Echtzeituhr persönlich verzaubert.',
        animation: 'DoMagic1',
      },
      {
        text: 'Manche nennen es Quellcode, ich nenne es Spruchrollen in React, PHP und Ruby on Rails.',
        animation: 'Reading',
      },
      {
        text: 'Ein Klick auf meinen Zauberhut entlockt mir bisweilen ein Kunststück oder einen verborgenen Hinweis zur Entdeckungsreise...',
        animation: 'Suggest',
      },
      {
        text: 'Ruhe im Karton! Ich versuche gerade auszurechnen, wie viele bunte Röhren in den Bildschirmschoner passen.',
        animation: 'Thinking',
      },
    ],
    appReactions: {
      contact: {
        text: 'Eine Botschaft an den Hausherrn! Verfasst Eure Zeilen, der elektronische Bote trägt sie geschwind davon.',
        animation: 'Writing',
      },
      recycle: {
        text: 'Ich blicke in den Papierkorb... gähnende Leere, kein einziges Pergament darin!',
        animation: 'LookDown',
      },
      winamp: {
        text: 'Musik aus den Neunzigern! Vergesst nicht, an den zehn Reglern des Klangzaubers zu schieben.',
        animation: 'Pleased',
      },
      icq: {
        text: 'Ein WinMP Handy mit ICQ! Die fünf Nicknames sind erfunden, ihre Sprüche leider auch.',
        animation: 'Announce',
      },
      msdos: {
        text: 'Die alten Runen von MS-DOS! Wählt oben ein Spiel oder zieht ein eigenes .zip-Archiv in das schwarze Feld.',
        animation: 'DoMagic1',
      },
      ie: {
        text: 'Das Weltweite Gewebe von 1998! Sobald das Modem pfeift, führt jede Adresse in die Vergangenheit.',
        animation: 'Searching',
      },
      netscape: {
        text: 'Ah, das stolze Schiff von Netscape! Klickt auf die Lesezeichen, um längst vergangene Welten zu bereisen.',
        animation: 'Searching',
      },
      minesweeper: {
        text: 'Bedenkt jeden Schritt mit Bedacht – unter manchem grauen Stein schlummert schwarzes Pulver!',
        animation: 'Think',
      },
      solitaire: {
        text: 'Mögen die Asse Euch wohlgesonnen sein! Ein Doppelklick sendet passende Karten direkt hinauf.',
        animation: 'Pleased',
      },
    },
  },
};
