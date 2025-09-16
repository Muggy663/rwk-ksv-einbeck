// src/lib/faq-search.ts
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  section: string;
  keywords: string[];
}

const faqDatabase: FAQItem[] = [
  {
    id: "aufstieg-kreisoberliga",
    question: "Wie funktioniert der Aufstieg in die Kreisoberliga?",
    answer: "Nach RWK-Ordnung §16.2 steigt der Erste jeder Liga automatisch auf. Bei Gleichstand entscheidet der direkte Vergleich der letzten 3 Durchgänge.",
    section: "§16 Auf-/Abstieg",
    keywords: ["aufstieg", "kreisoberliga", "erster", "platz", "liga"]
  },
  {
    id: "abstieg-regelung",
    question: "Wann steigt eine Mannschaft ab?",
    answer: "Der Letzte jeder Liga steigt automatisch ab. Der Vorletzte kann gegen den Zweiten der niedrigeren Liga in einem Vergleichswettkampf antreten.",
    section: "§16 Auf-/Abstieg",
    keywords: ["abstieg", "letzter", "vorletzter", "vergleichswettkampf"]
  },
  {
    id: "siegerehrung-gleichstand",
    question: "Wie wird bei Gleichstand entschieden?",
    answer: "Bei Ringgleichheit entscheidet die höhere letzte Serie. Ist auch diese gleich, zählt die höhere vorletzte Serie, und so weiter. Sollte keine Entscheidung möglich sein, gilt die DSB-Sportordnung.",
    section: "§13 Siegerehrung",
    keywords: ["gleichstand", "ringgleichheit", "letzte", "serie", "dsb", "sportordnung"]
  },
  {
    id: "wanderpokal-rueckgabe",
    question: "Was passiert wenn der Wanderpokal nicht zurückgegeben wird?",
    answer: "Wird der Wanderpokal nicht rechtzeitig zurückgegeben, wird ein Strafgeld von 25,00€ dem Verein in Rechnung gestellt. Bei Verlust werden 50,00€ Strafgeld verhängt.",
    section: "§13 Siegerehrung",
    keywords: ["wanderpokal", "rückgabe", "strafgeld", "25", "50", "euro", "verlust"]
  },
  {
    id: "damen-wertung",
    question: "Wie werden Damen in gemischten Mannschaften gewertet?",
    answer: "Damen, die in der offenen Klasse bzw. in gemischten Mannschaften mitschießen, werden von der Kreisdamenleiterin separat geführt und geehrt. Das Mannschaftsergebnis bleibt davon ausgenommen.",
    section: "§13 Siegerehrung",
    keywords: ["damen", "gemischt", "mannschaft", "kreisdamenleiterin", "separat"]
  },
  {
    id: "ersatzschuetzen-regelung",
    question: "Wie viele Ersatzschützen sind erlaubt?",
    answer: "Nach RWK-Ordnung §12 sind Ersatzschützen unter bestimmten Bedingungen erlaubt. Details regelt die aktuelle RWK-Ordnung.",
    section: "§12 Ersatzschützen",
    keywords: ["ersatz", "schützen", "erlaubt", "bedingungen"]
  },

  {
    id: "durchgaenge-anzahl",
    question: "Wie viele Durchgänge gibt es?",
    answer: "Bei Kleinkaliber werden 5 Durchgänge geschossen, bei Luftdruck-Disziplinen (LG, LP) sind es 4 Durchgänge.",
    section: "Allgemein",
    keywords: ["durchgänge", "5", "4", "kleinkaliber", "luftdruck", "lg", "lp"]
  },
  {
    id: "spielberechtigung",
    question: "Wann ist ein Schütze spielberechtigt?",
    answer: "Ein Schütze muss ordnungsgemäß gemeldet und dem Team zugeordnet sein. Pro Saison und Disziplin darf er nur in einem Team spielen.",
    section: "Allgemein",
    keywords: ["spielberechtigung", "gemeldet", "team", "saison", "disziplin"]
  },
  {
    id: "wettkampftermine",
    question: "Wann finden die Wettkämpfe statt?",
    answer: "Die Wettkampftermine werden zu Saisonbeginn festgelegt und im Terminkalender der App veröffentlicht. Änderungen werden rechtzeitig bekannt gegeben.",
    section: "Organisation",
    keywords: ["termine", "wettkampf", "saisonbeginn", "terminkalender", "app"]
  },
  {
    id: "klasseneinteilung",
    question: "Wie erfolgt die Klasseneinteilung?",
    answer: "Die Einteilung erfolgt in Kreisoberliga, Kreisliga, 1. Kreisklasse usw. Luftgewehr Auflage und KK-Gewehr haben Ligasystem, Pistolen-Disziplinen meist offene Klassen. Neue Vereine starten in der untersten Klasse.",
    section: "§6 Klasseneinteilung",
    keywords: ["klasseneinteilung", "liga", "kreisoberliga", "kreisliga", "kreisklasse", "klassen"]
  },
  {
    id: "disziplinen-uebersicht",
    question: "Welche Disziplinen gibt es?",
    answer: "Luftdruck: Lichtpunktgewehr Auflage, Luftgewehr Freihand/Auflage, Luftpistole. Kleinkaliber: KK-Gewehr Auflage, KK-Sportpistole. Verschiedene Altersklassen von Schüler bis Senioren.",
    section: "§3 Disziplinen",
    keywords: ["disziplinen", "luftgewehr", "luftpistole", "kleinkaliber", "sportpistole", "lichtpunkt"]
  },
  {
    id: "mannschaftsgroesse",
    question: "Wie groß ist eine Mannschaft?",
    answer: "Jede Mannschaft besteht aus 3 Schützen. Die besten 3 Ergebnisse werden für die Mannschaftswertung gezählt.",
    section: "§5 Meldungen",
    keywords: ["mannschaft", "3", "schützen", "größe", "team"]
  },
  {
    id: "startgelder",
    question: "Wie hoch sind die Startgelder?",
    answer: "Die Höhe des Startgeldes wird auf der Delegiertenversammlung beim Kreisschützentag festgesetzt und vom Kreisschatzmeister den Vereinen in Rechnung gestellt.",
    section: "§9 Startgelder",
    keywords: ["startgeld", "kosten", "delegiertenversammlung", "kreisschatzmeister"]
  },
  {
    id: "wann-luftdruck",
    question: "Wann ist der Rundenwettkampf Luftdruck?",
    answer: "Der Rundenwettkampf Luftdruckwaffen beginnt am 1. Oktober und endet am 1. März des darauffolgenden Jahres.",
    section: "§3 Disziplinen",
    keywords: ["luftdruck", "oktober", "märz", "wann", "termine", "saison"]
  },
  {
    id: "wann-kleinkaliber",
    question: "Wann ist der Rundenwettkampf Kleinkaliber?",
    answer: "Der Rundenwettkampf Kleinkaliber beginnt am 01. Mai und endet am 15. August.",
    section: "§3 Disziplinen",
    keywords: ["kleinkaliber", "mai", "august", "wann", "termine", "kk"]
  },
  {
    id: "was-ist-lichtpunkt",
    question: "Was ist Lichtpunktgewehr?",
    answer: "Lichtpunktgewehr Auflage mit 20 Schuss. Startberechtigt sind Schützen ab 6 bis 12 Jahre. Eine spezielle Disziplin für die jüngsten Schützen.",
    section: "§3 Disziplinen",
    keywords: ["lichtpunkt", "lichtpunktgewehr", "kinder", "6", "12", "jahre", "20", "schuss"]
  },
  {
    id: "alter-luftgewehr",
    question: "Ab welchem Alter darf ich Luftgewehr schießen?",
    answer: "Luftgewehr Freihand ab 15 Jahre (40 Schuss) oder Schüler 12-14 Jahre (20 Schuss). Luftgewehr Auflage ab 41 Jahre oder Schüler 12-14 Jahre (30 Schuss).",
    section: "§3 Disziplinen",
    keywords: ["alter", "luftgewehr", "15", "41", "schüler", "12", "14", "jahre"]
  },
  {
    id: "alter-luftpistole",
    question: "Ab welchem Alter darf ich Luftpistole schießen?",
    answer: "Luftpistole ab 15 Jahre (40 Schuss) oder Schüler 12-14 Jahre (20 Schuss Auflage). Verschiedene Varianten je nach Alter verfügbar.",
    section: "§3 Disziplinen",
    keywords: ["alter", "luftpistole", "15", "schüler", "12", "14", "jahre", "pistole"]
  },
  {
    id: "wo-wettkampf",
    question: "Wo findet der Wettkampf statt?",
    answer: "Der RWK-Leiter setzt den ersten Wettkampfort fest (erste Mannschaft in der Gruppe). Weitere Termine legen die Gruppen selbst fest. Bei Problemen muss der Gastgeber Ersatz organisieren.",
    section: "§4 Wettkampftermine",
    keywords: ["wo", "ort", "wettkampfort", "gastgeber", "gruppe", "termine"]
  },
  {
    id: "wer-darf-mitmachen",
    question: "Wer darf am Rundenwettkampf teilnehmen?",
    answer: "Startberechtigt sind Mitglieder des KSV Einbeck, die über ihren Verein dem NSSV gemeldet und ausreichend versichert sind. Schießsportgemeinschaften ohne Vereinsstatus sind nicht startberechtigt.",
    section: "§7 Startberechtigung",
    keywords: ["wer", "teilnehmen", "mitglieder", "ksv", "nssv", "versichert", "startberechtigt"]
  },
  {
    id: "mehrere-vereine",
    question: "Kann ich für mehrere Vereine starten?",
    answer: "Nein, pro Disziplin nur für einen Verein. Bei mehreren Vereinsmitgliedschaften können Sie frei wählen. Doppelstarts führen zur Wertung 'außer Konkurrenz'.",
    section: "§7 Startberechtigung",
    keywords: ["mehrere", "vereine", "doppelstart", "außer", "konkurrenz", "wählen"]
  },
  {
    id: "neuer-verein",
    question: "Wo startet ein neuer Verein?",
    answer: "Startet ein Verein zum ersten Mal, muss die Mannschaft in der untersten Klasse beginnen. Erst im darauffolgenden Jahr kann ein Aufstieg erfolgen.",
    section: "§7 Startberechtigung",
    keywords: ["neuer", "verein", "erste", "mal", "unterste", "klasse", "beginnen"]
  },
  {
    id: "was-brauche-ich",
    question: "Was brauche ich zum Wettkampf?",
    answer: "Der Gastgeber stellt Scheiben und Anlagen. Sie müssen eigene Sportgeräte, Munition und ggf. Hocker mitbringen. Erkundigen Sie sich vorher nach der Ausstattung.",
    section: "§8 Schießstände",
    keywords: ["was", "brauchen", "mitbringen", "sportgeräte", "munition", "hocker", "ausstattung"]
  },
  {
    id: "scheiben-aufbewahren",
    question: "Wie lange müssen Scheiben aufbewahrt werden?",
    answer: "Beschossene Scheiben und elektronische Wettkampfprotokolle müssen bis nach der Siegerehrung aufbewahrt werden.",
    section: "§8 Schießstände",
    keywords: ["scheiben", "aufbewahren", "siegerehrung", "protokoll", "elektronisch"]
  },
  {
    id: "vorschießen-nachschießen",
    question: "Kann ich vor- oder nachschießen?",
    answer: "Ja, zwischen den Durchgängen liegen 3 Wochen für Vor-/Nachschießen. Nur der letzte Durchgang darf nachgeschossen werden. Verkürzung nur mit Zustimmung aller Mannschaftsführer.",
    section: "§10 Vor-/Nachschießen",
    keywords: ["vorschießen", "nachschießen", "3", "wochen", "durchgang", "zustimmung"]
  },
  {
    id: "protokoll-abgabe",
    question: "Wann muss ich das Protokoll abgeben?",
    answer: "Protokolle müssen innerhalb von 3 Tagen nach dem Wettkampf per E-Mail an den RWK-Leiter gesendet werden. Bevorzugte Formate: PDF, Excel oder JPEG.",
    section: "§11 Protokollführung",
    keywords: ["protokoll", "abgabe", "3", "tage", "email", "pdf", "excel"]
  },
  {
    id: "unleserlich-protokoll",
    question: "Was passiert bei unleserlichen Protokollen?",
    answer: "Bei unleserlichen Angaben erfolgt keine Wertung. Protokolle müssen ordnungsgemäß und leserlich ausgefüllt werden.",
    section: "§11 Protokollführung",
    keywords: ["unleserlich", "protokoll", "keine", "wertung", "leserlich"]
  },
  {
    id: "mannschaftswechsel",
    question: "Kann ein Schütze die Mannschaft wechseln?",
    answer: "Nein, ist ein Schütze bereits in einer Mannschaft gewertet, kann er nicht in eine andere Mannschaft derselben Liga wechseln.",
    section: "§12 Ersatzschützen",
    keywords: ["mannschaftswechsel", "wechseln", "andere", "mannschaft", "liga"]
  },
  {
    id: "schütze-fällt-aus",
    question: "Was passiert wenn ein Schütze ausfällt?",
    answer: "Bei Ausfall kann ein Ersatzschütze einspringen. Bisherige Ergebnisse werden übertragen. Ohne Ersatz werden zukünftige Ergebnisse auf null gesetzt. RWK-Leiter informieren!",
    section: "§12 Ersatzschützen",
    keywords: ["ausfall", "schütze", "ersatz", "einspringen", "übertragen", "null"]
  },
  {
    id: "urkunden-pokale",
    question: "Welche Auszeichnungen gibt es?",
    answer: "Einzelsieger erhalten Urkunden. Die Siegermannschaft bekommt einen Wanderpokal und eine Urkunde. Der Pokal muss zur nächsten Siegerehrung zurückgegeben werden.",
    section: "§13 Siegerehrung",
    keywords: ["urkunden", "pokale", "wanderpokal", "auszeichnung", "sieger", "zurückgeben"]
  },
  {
    id: "einspruch-kosten",
    question: "Was kostet ein Einspruch?",
    answer: "Die Einspruchsgebühr beträgt 25,00€. Einsprüche müssen schriftlich mit Begründung an den RWK-Leiter gerichtet werden.",
    section: "§14 Einsprüche",
    keywords: ["einspruch", "kosten", "25", "euro", "gebühr", "schriftlich"]
  },
  {
    id: "scheiben-manipulation",
    question: "Darf ich Schusslöcher verändern?",
    answer: "Nein! Schusslöcher dürfen nicht verändert werden (kein Schusslochprüfer, Kugelschreiber etc.). Auch Fransen-Abkratzen ist verboten. Bei Manipulation droht Ausschluss.",
    section: "§15 Betrug",
    keywords: ["manipulation", "schusslöcher", "verändern", "betrug", "ausschluss", "verboten"]
  },
  {
    id: "wer-steigt-auf",
    question: "Wer steigt auf?",
    answer: "Der Erste jeder Liga steigt automatisch auf. Der Zweite kann aufsteigen, wenn sein Ergebnis besser ist als der Vorletzte der höheren Liga.",
    section: "§16 Auf-/Abstieg",
    keywords: ["aufstieg", "erster", "zweiter", "vorletzter", "automatisch"]
  },
  {
    id: "wer-steigt-ab",
    question: "Wer steigt ab?",
    answer: "Der Letzte jeder Liga steigt automatisch ab. Der Vorletzte steigt ab, wenn der Zweite der niedrigeren Liga besser ist.",
    section: "§16 Auf-/Abstieg",
    keywords: ["abstieg", "letzter", "vorletzter", "automatisch", "niedrigere"]
  },
  {
    id: "bezirksliga-aufstieg",
    question: "Wie komme ich in die Bezirksliga?",
    answer: "Gruppensieger und Zweitplatzierte der Kreisoberliga und offenen Klassen qualifizieren sich für das Aufstiegsschießen (Relegation) der Bezirksliga Göttingen.",
    section: "§17 Bezirksliga",
    keywords: ["bezirksliga", "relegation", "aufstiegsschießen", "göttingen", "qualifizieren"]
  },
  {
    id: "nicht-antreten",
    question: "Was passiert wenn wir nicht antreten?",
    answer: "Tritt eine Mannschaft ohne triftigen Grund nicht zum Wettkampf an, scheidet sie aus. Das Startgeld verfällt.",
    section: "§5 Meldungen",
    keywords: ["nicht", "antreten", "ausscheiden", "startgeld", "verfällt", "grund"]
  },
  {
    id: "meldeschluss",
    question: "Bis wann muss ich melden?",
    answer: "Luftdruck bis zum Ilmepokalschießen, Kleinkaliber bis 31. März. Verspätete Meldungen nur in Ausnahmefällen, nicht nach Gruppeneinteilung.",
    section: "§5 Meldungen",
    keywords: ["meldeschluss", "melden", "ilmepokal", "märz", "verspätet", "ausnahme"]
  },
  {
    id: "einzelschütze",
    question: "Kann ich als Einzelschütze mitmachen?",
    answer: "Ja, Einzelschützen werden Mannschaften zwecks Fahrgemeinschaften zugeordnet. Sie nehmen an der Einzelwertung teil.",
    section: "§2 Zweck",
    keywords: ["einzelschütze", "einzeln", "fahrgemeinschaft", "einzelwertung", "zugeordnet"]
  },
  {
    id: "schüler-schusszahl",
    question: "Wie viele Schuss schießen Schüler?",
    answer: "Schüler (12-14 Jahre): Luftgewehr Freihand 20 Schuss, Luftgewehr Auflage 30 Schuss, Luftpistole Auflage 20 Schuss. Lichtpunkt (6-12 Jahre): 20 Schuss.",
    section: "§3 Disziplinen",
    keywords: ["schüler", "schuss", "20", "30", "12", "14", "jahre", "kinder"]
  },
  {
    id: "versicherung",
    question: "Brauche ich eine Versicherung?",
    answer: "Ja, alle Teilnehmer müssen ausreichend gegen Haftpflicht und Unfall versichert sein. Dies erfolgt über die Vereinsmitgliedschaft.",
    section: "§7 Startberechtigung",
    keywords: ["versicherung", "haftpflicht", "unfall", "versichert", "verein"]
  },
  {
    id: "nssv-meldung",
    question: "Was bedeutet NSSV-Meldung?",
    answer: "Sie müssen über Ihren Verein dem Niedersächsischen Sportschützenverband (NSSV) gemeldet sein. Dies ist Voraussetzung für die Startberechtigung.",
    section: "§7 Startberechtigung",
    keywords: ["nssv", "niedersächsisch", "sportschützenverband", "gemeldet", "voraussetzung"]
  },
  {
    id: "qualifiziertes-personal",
    question: "Wer leitet den Wettkampf?",
    answer: "Der gastgebende Verein stellt qualifiziertes Personal zur Durchführung und Leitung des Wettkampfs. Diese Person überwacht den ordnungsgemäßen Ablauf.",
    section: "§8 Schießstände",
    keywords: ["personal", "leitung", "wettkampf", "gastgeber", "durchführung"]
  },
  {
    id: "eigene-ausrüstung",
    question: "Muss ich meine eigene Ausrüstung mitbringen?",
    answer: "Ja, für Sportgeräte und Munition müssen Sie selbst sorgen. Bei besonderen Bedürfnissen (z.B. Hocker zum Sitzen) vorher beim Gastgeber erkundigen.",
    section: "§8 Schießstände",
    keywords: ["ausrüstung", "sportgeräte", "munition", "mitbringen", "hocker", "sitzen"]
  },
  {
    id: "3-wochen-regel",
    question: "Warum 3 Wochen zwischen Durchgängen?",
    answer: "Die 3-Wochen-Frist ermöglicht Schichtarbeitern, Erkrankten oder Urlaubern das Vor- oder Nachschießen. Verkürzung nur mit Zustimmung aller Mannschaftsführer.",
    section: "§10 Vor-/Nachschießen",
    keywords: ["3", "wochen", "schichtarbeiter", "erkrankt", "urlaub", "verkürzung"]
  },
  {
    id: "wo-nachschießen",
    question: "Wo darf ich nachschießen?",
    answer: "Vor- oder Nachschießen ist nur auf dem Stand erlaubt, wo der Durchgang stattfindet/stattfand. Ausnahmen nur mit Zustimmung aller Mannschaftsführer.",
    section: "§10 Vor-/Nachschießen",
    keywords: ["wo", "nachschießen", "stand", "ausnahme", "zustimmung", "mannschaftsführer"]
  },
  {
    id: "unterschrift-protokoll",
    question: "Wer muss das Protokoll unterschreiben?",
    answer: "Das Protokoll muss vom Wettkampfleiter (Gastgeber) und dem jeweiligen Mannschaftsführer unterschrieben werden. Beide bestätigen die Richtigkeit.",
    section: "§11 Protokollführung",
    keywords: ["unterschrift", "protokoll", "wettkampfleiter", "mannschaftsführer", "bestätigen"]
  },
  {
    id: "nachschießen-eintragen",
    question: "Wo trage ich Nachschießergebnisse ein?",
    answer: "Nachschießergebnisse müssen auf der Liste des darauffolgenden Durchgangs eingetragen werden, sonst gibt es keine Wertung.",
    section: "§11 Protokollführung",
    keywords: ["nachschießen", "eintragen", "darauffolgende", "durchgang", "wertung"]
  },
  {
    id: "damen-extra-wertung",
    question: "Werden Damen extra gewertet?",
    answer: "Ja, Damen in offenen Klassen oder gemischten Mannschaften werden von der Kreisdamenleiterin separat geführt und geehrt. Das Mannschaftsergebnis bleibt unverändert.",
    section: "§13 Siegerehrung",
    keywords: ["damen", "extra", "separat", "kreisdamenleiterin", "gemischt", "geehrt"]
  },
  {
    id: "pokal-verloren",
    question: "Was kostet es wenn der Pokal verloren geht?",
    answer: "Bei Verlust des Wanderpokals wird ein Strafgeld von 50,00€ verhängt. Bei verspäteter Rückgabe sind es 25,00€.",
    section: "§13 Siegerehrung",
    keywords: ["pokal", "verloren", "50", "euro", "strafgeld", "25", "verspätet"]
  },
  {
    id: "sportkommission",
    question: "Wer entscheidet bei Einsprüchen?",
    answer: "Der Sportausschuss berät über Einsprüche, die Sportkommission entscheidet endgültig. Einsprüche kosten 25,00€ Gebühr.",
    section: "§14 Einsprüche",
    keywords: ["sportkommission", "sportausschuss", "entscheidet", "einspruch", "berät"]
  },
  {
    id: "schusslochprüfer-verboten",
    question: "Darf ich einen Schusslochprüfer verwenden?",
    answer: "Nein! Schusslöcher dürfen nicht mit Schusslochprüfer, Kugelschreiber oder ähnlichen Gegenständen verändert werden. Das ist Betrug und führt zum Ausschluss.",
    section: "§15 Betrug",
    keywords: ["schusslochprüfer", "kugelschreiber", "verboten", "betrug", "ausschluss"]
  },
  {
    id: "fransen-abkratzen",
    question: "Darf ich Fransen von der Scheibe entfernen?",
    answer: "Nein, das Abkratzen der 'Fransen' von der Rückseite beschossener Scheiben ist nicht gestattet. Das gilt als Manipulation.",
    section: "§15 Betrug",
    keywords: ["fransen", "abkratzen", "scheibe", "rückseite", "manipulation", "verboten"]
  },
  {
    id: "direkter-aufstieg-unmöglich",
    question: "Kann ich direkt von 2. Kreisklasse in Kreisoberliga?",
    answer: "Nein, ein direkter Aufstieg von der 2. Kreisklasse in die Kreisoberliga ist nicht möglich. Auch direkter Abstieg von Kreisoberliga in 2. Kreisklasse ist unmöglich.",
    section: "§16 Auf-/Abstieg",
    keywords: ["direkter", "aufstieg", "2", "kreisklasse", "kreisoberliga", "unmöglich"]
  },
  {
    id: "abmeldung-nach-meldeschluss",
    question: "Was passiert bei Abmeldung nach Meldeschluss?",
    answer: "Bei Abmeldung nach Meldeschluss steigt die Mannschaft automatisch in die nächst niedrigere Liga ab. Dadurch steigt eventuell keine andere Mannschaft aus Leistungsgründen ab.",
    section: "§16 Auf-/Abstieg",
    keywords: ["abmeldung", "meldeschluss", "automatisch", "abstieg", "niedrigere"]
  },
  {
    id: "dsb-sportordnung",
    question: "Was gilt wenn die RWK-Ordnung nichts regelt?",
    answer: "Für alle nicht in der RWK-Ordnung aufgeführten Punkte gelten die Regelungen der DSB-Sportordnung nach sportlichen Gesichtspunkten.",
    section: "§19 Schlussbemerkung",
    keywords: ["dsb", "sportordnung", "nicht", "geregelt", "sportlich"]
  },
  {
    id: "fotos-veröffentlichung",
    question: "Dürfen Fotos von mir veröffentlicht werden?",
    answer: "Mit der Meldung stimmen Sie der Veröffentlichung von Fotos und Ergebnislisten in Aushängen, Internet und Publikationen des KSVE zu.",
    section: "§19 Schlussbemerkung",
    keywords: ["fotos", "veröffentlichung", "meldung", "internet", "aushang", "zustimmung"]
  },
  {
    id: "rechtsweg-ausgeschlossen",
    question: "Kann ich vor Gericht klagen?",
    answer: "Nein, der Rechtsweg ist ausgeschlossen. Alle Streitigkeiten werden vereinsintern durch die Sportkommission entschieden.",
    section: "§19 Schlussbemerkung",
    keywords: ["rechtsweg", "gericht", "klagen", "ausgeschlossen", "sportkommission"]
  },

  // === ROLLEN-SYSTEM & BERECHTIGUNGEN ===
  {
    id: "was-ist-rollensystem",
    question: "Was ist das neue Rollen-System?",
    answer: "Das neue 3-Tier-Rollen-System teilt Berechtigungen in Platform-Rollen (SUPER_ADMIN), KV-Rollen (KV_WETTKAMPFLEITER) und Club-Rollen (VORSTAND, SPORTLEITER, KASSENWART, SCHRIFTFUEHRER) auf. Jede Rolle hat spezifische Zugriffe.",
    section: "Rollen-System",
    keywords: ["rollen", "system", "3-tier", "platform", "kv", "club", "berechtigungen"]
  },
  {
    id: "welche-club-rollen",
    question: "Welche Club-Rollen gibt es?",
    answer: "Basis-Rollen: VORSTAND (Vollzugriff), SPORTLEITER (RWK+KM), KASSENWART (Finanzen+Mitglieder), SCHRIFTFUEHRER (Protokolle+Mitglieder-Lesezugriff). Erweiterte Rollen: JUGENDWART, DAMENWART, ZEUGWART, PRESSEWART, TRAINER, AUSBILDER, VEREINSSCHUETZE, EHRENMITGLIED.",
    section: "Rollen-System",
    keywords: ["club", "rollen", "vorstand", "sportleiter", "kassenwart", "schriftfuehrer", "jugendwart", "damenwart"]
  },
  {
    id: "was-darf-vorstand",
    question: "Was darf der Vorstand?",
    answer: "Der Vorstand hat Vollzugriff auf alle Vereinssoftware-Bereiche: Mitgliederverwaltung, Finanzen & SEPA, Geburtstage & Jubiläen, Lizenzen & Ausbildungen, Vereinsrecht & Protokolle, Aufgaben-Management. Zusätzlich RWK- und KM-Zugriff.",
    section: "Rollen-System",
    keywords: ["vorstand", "vollzugriff", "mitglieder", "finanzen", "sepa", "protokolle", "aufgaben"]
  },
  {
    id: "was-darf-kassenwart",
    question: "Was darf der Kassenwart?",
    answer: "Der Kassenwart kann Mitglieder verwalten, SEPA-Lastschrift & Beiträge verwalten, Geburtstage & Jubiläen verwalten und Finanz-Statistiken einsehen. Kein Zugriff auf Protokolle oder Aufgaben-Management.",
    section: "Rollen-System",
    keywords: ["kassenwart", "mitglieder", "sepa", "beiträge", "finanzen", "jubiläen", "statistiken"]
  },
  {
    id: "was-darf-schriftfuehrer",
    question: "Was darf der Schriftführer?",
    answer: "Der Schriftführer hat Lesezugriff auf Mitglieder, kann Vereinsrecht & Protokolle verwalten, Sitzungen verwalten und Wahlen & Beschlüsse durchführen. Kein Zugriff auf Finanzen oder Aufgaben-Management.",
    section: "Rollen-System",
    keywords: ["schriftfuehrer", "protokolle", "vereinsrecht", "sitzungen", "wahlen", "beschlüsse"]
  },
  {
    id: "was-darf-sportleiter",
    question: "Was darf der Sportleiter?",
    answer: "Der Sportleiter hat Lesezugriff auf Mitglieder (für Mannschaftsplanung), kann Lizenzen & Ausbildungen verwalten, Sport-Statistiken einsehen und hat Vollzugriff auf RWK- und KM-Bereiche.",
    section: "Rollen-System",
    keywords: ["sportleiter", "mitglieder", "lesezugriff", "lizenzen", "ausbildungen", "rwk", "km"]
  },
  {
    id: "was-darf-jugendwart",
    question: "Was darf der Jugendwart?",
    answer: "Der Jugendwart kann Jugend-Mitglieder verwalten, Jugend-Ausbildungen planen, Jugend-Statistiken einsehen und Jugend-Wettkämpfe organisieren. Spezialisiert auf den Nachwuchsbereich.",
    section: "Rollen-System",
    keywords: ["jugendwart", "jugend", "mitglieder", "ausbildungen", "nachwuchs", "wettkämpfe"]
  },
  {
    id: "was-darf-damenwart",
    question: "Was darf der Damenwart?",
    answer: "Der Damenwart kann Damen-Mitglieder verwalten, Damen-Events organisieren, Damen-Statistiken einsehen und Damen-Termine planen. Spezialisiert auf den Damenbereich.",
    section: "Rollen-System",
    keywords: ["damenwart", "damen", "events", "termine", "statistiken", "organisieren"]
  },
  {
    id: "was-darf-zeugwart",
    question: "Was darf der Zeugwart?",
    answer: "Der Zeugwart kann Waffen & Ausrüstung verwalten, Inventar führen, Wartungspläne erstellen und Anschaffungen verwalten. Zuständig für die technische Ausstattung des Vereins.",
    section: "Rollen-System",
    keywords: ["zeugwart", "waffen", "ausrüstung", "inventar", "wartung", "anschaffungen"]
  },
  {
    id: "was-darf-pressewart",
    question: "Was darf der Pressewart?",
    answer: "Der Pressewart kann Vereins-News schreiben, Berichte erstellen, Foto-Verwaltung betreiben und Öffentlichkeitsarbeit machen. Zuständig für die Außendarstellung des Vereins.",
    section: "Rollen-System",
    keywords: ["pressewart", "news", "berichte", "fotos", "öffentlichkeitsarbeit", "außendarstellung"]
  },
  {
    id: "was-darf-trainer",
    question: "Was darf der Trainer?",
    answer: "Der Trainer kann Training durchführen, Lizenzen verwalten, Trainings-Statistiken einsehen und Leistungsanalysen erstellen. Spezialisiert auf die sportliche Entwicklung.",
    section: "Rollen-System",
    keywords: ["trainer", "training", "lizenzen", "statistiken", "leistung", "entwicklung"]
  },
  {
    id: "was-darf-ausbilder",
    question: "Was darf der Ausbilder?",
    answer: "Der Ausbilder kann fortgeschrittene Schulungen durchführen, Prüfungen abnehmen, Ausbilder-Lizenzen verwalten und Ausbildungs-Statistiken einsehen. Höhere Qualifikationsstufe als Trainer.",
    section: "Rollen-System",
    keywords: ["ausbilder", "schulungen", "prüfungen", "lizenzen", "qualifikation", "fortgeschritten"]
  },
  {
    id: "was-darf-vereinsschuetze",
    question: "Was darf der Vereinsschütze?",
    answer: "Der Vereinsschütze kann eigene Daten einsehen, eigene Lizenzen verwalten, eigene Statistiken einsehen und Termine einsehen. Basis-Mitglied mit Lesezugriff auf eigene Daten.",
    section: "Rollen-System",
    keywords: ["vereinsschütze", "eigene", "daten", "lizenzen", "statistiken", "termine", "basis"]
  },
  {
    id: "was-darf-ehrenmitglied",
    question: "Was darf das Ehrenmitglied?",
    answer: "Das Ehrenmitglied kann Vereinsgeschichte einsehen, Ehrungen verwalten, historische Daten einsehen und Jubiläums-Termine verwalten. Spezieller Status für verdiente Mitglieder.",
    section: "Rollen-System",
    keywords: ["ehrenmitglied", "geschichte", "ehrungen", "historisch", "jubiläum", "verdient"]
  },
  {
    id: "vereinssoftware-lizenz",
    question: "Was ist die Vereinssoftware-Lizenz?",
    answer: "Die Vereinssoftware ist ein kostenpflichtiges Zusatzmodul. Es gibt 3-monatige kostenlose Testlizenzen und Vollversionen. Ohne Lizenz ist kein Zugriff auf die Vereinssoftware möglich. Kontakt: rwk-leiter-ksve@gmx.de",
    section: "Rollen-System",
    keywords: ["vereinssoftware", "lizenz", "kostenpflichtig", "test", "vollversion", "kontakt"]
  },
  {
    id: "wie-rolle-bekommen",
    question: "Wie bekomme ich eine Rolle zugewiesen?",
    answer: "Rollen werden vom Vereinsvorstand oder Super-Admin zugewiesen. Kontaktieren Sie Ihren Vereinsvorstand oder den RWK-Leiter (rwk-leiter-ksve@gmx.de) für Rollenzuweisungen.",
    section: "Rollen-System",
    keywords: ["rolle", "zuweisen", "vorstand", "admin", "kontakt", "rwk-leiter"]
  },
  {
    id: "mehrere-rollen",
    question: "Kann ich mehrere Rollen haben?",
    answer: "Ja, Sie können mehrere Club-Rollen gleichzeitig haben (z.B. KASSENWART und JUGENDWART). Jede Rolle erweitert Ihre Berechtigungen. Der Vorstand hat automatisch Zugriff auf alle Bereiche.",
    section: "Rollen-System",
    keywords: ["mehrere", "rollen", "gleichzeitig", "erweitert", "berechtigungen", "kombinieren"]
  },
  {
    id: "multi-verein",
    question: "Kann ich für mehrere Vereine Rollen haben?",
    answer: "Ja, das Multi-Verein-System ermöglicht es, für verschiedene Vereine unterschiedliche Rollen zu haben. Zum Beispiel SPORTLEITER in Verein A und KASSENWART in Verein B.",
    section: "Rollen-System",
    keywords: ["multi", "verein", "mehrere", "verschiedene", "unterschiedlich", "system"]
  },
  {
    id: "bereiche-nicht-sichtbar",
    question: "Warum sehe ich bestimmte Bereiche nicht?",
    answer: "Sie sehen nur die Bereiche, für die Sie berechtigt sind. Ihre aktuelle Rolle bestimmt die sichtbaren Bereiche. Kontaktieren Sie den Vorstand für weitere Berechtigungen.",
    section: "Rollen-System",
    keywords: ["bereiche", "nicht", "sichtbar", "berechtigt", "rolle", "bestimmt", "vorstand"]
  },
  {
    id: "legacy-rollen",
    question: "Was passiert mit alten Rollen wie 'vereinsvertreter'?",
    answer: "Alte Rollen (vereinsvertreter, mannschaftsführer) funktionieren weiterhin, werden aber schrittweise auf das neue System migriert. Vereinsvertreter werden zu SPORTLEITER, Vereinsvorstand zu VORSTAND.",
    section: "Rollen-System",
    keywords: ["legacy", "alt", "vereinsvertreter", "mannschaftsführer", "migration", "sportleiter"]
  },
  {
    id: "kv-rollen",
    question: "Was sind KV-Rollen?",
    answer: "KV-Rollen sind Kreisverband-Rollen wie KV_WETTKAMPFLEITER (Vollzugriff RWK & KM), KV_KM_ORGA (KM-Vollzugriff), KV_PRESSEWART (News schreiben) und KV_KAMPFRICHTER (KM-Ergebnisse). Für Kreisverband-Funktionen.",
    section: "Rollen-System",
    keywords: ["kv", "kreisverband", "wettkampfleiter", "km", "orga", "pressewart", "kampfrichter"]
  },
  {
    id: "platform-rollen",
    question: "Was sind Platform-Rollen?",
    answer: "Platform-Rollen sind system-weite Rollen wie SUPER_ADMIN (Vollzugriff auf alles), SYSTEM_ADMIN (technische Wartung) und DATA_MANAGER (Import/Export). Nur für System-Administratoren.",
    section: "Rollen-System",
    keywords: ["platform", "system", "super", "admin", "wartung", "data", "manager", "import"]
  },
  {
    id: "datentrennung-vereine",
    question: "Können andere Vereine meine Daten sehen?",
    answer: "Nein, das Multi-Tenant-System sorgt für strikte Datentrennung. Verein A kann nicht auf Daten von Verein B zugreifen. Jeder Verein hat seine eigenen, getrennten Daten.",
    section: "Rollen-System",
    keywords: ["datentrennung", "multi", "tenant", "strikte", "getrennt", "sicherheit", "privat"]
  },
  {
    id: "url-sicherheit",
    question: "Was ist URL-Level Security?",
    answer: "URL-Level Security blockiert direkte Zugriffe auf Seiten ohne entsprechende Berechtigung. Auch wenn Sie den direkten Link kennen, können Sie ohne passende Rolle nicht auf geschützte Bereiche zugreifen.",
    section: "Rollen-System",
    keywords: ["url", "security", "sicherheit", "blockiert", "direkt", "link", "geschützt", "berechtigung"]
  }
];

function calculateScore(item: FAQItem, searchTerms: string[]): number {
  let score = 0;
  
  searchTerms.forEach(term => {
    // Exakte Treffer in Frage (höchste Gewichtung)
    if (item.question.toLowerCase().includes(term)) score += 10;
    
    // Treffer in Antwort
    if (item.answer.toLowerCase().includes(term)) score += 5;
    
    // Treffer in Keywords (auch Teilwörter)
    if (item.keywords.some(keyword => keyword.toLowerCase().includes(term) || term.includes(keyword.toLowerCase()))) score += 3;
    
    // Treffer in Section
    if (item.section.toLowerCase().includes(term)) score += 2;
    
    // Fuzzy-Matching für häufige Tippfehler
    const fuzzyMatches = {
      'schießen': ['schiessen', 'schisen', 'schiesen'],
      'schütze': ['schuetze', 'schützen', 'schuetzen'],
      'größe': ['groesse', 'grösse'],
      'können': ['koennen', 'kann'],
      'müssen': ['muessen', 'muss'],
      'dürfen': ['duerfen', 'darf'],
      'für': ['fuer'],
      'über': ['ueber'],
      'während': ['waehrend'],
      'zurück': ['zurueck']
    };
    
    Object.entries(fuzzyMatches).forEach(([correct, variants]) => {
      if (variants.includes(term) && (item.question.toLowerCase().includes(correct) || item.answer.toLowerCase().includes(correct))) {
        score += 2;
      }
    });
  });
  
  return score;
}

export function searchFAQ(query: string): FAQItem[] {
  if (!query || query.trim().length < 1) return []; // Bereits ab 1 Zeichen suchen
  
  const searchTerms = query.toLowerCase()
    .replace(/[äöüß]/g, (match) => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[match] || match))
    .split(/[\s,.-]+/)
    .filter(term => term.length > 0);
  
  const results = faqDatabase
    .map(item => ({
      ...item,
      score: calculateScore(item, searchTerms)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
  
  // Zeige mehr Ergebnisse wenn wenige gefunden
  return results.slice(0, results.length < 3 ? 10 : 8);
}

export function getAllFAQs(): FAQItem[] {
  return faqDatabase;
}

export function getFAQsBySection(section: string): FAQItem[] {
  return faqDatabase.filter(item => item.section === section);
}