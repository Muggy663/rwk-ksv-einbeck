# 3-Wochen Entwicklungsplan: KM-Meldungen MVP

## Woche 1: Grundlagen und Datenimport (25.11. - 01.12.)

### Tag 1-2: Datenmodell und Backend
- [ ] MongoDB-Schema für KM-Meldungen erweitern
- [ ] Neue Collections: `km_schuetzen`, `km_meldungen`, `km_disziplinen`, `km_wettkampfklassen`
- [ ] API-Endpunkte für CRUD-Operationen
- [ ] Benutzerrollen erweitern (km_admin, km_verein)

### Tag 3-4: Excel-Import
- [ ] Excel-Parser für Mitgliederdaten entwickeln
- [ ] Import-Interface im Admin-Bereich
- [ ] Mapping-Assistent für Excel-Spalten
- [ ] Duplikatserkennung und -behandlung

### Tag 5-7: Schützenverwaltung
- [ ] Schützen-Übersicht für Vereine
- [ ] Schützen bearbeiten/hinzufügen
- [ ] Vereinszuordnung validieren
- [ ] Mobile Optimierung

## Woche 2: Meldungsformular und Logik (02.12. - 08.12.)

### Tag 8-10: Meldungsformular
- [ ] Meldungsformular mit Checkbox-Disziplinen
- [ ] Schützenauswahl per Dropdown/Suche
- [ ] Bemerkungsfeld
- [ ] Mehrfachstarts ermöglichen

### Tag 11-12: Wettkampfklassenberechnung
- [ ] Algorithmus für automatische Klassenberechnung
- [ ] Konfiguration der Jahrgangsgrenzen 2025
- [ ] Validierung und Fehlerbehandlung
- [ ] Sonderregeln implementieren

### Tag 13-14: Meldungsübersicht
- [ ] Vereinsübersicht aller Meldungen
- [ ] Filterung und Sortierung
- [ ] Bearbeitung/Löschung von Meldungen
- [ ] Export-Funktionen (PDF/Excel)

## Woche 3: Admin-Funktionen und Finalisierung (09.12. - 15.12.)

### Tag 15-17: Admin-Bereich
- [ ] Gesamtübersicht aller Meldungen
- [ ] Organisatoren-Funktionen (Ort, Datum, Startzeit)
- [ ] Statistiken und Auswertungen
- [ ] E-Mail-Benachrichtigungen

### Tag 18-19: Tests und Bugfixes
- [ ] Umfassende Tests aller Funktionen
- [ ] Performance-Optimierung
- [ ] Mobile Responsiveness prüfen
- [ ] Fehlerbehandlung verbessern

### Tag 20-21: Schulung und Go-Live
- [ ] Dokumentation für Vereine erstellen
- [ ] Schulung der Vereinsvertreter
- [ ] System scharf schalten
- [ ] Support-Bereitschaft

## Technische Umsetzung: Versteckte Entwicklung

### Option 1: Feature-Flags (Empfohlen)
```javascript
// In der Konfiguration
const FEATURES = {
  KM_MELDUNGEN: process.env.NODE_ENV === 'development' || 
                process.env.ENABLE_KM === 'true'
};

// In den Komponenten
{FEATURES.KM_MELDUNGEN && (
  <Link href="/kreismeisterschaft">
    Kreismeisterschaft
  </Link>
)}
```

### Option 2: Separate Routes ohne Navigation
```javascript
// pages/km/index.js - Nicht in der Hauptnavigation verlinkt
// pages/km/meldungen.js
// pages/km/admin.js

// Zugriff nur über direkte URL: /km, /km/meldungen, etc.
```

### Option 3: Beta-Bereich mit Passwort
```javascript
// Middleware für KM-Routen
export function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/km')) {
    const betaPassword = request.cookies.get('beta-access');
    if (!betaPassword || betaPassword !== 'km2025beta') {
      return NextResponse.redirect('/beta-login');
    }
  }
}
```

### Empfohlene Lösung: Feature-Flags + Beta-Bereich

1. **Feature-Flag für Navigation**
   - KM-Links nur für Beta-Tester sichtbar
   - Umgebungsvariable `ENABLE_KM_BETA=true`

2. **Beta-Zugang für Tester**
   - Spezielle Beta-Rolle für ausgewählte Vereine
   - Cookie-basierte Freischaltung

3. **Direkte URLs für Tests**
   - `/km/beta` - Beta-Anmeldung
   - `/km/dashboard` - KM-Dashboard
   - `/km/meldungen` - Meldungsformular

### Startseiten-Anpassung

**Aktuell**: Fokus auf RWK
**Beta-Phase**: Zusätzlicher "Beta-Bereich" Button für Tester
**Nach Go-Live**: Vollständige Integration in die Navigation

```javascript
// Komponente: BetaAccess.jsx
const BetaAccess = () => {
  const [showBeta, setShowBeta] = useState(false);
  
  return (
    <div className="beta-section">
      {showBeta && (
        <Link href="/km/beta" className="beta-button">
          🧪 Beta: Kreismeisterschaft 2025
        </Link>
      )}
      <button onClick={() => setShowBeta(!showBeta)}>
        Beta-Zugang
      </button>
    </div>
  );
};
```

## Deployment-Strategie

### Entwicklung
- Feature-Branch: `feature/km-meldungen`
- Lokale Tests mit MongoDB
- Vercel Preview-Deployments für Beta-Tester

### Beta-Phase
- Merge in `main` mit Feature-Flags
- Produktions-Deployment mit deaktivierten Features
- Manuelle Aktivierung für Beta-Tester

### Go-Live
- Feature-Flags auf `true` setzen
- Navigation erweitern
- Offizielle Ankündigung

## Risiko-Mitigation

### Technische Risiken
- **Datenverlust**: Tägliche Backups während Entwicklung
- **Performance**: Monitoring und Caching implementieren
- **Bugs**: Umfassende Tests vor jedem Deployment

### Zeitliche Risiken
- **Verzögerungen**: Tägliche Fortschrittskontrolle
- **Scope Creep**: Strikt bei MVP-Features bleiben
- **Schulungszeit**: Parallel zur Entwicklung vorbereiten

## Success Metrics

### Woche 1
- [ ] Excel-Import funktioniert mit Testdaten
- [ ] Schützenverwaltung ist einsatzbereit

### Woche 2
- [ ] Meldungsformular ist vollständig funktional
- [ ] Wettkampfklassenberechnung arbeitet korrekt

### Woche 3
- [ ] Admin-Bereich ist einsatzbereit
- [ ] Mindestens 3 Vereine haben erfolgreich getestet
- [ ] System ist produktionsreif