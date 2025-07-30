# KM-Entwicklungsfortschritt - Wettkampfjahr 2026

**Entwicklungszeitraum:** Januar 2025  
**Wettkampfjahr:** 2026 (beginnt 01.10.2025)  
**Ziel:** Integration der Kreismeisterschaftsmeldungen in die RWK Einbeck App

## ✅ Abgeschlossen

### Datenstruktur & Typen
- [x] `Shooter` Interface erweitert um `mitgliedsnummer` und `sondergenehmigung`
- [x] KM-spezifische Typen erstellt (`/src/types/km.ts`)
- [x] Standard-Disziplinen für KM 2026 definiert
- [x] `calculateKMWettkampfklasse()` Funktion implementiert

### UI-Grundstruktur
- [x] KM-Dashboard (`/src/app/km/page.tsx`) - Demo-Version
- [x] Meldungsformular (`/src/app/km/meldungen/page.tsx`) - Demo-Version
- [x] Admin-Bereich (`/src/app/km/admin/page.tsx`) - Demo-Version

### Bestehende Integration
- [x] Schützen-Verwaltung mit allen benötigten Feldern
- [x] Verein-Zuordnung funktional
- [x] RWK-Altersklassenberechnung vorhanden

## 🔄 In Arbeit

### Automatische Wettkampfklassengenerierung
- [x] Wettkampfklassen für Saison 2026 definiert (Standard-Schema)
- [x] Service für Wettkampfklassen-Generierung (`km-wettkampfklassen-service.ts`)
- [x] API-Endpunkt für Initialisierung (`/api/km/init-wettkampfklassen`)
- [x] Wettkampfklassen-Bilder analysiert (`wettkampfklassen-bilder/`)
- [x] Wettkampfklassen basierend auf offizieller Übersicht angepasst (30 Klassen)
- [x] Unterscheidung Freihand/Auflage implementiert
- [ ] Automatische Zuordnung bei Meldung implementieren

## ❌ Noch zu implementieren

### API-Endpunkte
- [x] KM-Meldungen CRUD (`/api/km/meldungen/`)
  - [x] POST - Neue Meldung erstellen
  - [x] GET - Meldungen abrufen (mit Vereins-Filter)
  - [x] PUT - Meldung bearbeiten
  - [x] DELETE - Meldung löschen
- [ ] Wettkampfklassen-Management (`/api/km/wettkampfklassen/`)
- [x] Mannschaftsbildung (`/api/km/mannschaften/`)
  - [x] Automatische Generierung basierend auf Wettkampfklassen
  - [x] Berücksichtigung aller Mannschaftsregeln
  - [x] 3er-Team-Bildung mit Validierung
- [x] Disziplinen-Verwaltung (`/api/km/disziplinen/`)
  - [x] 39 Disziplinen mit korrekten SpO-Nummern definiert
  - [x] Alle Auflage-Disziplinen (1.11, 1.19, 1.31, 1.36, 1.39, 1.41, 1.43, 1.44, 1.49, 2.11, 2.21, 2.42, 5.11)
  - [x] Lichtgewehr/Lichtpistole-Disziplinen (11.10, 11.11, 11.20, 11.50, 11.51)
  - [x] Blasrohrsport (12.10)
  - [x] Kategorien: LG, LP, KKG (Kleinkaliber Gewehr), KKP (Kleinkaliber Pistole), AB
  - [x] Markierung für Vereinsmeisterschaft-Disziplinen (1.20, 1.35, 1.40)
  - [x] POST - Disziplinen initialisieren
  - [x] GET - Alle aktiven Disziplinen abrufen

### Funktionale UI
- [x] Meldungsformular mit echter API-Anbindung
- [x] Automatische Wettkampfklassen-Berechnung
- [x] Schützen- und Disziplinen-Auswahl aus Firebase
- [x] Formular-Validierung und Fehlerbehandlung
- [x] Live-Anzeige aktueller Meldungen
- [x] VM-Ergebnis-Eingabe für alle Disziplinen (Qualifikation)
  - [x] Erforderlich für Durchmeldungs-Disziplinen
  - [x] Optional für reguläre KM-Disziplinen
- [x] Mannschaftsregeln definiert (vollständig)
  - [x] Schüler/Jugend: m/w gemischt erlaubt
  - [x] Junioren I/II + Juniorinnen I/II: geschlechtergetrennt
  - [x] Herren/Damen I-V: geschlechtergetrennt
  - [x] Senioren 0: m/w gemischt erlaubt
  - [x] Senioren I+II: m/w gemischt erlaubt
  - [x] Senioren III-VI: m/w gemischt erlaubt
  - [x] Validierungsfunktion implementiert
- [x] Mannschaftsbildung-Interface
  - [x] Verein/Disziplin-Auswahl
  - [x] Automatische Generierung
  - [x] Anzeige generierter Mannschaften
  - [x] Regelanzeige

### Admin-Funktionen
- [x] Admin-Dashboard mit echten Daten
- [x] Live-Statistiken (Vereine, Meldungen, LM, VM-Ergebnisse)
- [x] Meldungsübersicht mit Filterung
- [x] VM-Ergebnis-Anzeige in Tabelle
- [ ] Startplan-Generierung
- [ ] LM-Meldungen Export
- [x] PDF-Export (Meldelisten, Startlisten)
  - [x] Meldeliste PDF mit allen Meldungen
  - [x] Startliste PDF gruppiert nach Disziplinen
  - [x] LM-Meldungen PDF für Landesverband
  - [x] Automatischer Download mit korrekten Dateinamen
- [x] System-Initialisierung (`/km/init`)
  - [x] Wettkampfklassen 2026 initialisieren
  - [x] Disziplinen 2026 initialisieren
  - [x] Benutzerfreundliche Einrichtung
- [x] KM-Rechtesystem
  - [x] 3 Rollen: km_admin, km_organizer, verein_vertreter
  - [x] Firebase Rules für KM-Collections
  - [x] Auth-Service und API-Endpunkte
  - [x] Getrennte Dashboards (/admin vs /km/admin)
  - [x] RWK-Integration: Bestehende Admins/Vereinsvertreter haben automatisch KM-Zugang
  - [x] useKMAuth Hook für UI-Zugriffskontrolle
- [x] Dashboard-Auswahl (`/dashboard-auswahl`)
  - [x] RWK vs KM Dashboard wählen
  - [x] Rollenbasierte Anzeige
  - [x] Berechtigungsprüfung
- [ ] E-Mail-Benachrichtigungen (Nice-to-have)

### Integration & Optimierung
- [ ] Synergie mit RWK-Schützendaten
- [ ] Excel-Import für Mitgliederdaten
- [ ] Mobile Optimierung
- [ ] Testing und Fehlerbehandlung

## 📅 Zeitplan

**Phase 1 (Januar 2025):** Wettkampfklassen & API-Grundlagen  
**Phase 2 (Februar 2025):** Funktionale UI & Meldungsprozess  
**Phase 3 (März 2025):** Admin-Funktionen & Export  
**Phase 4 (April 2025):** Testing & Optimierung  
**Go-Live:** Mai 2025 (für KM 2026 Meldungen ab Oktober 2025)

---
*Letzte Aktualisierung: 15.01.2025*