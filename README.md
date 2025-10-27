# 🎯 RWK Einbeck App

> **Moderne Digitalisierung für Schießsport-Rundenwettkämpfe**

Eine vollständig digitale Lösung für die Verwaltung von Rundenwettkämpfen (RWK) und Kreismeisterschaften (KM) im Schießsport. Entwickelt für den KSV Einbeck und optimiert für deutsche Schützenvereine.

[![Version](https://img.shields.io/badge/Version-1.9.0-blue?style=for-the-badge)](#)
[![Android App](https://img.shields.io/badge/Android_App-0.9.4.1-success?style=for-the-badge)](#)
[![Tech Stack](https://img.shields.io/badge/Tech-Next.js_14_+_Firebase-blue?style=for-the-badge)](#)

## ✨ Highlights

- 🏆 **Vollständige RWK & KM Verwaltung** - Von Meldungen bis Ergebnislisten
- 📱 **Progressive Web App + Native Android** - Funktioniert überall
- 🎯 **Alle Disziplinen** - KK, LG, LP, Benutzerdefiniert
- 📊 **Automatische Tabellen** - Live-Berechnung mit Statistiken
- 📧 **E-Mail Integration** - Automatische Rundschreiben
- 🔐 **Rollen-System** - Admin, Verein, Schütze
- 📄 **PDF Export** - Professionelle Dokumente
- ⚡ **Real-time Updates** - Sofortige Synchronisation
- 🤖 **OCR Handzettel-Erkennung** - Automatische Ergebniserfassung per Foto (NEU v1.8.1)

## 🚀 Hauptfunktionen

### 🏅 Rundenwettkampf (RWK)
- **Liga-Management** mit flexiblen Schusszahlen
- **Mannschafts-Generierung** automatisch oder manuell
- **Ergebnis-Eingabe** mit Validierung und Plausibilitätsprüfung
- **OCR Handzettel-Erkennung** - Foto hochladen, automatisch auslesen (NEU v1.8.1)
- **Live-Tabellen** mit Auf-/Abstieg und Statistiken
- **Handzettel-Generator** für Wettkampftage

### 🏆 Kreismeisterschaft (KM)
- **KM-Jahresverwaltung** mit automatischen Collections (NEU v1.5.5)
- **Meldungen-Verwaltung** mit Inline-Bearbeitung (NEU v1.5.5)
- **Startlisten-Generierung** nach Disziplinen
- **Ergebnis-Erfassung** für KM-Wettkämpfe
- **Qualifikations-Management** für Landesmeisterschaften
- **Urkunden-Druck** automatisiert

### 📊 Verwaltung & Organisation
- **Globale Suche** über alle Bereiche (NEU v1.5.4)
- **Aufgaben-Management** für Vorstand (NEU v1.5.4)
- **Schützen-Datenbank** mit Import/Export
- **Vereins-Management** mit Kontakten
- **Disziplinen-Verwaltung** flexibel konfigurierbar
- **Statistik-Dashboard** mit Auswertungen
- **Backup & Restore** für Datensicherheit

## 🛠️ Technologie-Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI/UX**: Tailwind CSS, Radix UI, Lucide Icons
- **Backend**: Firebase (Firestore, Auth, Functions)
- **OCR**: Google Vision API, Tesseract.js (Fallback)
- **Mobile**: Capacitor (Native Android App)
- **PDF**: jsPDF, html2canvas
- **E-Mail**: Resend API
- **Deployment**: Vercel (Web), Google Play Store (Android)

## 📱 Verfügbare Versionen

| Platform | Version | Status | Download |
|----------|---------|--------|---------|
| **Web App** | 1.8.2 | ✅ Produktiv | Vercel Deployment |
| **Android App** | 0.9.4.1 | ✅ Produktiv | Google Play Store |
| **iOS App** | - | ❌ Nicht geplant | Unrentabel |

## 🎯 Zielgruppe

- **Schützenvereine** in Deutschland
- **Kreisverbände** für KM-Organisation
- **Schießsport-Organisatoren**
- **Wettkampfleiter** und Vereinsvorstände

## 🎯 Besondere Features

- **🎤 Voice Input**: "185 Ringe" sprechen statt tippen - Deutsche Zahlenerkennung
- **⚡ Pull-to-Refresh**: Native Mobile-Geste wie Instagram zum Aktualisieren
- **🔄 Optimistic Updates**: Sofortige UI-Reaktionen für schnelleres Gefühl
- **🎯 Meyton Integration**: Export für elektronische Schießanlagen im David21-Format
- **📊 Live-Tabellen**: Automatische Berechnung nach RWK-Ordnung mit Auf-/Abstieg
- **🏆 KM-System**: Vollständige Kreismeisterschafts-Verwaltung mit Startlisten
- **📱 Progressive Web App**: Funktioniert offline, installierbar wie native App
- **🌙 Enhanced Dark Mode**: Professionelle Farbpalette mit System-Integration (v1.5.4)
- **🔙 BackButton Navigation**: Einheitliche Zurück-Navigation auf allen Seiten
- **📅 KM-Jahresverwaltung**: Automatische Collections für jedes Jahr (v1.5.5)
- **✏️ Inline-Bearbeitung**: Direkte Bearbeitung in KM-Tabellen (v1.5.5)

## 🌟 Warum RWK Einbeck App?

### ❌ Vorher (Analog)
- Excel-Tabellen manuell pflegen
- Papier-basierte Meldungen
- Fehleranfällige Berechnungen
- Zeitaufwändige Kommunikation
- Keine zentrale Datenhaltung

### ✅ Nachher (Digital)
- Automatische Berechnung aller Tabellen
- Online-Meldungen mit Validierung
- OCR-Erkennung für Handzettel
- Fehlerfreie Punkteverteilung
- Automatische E-Mail-Rundschreiben
- Zentrale Cloud-Datenbank



## 📸 Screenshots

### 🏠 Startseite & Navigation
<div align="center">
  <img src="screenshots-play-store/01_Startseite.png" alt="Startseite" width="300">
  <img src="screenshots-play-store/03_Mobile-Navigation.png" alt="Mobile Navigation" width="300">
</div>

### 🏆 RWK-Tabellen & Wettkampf-Management
<div align="center">
  <img src="screenshots-play-store/02_RWK-Tabellen.png" alt="RWK Tabellen" width="300">
  <img src="screenshots-play-store/08_RWK-Tabellen-Detail.png" alt="RWK Tabellen Detail" width="300">
</div>

### 🎯 Vereinsbereich & KM-System
<div align="center">
  <img src="screenshots-play-store/04_Vereinsbereich.png" alt="Vereinsbereich" width="300">
  <img src="screenshots-play-store/05_KM-Meldungen.png" alt="KM Meldungen" width="300">
</div>

### 📊 Dashboard & Dokumente
<div align="center">
  <img src="screenshots-play-store/07_Dashboard-Auswahl.png" alt="Dashboard Auswahl" width="300">
  <img src="screenshots-play-store/06_Dokumente.png" alt="Dokumente" width="300">
</div>


## 📞 Support & Kontakt

- **Issues**: [GitHub Issues](https://github.com/Muggy663/rwk-einbeck/issues)
- **E-Mail**: rwk-leiter-ksve@gmx.de
- **Playstore Beta**: Google Play Store (Beta-Test)
- **Dokumentation**: Siehe `/docs` Ordner
- **Entwickler**: KSV Einbeck RWK-Leiter Marcel Bünger

## 📄 Lizenz & Copyright

**Copyright © 2025 KSV Einbeck. Alle Rechte vorbehalten.**

*Letzte Aktualisierung: 21. Oktober 2025*

Diese Software ist urheberrechtlich geschützt und ausschließlich für den RWK Einbeck und autorisierte Schützenvereine entwickelt. 

**Alle Inhalte dieser Software, einschließlich:**
- Software-Code und Algorithmen
- Benutzeroberflächen und Design
- Datenbank-Strukturen
- Dokumentation und Texte
- Grafiken und Icons

**sind Eigentum des KSV Einbeck.**

Jede Vervielfältigung, Verbreitung, öffentliche Wiedergabe oder sonstige Nutzung ohne ausdrückliche schriftliche Genehmigung ist untersagt und kann rechtlich verfolgt werden.

### Nutzungsrechte
- ✅ **Erlaubt**: Nutzung durch registrierte Schützenvereine
- ✅ **Erlaubt**: Ansehen des Codes für Lernzwecke
- ❌ **Verboten**: Kommerzielle Nutzung ohne Lizenz
- ❌ **Verboten**: Weiterverteilung oder Kopieren
- ❌ **Verboten**: Reverse Engineering für konkurrierende Produkte

**Für Lizenzanfragen kontaktieren Sie:** rwk-leiter-ksve@gmx.de

---

**Aktuelle Versionen:**
- **Web-Version 1.9.0** - MongoDB File Server & reCAPTCHA Integration: Vollständige MongoDB Atlas Integration als File Server für Dokumente-Upload mit GridFS, Google reCAPTCHA v2 Checkbox-Integration für Login-Sicherheit, Upload-API für PDF-Dateien, Download-API für gespeicherte Dokumente, Admin-Upload-Interface für Dokumente-Verwaltung
- **Web-Version 1.8.3.1** - OCR-Optimierung & E-Mail-Fixes: OCR nur noch auf Wunsch mit Kontrollhinweis, E-Mail-Versand für Sportleiter behoben, Vereinssoftware-Verweis auf neue "Verein-im-Visier" App
- **Web-Version 1.8.1** - Mobile OCR-Optimierungen & UI-Fixes: Automatische OCR-Starts nach Foto-Aufnahme, Tabellen-Overflow-Fixes für Portrait-Modus, Safe Area Support für mobile Header, Dark Mode Print-Fixes, Team-Sortierung mit Einzel-Teams am Ende, PDF-Hilfe Button kompakter für App-Ansicht
- **Web-Version 1.7.5.4** - Google Analytics Integration (wieder entfernt in v1.7.5.5): Besucherzähler im Footer mit Google Analytics 4, DSGVO-konformes Tracking mit anonymisierten IPs, automatisches Page-Tracking, dezente Anzeige der Besucherzahlen
- **Web-Version 1.7.5.3** - Sportleiter Schützen-Vollzugriff: SPORTLEITER können jetzt Schützen anlegen/bearbeiten/löschen, Geburtsjahr-Input korrigiert, Teams nur aus laufenden Saisons, Stammdaten-Hinweis 01.08.2025 im RWK Dashboard
- **Web-Version 1.7.4** - Mannschaftsführer-Rolle Implementation: Vollständige MANNSCHAFTSFUEHRER-Rolle mit Zugriff auf Ergebniserfassung und Mannschaftsführer-Kontakte, vereinfachte Dashboard-Auswahl durch Entfernung separater Mannschaftsführer-Karte, optimierte Berechtigung im Vereinsbereich mit rollenbasierten Karten-Einschränkungen, erweiterte Firestore-Rules für granulare Mannschaftsführer-Berechtigungen
- **Web-Version 1.7.3** - Mobile UX KM-Orga: Header Overflow-Fix verhindert horizontales Scrollen, KM-Orga mobile Buttons optimiert mit vertikaler Anordnung, Dark Mode Text-Lesbarkeit in farbigen Boxen verbessert
- **Web-Version 1.7.2** - Mobile Fixes & Team-Manager: Burger-Menü Touch-Fix verhindert versehentliches Öffnen, Für Vereine Scrolling-Problem behoben, Team-Manager Seite korrigiert mit BackButton und Auth-Fix
- **Web-Version 1.7.1.2** - Header Navigation Fix: MutationObserver verhindert Header-Verschwinden beim Navigieren auf Mobile, stabilere Navigation zwischen Dashboard-Bereichen
- **Web-Version 1.7.1.1** - Vereinssoftware Mobile UX: Vollständige Mobile-Optimierung aller Vereinssoftware-Bereiche mit BackButtons, responsive Card-Layouts für Mitgliederverwaltung, mobile-freundliche Header und Navigation, konsistente Zurück-Navigation zu jeweiligen Dashboards, Header-Optimierung für Mobile (RWK KSV Einbeck Text entfernt, globale Suche erweitert), Footer-Fix für abgeschnittene Versionsnummern
- **Web-Version 1.7.1** - Mobile UX Revolution: Vollständige Mobile-Optimierung aller KM-Bereiche mit responsiven Card-Layouts statt Tabellen, mobile-freundliche Button-Anordnung (vertikal statt horizontal), verbesserte Sichtbarkeit von Formularen und Aktions-Buttons, Dark Mode Fixes für farbige Dialog-Boxen, aktualisierte Onboarding-Inhalte mit 2024/25 Saison-Bezug, optimierte Navigation im Burger-Menü ("Dashboard" statt "Verein")
- **Web-Version 1.7.0** - Support-System & Development-Tools: Vollständiges Support-Code-System mit temporärem Vereinszugang, benutzerfreundliche Fehlermeldungen bei fehlendem Zugang, Development-Club mit 20 Test-Mitgliedern für Entwicklung, Prioritäten-System (Support-Code > Development-Club > Fehlermeldung), Admin-Tools für Development-Setup
- **Web-Version 1.6.0** - Rollen-System Revolution: 3-Tier-Rollensystem mit Platform/KV/Club-Rollen, URL-Level Security, granulare Firestore-Regeln, Multi-Verein-Support, Lizenz-Management, finale Migration aller Legacy-Rollen abgeschlossen
- **Web-Version 1.5.9** - Vereinsbereich UX-Verbesserungen: Aufklappbare Mannschaftsdetails in der Übersicht mit Schützen-Anzeige, bereits ausgewählte Schützen im Dialog sichtbar mit direkter Entfernungsmöglichkeit, konsistente UX zwischen Admin- und Vereinsbereich
- **Web-Version 1.5.8** - SEPA-Beitragsverwaltung, Jubiläen-System & Lizenzen-Management: Vollständige SEPA-Lastschrift Integration mit automatischer BIC-Berechnung aus IBAN, Multi-Bank-Export-Formate (Sparkasse, Volksbank, Commerzbank, Deutsche Bank), erweiterte Beitragsliste mit Zahlungsart-Dropdown, SEPA-Mandate-Übersicht, Mahnbrief-Generator mit Schützenbruder-Anrede, funktionale Geburtstage & Jubiläen-Verwaltung mit korrekter Altersberechnung, vollständiges Lizenzen & Ausbildungen-Management mit 8 echten Schießsport-Ausbildungen, 12 Vorstandspositionen, automatischer Ablauf-Überwachung und Multi-Tenant Firestore-Integration
- **Web-Version 1.5.7** - Multi-Tenant Vereinssoftware Revolution: Vollständige Umstellung aller 6 Vereinssoftware-Bereiche auf Multi-Tenant Architektur mit club-spezifischen Collections (/clubs/{clubId}/), sortierbare Tabellen in allen Bereichen, saubere Datentrennung zwischen RWK/KM und Vereinssoftware, 1022 Schützen aus 16 Vereinen erfolgreich migriert
- **Web-Version 1.5.6** - Vereinsrecht-Modul Grundfunktionen: Vollständiges Protokoll-Management mit Tagesordnung und Beschlüssen, digitales Wahlen-System, Satzungsverwaltung mit Versionierung, Gemeinnützigkeits-Compliance und Status-Workflows für moderne Vereinsführung
- **Web-Version 1.5.5** - KM-Jahresverwaltung & Inline-Bearbeitung: KM-Jahre anlegen und verwalten, jahresspezifische Collections (km_meldungen_JAHR_DISZIPLIN), automatische Firestore Rules, Inline-Bearbeitung in KM-Meldungen-Tabelle, Migration-System für bestehende Daten
- **Web-Version 1.5.4** - Globale Suche & Dark Mode: Aufgaben-Management für Vorstand, globale Suche über alle Bereiche, vollständiger Dark Mode mit System-Integration, erweiterte Tabellen-Suche
- **Web-Version 1.5.1** - SEPA & Lizenzen Integration: SEPA-Lastschrift in Beitragsverwaltung, Lizenzen & Ausbildungen mit echten Schießsport-Ausbildungen, Ablauf-Überwachung und Vereinsfunktionen
- **Web-Version 1.5.0** - Vereinssoftware Revolution: Vollständige Mitgliederverwaltung mit 99 Geburtstagen, Eintrittsdaten-Import, individualisierbare Jubiläen-Konfiguration, 5-Jahres-Vorausplanung, exakte Altersberechnung und professionelle Mitgliederdatenbank
- **Web-Version 0.13.1** - Mobile Navigation & Dialog Fixes: Burger-Menü mit Logout-Button, Android Safe Areas für Dialoge, korrekte Dialog-Positionierung, entfernte redundante untere Navigation, verbesserte mobile Benutzerfreundlichkeit
- **Web-Version 0.13.0** - KM-Mannschaftsregeln & Optimierungen: Vollständige Mannschaftsregeln-Verwaltung mit Drag & Drop, Altersklassen-Kombinationen, Disziplin-spezifische Regeln, optimistische Updates und korrekte Altersklassen-Berechnung
- **Web-Version 0.12.2** - Mobile Navigation & Code Quality: Burger-Menü mit Safe Area, Mobile-optimierte Tabellen, Dark Mode Button-Fixes, Dialog-Positionierung und wiederverwendbare Komponenten
- **Web-Version 0.12.1** - Mobile UX & Performance Revolution: Voice Input, Pull-to-Refresh, Micro-Animations, Enhanced Dark Mode, Responsive Dialogs und Android-Optimierungen für native App-Erfahrung
- **Web-Version 0.12.0** - RWK-Tabellen & Admin-Teams Optimierung: Ein Dropdown statt zwei separate, "Laufend" Saisons priorisiert, 20-Teams-Limit behoben, korrekte Firestore-Abfragen für vollständige Ergebnisse
- **Web-Version 0.11.9** - FAQ-Suche für RWK-Ordnung: Über 50 häufige Fragen mit intelligenter Suche, Fuzzy-Matching und Tippfehler-Toleranz für optimale Benutzerfreundlichkeit
- **Web-Version 0.11.8** - Zeitungsbericht-Generator: Schützen-Namen Fix und vereinfachte Vereinsname-Anzeige für saubere Ausgabe
- **Web-Version 0.11.7a** - KM-Orga Passwort-Änderung: Passwort-Änderung im KM-Orga Bereich hinzugefügt, Startlisten-Tool Altersklassen-Fix, Disziplin 1.41 unter Kleinkaliber
- **App-Version 0.9.4.1** - Mobile-Optimierung & Stabilität: Update-Benachrichtigung, Mobile Navigation korrigiert, KM-Dashboard optimiert, React Hydration-Fehler behoben
- **Web-Version 0.11.6** - Startlisten-Optimierung & Mannschafts-Integration: Intelligente Mannschafts-Integration, papier-sparende PDFs, Duplikat-Bereinigung, dezente Löschen-Funktion
- **Web-Version 0.11.5** - KM-Bereich: Mehrvereine-Support & Mannschafts-Optimierung: Vereinsvertreter können mehrere Vereine verwalten, optimierte Mannschafts-Generierung, Auflage-Mannschaftsregeln
- **Web-Version 0.11.4** - Meyton Shootmaster Integration: Vollständiger Export im David21-Format, korrekte Altersklassen-IDs, individuelle Wettkampf-IDs, UTF-8 Encoding
- **Web-Version 0.11.3** - Orga-Bereich gefixt und optimiert: Startlisten-Tool, sortierbare Tabellen, VM-Ergebnisse, Zurück-Buttons, Altersklassen-Fix
- **Web-Version 0.11.2** - Saisonwechsel & PDF-Export: Vollständige Auf-/Abstiegsanalyse, PDF-Export mit Logo, Pistole/2.Kreisklasse-Logik, Vergleichsberechnungen
- **Web-Version 0.11.1** - Admin-Verbesserungen & PDF-Fixes: Ergebniserfassung-Filter, PDF-Exports, Mannschaftsführer-Korrekturen, Session-Timer
- **Web-Version 0.11.0** - Große Datenbank-Migration: Zentrale Schützen-Sammlung, Duplikat-Bereinigung, KM-Berechtigungen, Team-Erstellung optimiert
- **Web-Version 0.10.0** - Große Code-Bereinigung: Debug-Funktionen entfernt, Projekt optimiert, Syntax-Fehler behoben
- **App-Version 0.9.4.1** - Mobile-Optimierung & Stabilität: Update-System, Navigation-Fixes, Touch-Optimierungen
- **App-Version 0.9.1.0** - Erste offizielle Version der nativen Android-App

*Entwickelt mit ❤️ für den deutschen Schießsport*
