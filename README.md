# 🎯 RWK Einbeck App

> **Moderne Digitalisierung für Schießsport-Rundenwettkämpfe**

Eine vollständig digitale Lösung für die Verwaltung von Rundenwettkämpfen (RWK) und Kreismeisterschaften (KM) im Schießsport. Entwickelt für den KSV Einbeck und optimiert für deutsche Schützenvereine.

[![Version](https://img.shields.io/badge/Version-1.9.1-blue?style=for-the-badge)](#)
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
- 🤖 **OCR Handzettel-Erkennung** - Automatische Ergebniserfassung per Foto
- 🛡️ **Enterprise-Level Sicherheit** - 70+ Sicherheitslücken behoben
- 🎯 **Schießnachweis** - Digitales Schießtagebuch für Sportschützen

## 🚀 Hauptfunktionen

### 🏅 Rundenwettkampf (RWK)
- **Liga-Management** mit flexiblen Schusszahlen
- **Mannschafts-Generierung** automatisch oder manuell
- **Ergebnis-Eingabe** mit Validierung und Plausibilitätsprüfung
- **OCR Handzettel-Erkennung** - Foto hochladen, automatisch auslesen
- **Live-Tabellen** mit Auf-/Abstieg und Statistiken
- **Handzettel-Generator** für Wettkampftage

### 🏆 Kreismeisterschaft (KM)
- **KM-Jahresverwaltung** mit automatischen Collections
- **Meldungen-Verwaltung** mit Inline-Bearbeitung
- **Startlisten-Generierung** nach Disziplinen
- **Ergebnis-Erfassung** für KM-Wettkämpfe
- **Qualifikations-Management** für Landesmeisterschaften
- **Urkunden-Druck** automatisiert

### 🎯 Schießnachweis (NEU)
- **Digitales Schießtagebuch** für Sportschützen
- **Training & Wettkampf** Dokumentation
- **Import von digitalen Anlagen** (Meyton, Sius, Disag, Sport Quantum)
- **Detaillierte Serienerfassung** mit Einzelschuss-Dokumentation
- **Statistiken & Auswertungen** zur Leistungsentwicklung
- **PDF-Export für Behörden** - Offizieller Nachweis für Waffenbehörde
- **Offline-Speicherung** - Alle Daten bleiben auf Ihrem Gerät

### 📊 Verwaltung & Organisation
- **Globale Suche** über alle Bereiche
- **Schützen-Datenbank** mit Import/Export
- **Vereins-Management** mit Kontakten
- **Disziplinen-Verwaltung** flexibel konfigurierbar
- **Statistik-Dashboard** mit Auswertungen
- **Backup & Restore** für Datensicherheit

### 🛡️ Sicherheitsfeatures
- **Input-Validierung** auf allen Ebenen
- **XSS/CSRF-Schutz** für sichere Formulare
- **Rate Limiting** gegen Brute-Force-Angriffe
- **Bot Protection** mit Honeypot-Technologie
- **Sichere File-Uploads** mit Validierung
- **API-Sicherheit** gegen Injection-Angriffe
- **Secure Logging** ohne sensitive Daten
- **Path Traversal Prevention** für Dateizugriffe

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
| **Web App** | 1.9.1 | ✅ Produktiv | Vercel Deployment |
| **Android App** | 0.9.4.1 | ✅ Produktiv | Google Play Store |
| **iOS App** | - | ❌ Nicht geplant | Unrentabel |

## 🎯 Zielgruppe

- **Schützenvereine** in Deutschland
- **Kreisverbände** für KM-Organisation
- **Schießsport-Organisatoren**
- **Wettkampfleiter** und Vereinsvorstände
- **Sportschützen** für persönliche Dokumentation

## 🎯 Besondere Features

- **⚡ Pull-to-Refresh**: Native Mobile-Geste zum Aktualisieren
- **🔄 Optimistic Updates**: Sofortige UI-Reaktionen für schnelleres Gefühl
- **🎯 Meyton Integration**: Export für elektronische Schießanlagen im David21-Format
- **📊 Live-Tabellen**: Automatische Berechnung nach RWK-Ordnung mit Auf-/Abstieg
- **🏆 KM-System**: Vollständige Kreismeisterschafts-Verwaltung mit Startlisten
- **📱 Progressive Web App**: Funktioniert offline, installierbar wie native App
- **🌙 Enhanced Dark Mode**: Professionelle Farbpalette mit System-Integration
- **🔙 BackButton Navigation**: Einheitliche Zurück-Navigation auf allen Seiten
- **📅 KM-Jahresverwaltung**: Automatische Collections für jedes Jahr
- **✏️ Inline-Bearbeitung**: Direkte Bearbeitung in KM-Tabellen

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

*Letzte Aktualisierung: 21. Januar 2025*

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

*Entwickelt mit ❤️ für den deutschen Schießsport*