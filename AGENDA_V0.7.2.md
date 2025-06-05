# Agenda für Version 0.7.2

## Fehlerbehebungen ✅
- [x] Login-Formular-Fehler "Required" auf Vercel behoben
  - [x] LoginForm.tsx zu LoginForm.js konvertiert
  - [x] Explizite required-Validierungen hinzugefügt
  - [x] Verbesserte Fehlerbehandlung implementiert
  - [x] Login-Seite zu JavaScript konvertiert

- [x] "Passwort ändern"-Funktion implementiert
  - [x] PasswordChangeForm-Komponente erstellt
  - [x] change-password-Seite erstellt
  - [x] AuthProvider um changePassword-Funktion erweitert
  - [x] Firebase-Auth-Modul um updateUserPassword-Funktion erweitert

- [x] Standard-Statistik-Seite korrigiert
  - [x] Mannschaftsvergleich mit dynamischer Y-Achse
  - [x] Verbesserte Fehlerbehandlung
  - [x] Filterung von Teams ohne Ergebnisse

- [x] "Erste Schritte starten"-Button mit Funktionalität versehen
  - [x] FirstStepsWizard-Komponente erstellt
  - [x] Rollenbasierte Inhalte implementiert
  - [x] In die Startseite eingebunden

## Vereinfachung der Benutzeroberfläche ✅
- [x] "Hilfe & Einstellungen" entfernt und die Buttons zwischen "Zur Startseite" und "Logout" platziert
- [x] Doppelte Verlinkung zum Terminkalender auf der Startseite vereinfacht
- [x] Vereinfachung des Vereinsdashboards (Terminkalender und Termin Hinzufügen zusammengefasst)
- [x] Navigationsstruktur überprüft und verbessert

## JavaScript-Umstellung ✅
- [x] Layout-Komponenten konvertiert:
  - [x] MainNav.js
  - [x] SiteFooter.js
- [x] Auth-Komponenten konvertiert:
  - [x] AuthContext.js
  - [x] AuthProvider.js
  - [x] LoginForm.js
  - [x] PasswordChangeForm.js (neu)
- [x] Firebase-Module konvertiert:
  - [x] auth.js
  - [x] config.js
- [x] Hooks konvertiert:
  - [x] use-auth.js
- [x] Seiten konvertiert:
  - [x] page.js (Startseite)
  - [x] login/page.js
  - [x] change-password/page.js
  - [x] statistik/page.js
  - [x] statistik/dashboard/page.js

## Platzhalter ✅
- [x] Platzhalter für automatischen Saisonabschluss / Auf- und Abstieg erstellt
  - [x] season-transition-service.js mit grundlegenden Funktionen
  - [x] JSDoc-Dokumentation für zukünftige Implementierung

## Zu implementieren
- [ ] Weitere TypeScript-Komponenten zu JavaScript konvertieren
- [ ] Caching-Strategie für Firestore-Abfragen implementieren
- [ ] Ladezeiten für große Datenmengen optimieren

## Dokumentation
- [ ] Aktualisierung des Benutzerhandbuchs
- [ ] Dokumentation der PDF-Generierungsfunktionen
- [ ] Erstellung einer Anleitung für Vereinsvertreter

## Nächste Schritte für Version 0.7.3
- [ ] Optimierung der PDF-Generierung für bessere Leistung
- [ ] Verbesserung der mobilen Ansicht
- [ ] Implementierung weiterer Statistik-Funktionen
- [ ] Erweiterung der Terminkalender-Funktionalität