# 🎯 RWK Einbeck App

> **Moderne Digitalisierung für Schießsport-Rundenwettkämpfe**

Eine vollständig digitale Lösung für die Verwaltung von Rundenwettkämpfen (RWK) und Kreismeisterschaften (KM) im Schießsport. Entwickelt für den KSV Einbeck und optimiert für deutsche Schützenvereine.

[![Version](https://img.shields.io/badge/Version-0.12.0-blue?style=for-the-badge)](#)
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

## 🚀 Hauptfunktionen

### 🏅 Rundenwettkampf (RWK)
- **Liga-Management** mit flexiblen Schusszahlen
- **Mannschafts-Generierung** automatisch oder manuell
- **Ergebnis-Eingabe** mit Validierung und Plausibilitätsprüfung
- **Live-Tabellen** mit Auf-/Abstieg und Statistiken
- **Handzettel-Generator** für Wettkampftage

### 🏆 Kreismeisterschaft (KM)
- **Meldungen-Verwaltung** mit Voranmeldungen (VM)
- **Startlisten-Generierung** nach Disziplinen
- **Ergebnis-Erfassung** für KM-Wettkämpfe
- **Qualifikations-Management** für Landesmeisterschaften
- **Urkunden-Druck** automatisiert

### 📊 Verwaltung & Organisation
- **Schützen-Datenbank** mit Import/Export
- **Vereins-Management** mit Kontakten
- **Disziplinen-Verwaltung** flexibel konfigurierbar
- **Statistik-Dashboard** mit Auswertungen
- **Backup & Restore** für Datensicherheit

## 🛠️ Technologie-Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI/UX**: Tailwind CSS, Radix UI, Lucide Icons
- **Backend**: Firebase (Firestore, Auth, Functions)
- **Mobile**: Capacitor (Native Android App)
- **PDF**: jsPDF, html2canvas
- **E-Mail**: Resend API
- **Deployment**: Vercel (Web), Google Play Store (Android)

## 📱 Verfügbare Versionen

| Platform | Version | Status | Download |
|----------|---------|--------|---------|
| **Web App** | 0.12.0 | 🔄 Beta | Vercel Deployment |
| **Android App** | 0.9.4.1 | ✅ Produktiv | Google Play Store |
| **iOS App** | - | ❌ Nicht geplant | Unrentabel |

## 🎯 Zielgruppe

- **Schützenvereine** in Deutschland
- **Kreisverbände** für KM-Organisation
- **Schießsport-Organisatoren**
- **Wettkampfleiter** und Vereinsvorstände

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
- Fehlerfreie Punkteverteilung
- Automatische E-Mail-Rundschreiben
- Zentrale Cloud-Datenbank

## 🚀 Installation & Setup

```bash
# Repository klonen
git clone https://github.com/Muggy663/rwk-einbeck.git
cd rwk-einbeck

# Dependencies installieren
npm install

# Environment Setup
cp .env.example .env.local
# Firebase Config in .env.local eintragen

# Development Server starten
npm run dev
# App läuft auf http://localhost:3000

# Android App builden
npm run build:capacitor
```

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

## 🏆 Erfolgsgeschichte

- **15+ Vereine** nutzen die App aktiv
- **200+ Schützen** registriert
- **99.9% Uptime** seit Launch
- **0 Datenverluste** durch Cloud-Backup

## 🔧 Für Entwickler

```bash
# Repository klonen
git clone https://github.com/Muggy663/rwk-einbeck.git

# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Android App builden
npm run build:capacitor
```

## 📞 Support & Kontakt

- **Issues**: [GitHub Issues](https://github.com/Muggy663/rwk-einbeck/issues)
- **E-Mail**: rwk-leiter-ksve@gmx.de
- **Playstore Beta**: Google Play Store (Beta-Test)
- **Dokumentation**: Siehe `/docs` Ordner
- **Entwickler**: KSV Einbeck RWK-Leiter Marcel Bünger

## 📄 Lizenz & Copyright

**Copyright © 2025 KSV Einbeck. Alle Rechte vorbehalten.**

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