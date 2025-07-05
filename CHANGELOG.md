# Changelog

## Version 0.9.9 (3. Januar 2025)

### 🎯 Neue Features
- **🔗 Automatisches Liga-Öffnen**: Direkter Sprung von Startseite zu spezifischer Liga-Tabelle (ein Klick weniger!)
- **🔙 Zurück-Buttons**: Alle Admin-Seiten haben jetzt Zurück-zum-Dashboard Buttons für bessere Navigation
- **📧 Resend E-Mail Integration**: Professionelle E-Mail-Funktionalität mit @rwk-einbeck.de Domain
- **🎨 UX-Verbesserungen**: Verbesserte Benutzerführung und Navigation im gesamten System

### 🐛 Bugfixes
- **🔄 Liga-Navigation**: Automatisches Öffnen der richtigen Liga bei direkten Links funktioniert perfekt
- **🎛️ Admin-Navigation**: Alle Admin-Bereiche haben konsistente Zurück-Navigation
- **📱 Responsive Design**: Zurück-Buttons passen sich an Mobile/Desktop an

### 🛠️ Technische Verbesserungen
- **⚡ Performance**: Optimierte URL-Parameter-Verarbeitung
- **🔧 Code-Cleanup**: Entfernung von Debug-Logs und Optimierung der useEffect-Hooks
- **📊 State Management**: Verbesserte Accordion-Steuerung mit controlled components

### Vorherige Features (bereits implementiert)
- **Liga-Einstellungen System**: Flexible Konfiguration von Schusszahlen und Disziplinen pro Liga
- **Alle Disziplinen unterstützt**: Kleinkaliber Gewehr/Pistole, Luftgewehr Auflage/Freihand, Luftpistole + Benutzerdefiniert
- **Variable Schusszahlen**: 20/30/40 Schuss mit entsprechenden Ringzahlen (200/300/400)
- **Admin-Integration**: Neuer Bereich "Liga-Einstellungen" im Admin Dashboard

### 🚀 Neue Features
- **📧 E-Mail-System**: Vollständige Rundschreiben-Verwaltung mit Kontakten, Gruppen und Vorschau
- **📎 Anhang-Funktion**: PDF, Word-Dokumente und Bilder in E-Mails versendbar (bis 10MB pro Datei)
- **🎯 Liga-Filter**: Intelligente Kontakt-Filterung nach Ligen für zielgerichtete Kommunikation
- **👤 Einzelkontakt-Auswahl**: Gezielte Auswahl einzelner Empfänger zusätzlich zu Gruppen
- **🌐 Domain-Integration**: Professionelle E-Mails von @rwk-einbeck.de mit Resend
- **📱 PWA-Verbesserungen**: Automatischer Install-Prompt nach 30 Sekunden und Offline-Status-Anzeige
- **📊 Error-Monitoring**: Sentry-Integration für automatische Fehlerüberwachung mit E-Mail-Benachrichtigungen
- **⚡ Performance-Tracking**: Monitoring von Seitenladezeiten und API-Performance

### 🐛 Bugfixes
- **📱 Mobile Statistik-Fix**: Kreisdiagramm wird korrekt dargestellt (nicht mehr ei-förmig)
- **🔥 Firebase Kompatibilität**: undefined Werte werden vor dem Speichern bereinigt
- **📈 Statistik-Hinweise**: Icons und Tipps für Schützen-Diagramme in RWK-Tabellen hinzugefügt
- **🔄 Substitutions-Fix**: Berechtigungsfehler behoben, graceful fallback implementiert
- **🎨 UX-Optimierungen**: Verbesserte Navigation und Benutzerführung
- **🔧 Code-Cleanup**: Debug-Logs entfernt, TypeScript-Typen vervollständigt

### 🔒 Sicherheit
- **OWASP-Scan bestanden**: 0 kritische Schwachstellen
- **Input-Validierung**: Erweiterte Validierung für E-Mail-Daten
- **Error-Handling**: Sichere Fehlerbehandlung ohne Datenpreisgabe

### 📈 Performance
- **Bundle-Optimierung**: Reduzierte JavaScript-Größe
- **Lazy Loading**: Komponenten werden bei Bedarf geladen
- **Caching**: Verbesserte Caching-Strategien

### 🛠️ Technische Verbesserungen
- **TypeScript**: Vollständige Typisierung aller E-Mail-Funktionen
- **Error-Boundaries**: Bessere Fehlerbehandlung in React-Komponenten
- **API-Optimierung**: Streamlined E-Mail-API mit FormData-Support

## Version 0.9.8.2 (30. Juni 2025)

### Bugfixes
- **Mobile Layout-Fixes**: Buttons bleiben im Layout auf allen Gerätetypen
- **Verbesserte Vorschauen**: Vollständige Sicht auf Handzettel und Gesamtergebnislisten durch optimierte Skalierung
- **Druckoptimierung**: Größere Schrift (11px) und höhere Zeilen (28px) für bessere Lesbarkeit
- **UI-Verbesserungen**: Responsive Header mit flex-wrap und kompakte Button-Größen
- **Dropdown-Fix**: Liga-Dropdown bricht Layout nicht mehr

## Version 0.9.8.1 (28. Juni 2025)

### Bugfixes
- **Mobile Druckoptimierung**: Handzettel und Gesamtergebnislisten drucken jetzt korrekt auf mobilen Geräten
- **Responsive Print-Styles**: Automatische Skalierung für verschiedene Bildschirmgrößen
- **Print-Media-Queries**: Optimierte Druckausgabe für alle Bereiche (Admin, Vereins, öffentlich)
- **Cross-Device-Kompatibilität**: Einheitliche Druckfunktionalität auf Desktop und Mobile

## Version 0.9.8 (27. Juni 2025)

### Handzettel-Optimierungen
- **Dynamische Skalierung**: Gesamtergebnislisten passen automatisch auf eine A4-Seite
- **Intelligente Anpassung**: Optimale Balance zwischen Lesbarkeit und Platznutzung bei verschiedenen Teamanzahlen
- **Verbesserte Druckfunktion**: Auch Ligen mit vielen Einzelschützen (z.B. 2. Kreisklasse) passen komplett auf eine Seite
- **Benutzerfreundlichkeit**: Eingabefelder bleiben ausreichend groß für handschriftliche Eintragungen

### Neue Features
- **Vollständige Handtabellen-Suite**: Durchgangs-Meldebögen und Gesamtergebnislisten in drei Bereichen
- **Vereinsbereich**: Komplette Handtabellen-Funktionalität mit allen Kontaktdaten
- **Öffentliche Generatoren**: Zwei separate Tools im Dokumentenbereich ohne sensible Daten
- **Präsente Darstellung**: Große Generator-Karten mit Beschreibungen und Icons
- **Nahtlose Navigation**: Direkte Verlinkung zwischen Generatoren und zurück zu Ligalisten-Tab
- **Rundschreiben-System**: Admin-Kommunikation mit Empfänger-Auswahl und Nachrichtenvorlagen
- **Datenschutz**: Kontaktdaten nur für eingeloggte Vereinsvertreter sichtbar

### Technische Verbesserungen
- Skalierungsformel: `Math.max(0.75, 1 - (teams.length * 0.02))` für optimale Seitenausnutzung
- Dynamische Zeilenhöhen basierend auf Teamanzahl
- Verbesserte Schriftgrößen (7px) für bessere Lesbarkeit
- Admin-Bugfix: Automatische Saison-Auswahl in der Mannschaftsverwaltung

## Version 0.9.6 (26. Juni 2025)

### Neue Features
- **E-Mail-Benachrichtigungen**: Funktionale Support-Ticket-Benachrichtigungen via Nodemailer
- **GMX-Integration**: Vollständige E-Mail-Integration mit GMX-Server für Support-Anfragen

### Technische Verbesserungen
- Nodemailer-Paket hinzugefügt und konfiguriert
- Umgebungsvariablen für E-Mail-Konfiguration implementiert
- Vercel-kompatible E-Mail-Funktionalität

## Version 0.9.5 (26. Juni 2025)

### Behobene Fehler
- **Admin**: Korrektur der Firebase-Admin-Importe für Firestore-Statistik
- **Vercel**: Behebung des Fehlers "d is not a function" im Vercel-Build
- **Ergebniserfassung**: Entfernung des nutzlosen "Weitere 30 Schützen laden" Buttons

### Neue Features
- **Interaktive Onboarding-Tour**: Vollständig überarbeitete Einführung mit Emojis, Icons und praktischen Beispielen
- **Info-Tooltips**: Hilfreiche Erklärungen bei komplexen Funktionen
- **Nutzungsbedingungen**: Vollständige AGB für rechtliche Absicherung
- **Analytics Dashboard**: Neue Admin-Seite für Nutzungsstatistiken und Performance-Überwachung

### Benutzerfreundlichkeit
- **Vereins-Dashboard**: Komplett überarbeitet für blutige Anfänger mit größeren Texten und besserer Visualisierung
- **Aufgelockertes Onboarding**: Kürzere Texte, visuelle Icons und praktische Beispiele
- **Farbkodierte Karten**: Bedeutungsvolle Farbgebung (grün=wichtig, blau=wichtig, orange=häufig)
- **Navigation**: Handtabellen aus Vereinsbereich entfernt, "Mein Verein" als Titel

### Rechtliche Verbesserungen
- **Copyright-Schutz**: Vollständige Urheberrechts-Kennzeichnung (© 2025 Marcel Bünger für den KSV Einbeck)
- **Eigenständigkeits-Nachweis**: Dokumentation der eigenständigen Entwicklung

### Admin-Verbesserungen
- **Analytics & Monitoring**: Nutzungsstatistiken, Performance-Daten und Fehlerberichte
- **Vereinfachte Navigation**: Redundante Admin-Seiten entfernt
- **Zentrale Verwaltung**: Alle Admin-Funktionen auf einer Seite

### Technische Verbesserungen
- Optimierte Firebase-Admin-Importe für bessere Kompatibilität
- Neue Analytics-Infrastruktur für bessere Überwachung
- Erweiterte Hook-Bibliothek für Onboarding-Management
- Bereinigung redundanter Code-Bereiche

## Version 0.9.4 (25. Juni 2025)

### Behobene Fehler
- **Admin**: Fehler in der Datenbank-Recovery-Seite behoben
- **Termine**: Fehler beim Hinzufügen von Terminen behoben
- **RWK-Tabellen**: Fehler bei der Sortierung der Teams behoben
- **RWK-Tabellen**: NaN-Fehler bei Ligen ohne abgeschlossene Durchgänge behoben

### Technische Verbesserungen
- Verbesserte Fehlerbehandlung in UI-Komponenten
- Korrektur von Typ-Validierungen in Formularfeldern
- Verbesserte Sortierlogik für RWK-Tabellen basierend auf vollständig abgeschlossenen Durchgängen

### UI-Verbesserungen
- Verbesserte Anzeige der Wertungspunkte in RWK-Tabellen
- Hinzugefügt: Erklärung der Tabellensortierung und Anzeige des aktuellen Durchgangs
- Hinzugefügt: Fortschrittsanzeige für Durchgänge in RWK-Tabellen
- Hinzugefügt: Schnellfilter für Teams in RWK-Tabellen
- Verbesserte mobile Ansicht für RWK-Tabellen
- Entfernung des redundanten "Saisons"-Tabs im Statistik-Dashboard
- Hervorhebung der Saisonübergreifenden Statistiken auf der Übersichtsseite

## Version 0.9.3 (25. Juni 2025)

### Behobene Fehler
- **Ergebniserfassung**: Korrektur der Anzeige von Teams mit fehlenden Ergebnissen
- **Ergebniserfassung**: Verbesserung der Benutzeroberfläche für vollständig erfasste Teams
- **Ergebniserfassung**: Behebung von Berechtigungsproblemen bei Liga-Updates
- **Statistiken**: Filterung von Saisons - nur laufende und abgeschlossene Saisons werden angezeigt
- **Termine**: Behebung des Fehlers bei der Bearbeitung von Terminen
- **Termine**: Verbesserte Anzeige der nächsten Termine unabhängig vom ausgewählten Monat
- **Allgemein**: Deaktivierung problematischer Offline-Funktionen zur Verbesserung der Stabilität

### Technische Verbesserungen
- Verbesserte Fehlerbehandlung bei Berechtigungsproblemen
- Aktualisierte Firestore-Regeln für Liga-Updates
- Optimierte Ladelogik für Schützen-Daten
- Automatische Bereinigung abgelaufener Termine

## Version 0.9.2 (20. Januar 2025)

### Performance-Optimierungen
- Hybrid Lazy Loading für optimale Performance
- Batch-Loading reduziert Datenbankabfragen von ~49 auf 3
- Intelligentes Caching für bereits geladene Daten
- Sofortige Anzeige der Team-Tabellen

### Technische Verbesserungen
- Implementierung von Batch-Loading für Firestore-Abfragen
- Optimierung der Datenstruktur für schnellere Verarbeitung
- Verbesserte Fehlerbehandlung und Logging

## Version 0.9.1 (15. Dezember 2024)

### Neue Funktionen
- Statistik-Dashboard mit Leistungsentwicklung, Mannschaftsvergleich und Geschlechterverteilung
- Saisonübergreifende Statistiken für Schützen und Mannschaften
- Schützenvergleich mit bis zu 6 Schützen

### Verbesserungen
- Optimierte Ladezeiten für Statistiken
- Verbesserte Darstellung von Diagrammen
- Export-Funktion für Diagramme als PNG

## Version 0.9.0 (1. November 2024)

### Neue Funktionen
- Mobile Optimierungen für alle Bereiche der Anwendung
- Responsive Design für Smartphones und Tablets
- Touch-freundliche Bedienelemente

### Verbesserungen
- Überarbeitete Navigation für mobile Geräte
- Optimierte Tabellendarstellung auf kleinen Bildschirmen
- Verbesserte Performance auf mobilen Geräten

## Ältere Versionen

Siehe separate Changelog-Dateien für frühere Versionen.