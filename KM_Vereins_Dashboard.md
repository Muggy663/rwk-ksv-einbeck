# Vereins-Dashboard: RWK + KM Integration

## Konzept: Einheitliches Dashboard mit Modulen

### Aktueller Zustand
- Vereins-Dashboard fokussiert auf RWK
- Separate Bereiche für verschiedene Funktionen

### Zukünftiger Zustand (v2.0.0)
- Modulares Dashboard mit RWK und KM
- Einheitliches Design, getrennte Funktionsbereiche

## Dashboard-Layout

### Option 1: Tab-System (Empfohlen)
```
+----------------------------------------------------------------------+
| KSV Einbeck Sport App                           Verein: SV Muster    |
+----------------------------------------------------------------------+
| [Rundenwettkämpfe] [Kreismeisterschaft] [Mitglieder] [Einstellungen]|
+----------------------------------------------------------------------+
|                                                                      |
|  Tab: Rundenwettkämpfe                                               |
|  +------------------------------------------------------------------+ |
|  | RWK Status 2024/25:                                             | |
|  | ✓ Liga A - 5 Schützen gemeldet                                  | |
|  | ✓ Liga B - 3 Schützen gemeldet                                  | |
|  |                                                                  | |
|  | Nächste Termine:                                                 | |
|  | • 15.12.2024 - Runde 3 (noch 2 Wochen)                         | |
|  |                                                                  | |
|  | [Schützen verwalten] [Ergebnisse eingeben] [Tabellen ansehen]   | |
|  +------------------------------------------------------------------+ |
|                                                                      |
+----------------------------------------------------------------------+
```

### Option 2: Karten-System
```
+----------------------------------------------------------------------+
| KSV Einbeck Sport App                           Verein: SV Muster    |
+----------------------------------------------------------------------+
|                                                                      |
|  +-----------------------------+  +-----------------------------+    |
|  | 🎯 RUNDENWETTKÄMPFE         |  | 🏆 KREISMEISTERSCHAFT       |    |
|  |                             |  |                             |    |
|  | Status: Aktiv               |  | Status: Meldungen offen     |    |
|  | Schützen: 8                 |  | Schützen: 12 gemeldet       |    |
|  | Nächste Runde: 15.12.       |  | Meldeschluss: 15.12.        |    |
|  |                             |  |                             |    |
|  | [RWK verwalten]             |  | [KM Meldungen]              |    |
|  +-----------------------------+  +-----------------------------+    |
|                                                                      |
|  +-----------------------------+  +-----------------------------+    |
|  | 👥 MITGLIEDER               |  | ⚙️ EINSTELLUNGEN            |    |
|  |                             |  |                             |    |
|  | Aktive Mitglieder: 25       |  | Vereinsdaten                |    |
|  | Neue Mitglieder: 2          |  | Benutzer & Rollen           |    |
|  |                             |  | Benachrichtigungen          |    |
|  |                             |  |                             |    |
|  | [Mitglieder verwalten]      |  | [Einstellungen]             |    |
|  +-----------------------------+  +-----------------------------+    |
|                                                                      |
+----------------------------------------------------------------------+
```

## Empfohlene Lösung: Hybrid-Ansatz

### Hauptnavigation: Tabs
- Klare Trennung der Hauptbereiche
- Einfache Navigation zwischen RWK und KM
- Konsistent mit bestehender App-Struktur

### Innerhalb der Tabs: Karten/Widgets
- Übersichtliche Darstellung des Status
- Schnelle Aktionen über Buttons
- Responsive Design für Mobile

## Implementierung

### 1. Erweiterte Navigation
```javascript
// components/VereinsNavigation.jsx
const VereinsNavigation = () => {
  const [activeTab, setActiveTab] = useState('rwk');
  
  return (
    <div className="verein-dashboard">
      <nav className="tab-navigation">
        <button 
          className={activeTab === 'rwk' ? 'active' : ''}
          onClick={() => setActiveTab('rwk')}
        >
          🎯 Rundenwettkämpfe
        </button>
        <button 
          className={activeTab === 'km' ? 'active' : ''}
          onClick={() => setActiveTab('km')}
        >
          🏆 Kreismeisterschaft
        </button>
        <button 
          className={activeTab === 'mitglieder' ? 'active' : ''}
          onClick={() => setActiveTab('mitglieder')}
        >
          👥 Mitglieder
        </button>
      </nav>
      
      <div className="tab-content">
        {activeTab === 'rwk' && <RWKDashboard />}
        {activeTab === 'km' && <KMDashboard />}
        {activeTab === 'mitglieder' && <MitgliederDashboard />}
      </div>
    </div>
  );
};
```

### 2. KM-Dashboard Komponente
```javascript
// components/KMDashboard.jsx
const KMDashboard = () => {
  const { kmMeldungen, kmStatus } = useKMData();
  
  return (
    <div className="km-dashboard">
      <div className="status-card">
        <h3>Kreismeisterschaft 2025</h3>
        <div className="status-info">
          <div className="stat">
            <span className="label">Gemeldete Schützen:</span>
            <span className="value">{kmMeldungen.length}</span>
          </div>
          <div className="stat">
            <span className="label">Mannschaften:</span>
            <span className="value">{kmStatus.mannschaften}</span>
          </div>
          <div className="stat">
            <span className="label">Meldeschluss:</span>
            <span className="value">15.12.2024</span>
          </div>
        </div>
      </div>
      
      <div className="action-buttons">
        <Link href="/km/meldungen" className="primary-button">
          Schützen melden
        </Link>
        <Link href="/km/mannschaften" className="secondary-button">
          Mannschaften bilden
        </Link>
        <Link href="/km/uebersicht" className="secondary-button">
          Meldungen ansehen
        </Link>
      </div>
      
      <div className="recent-activity">
        <h4>Letzte Aktivitäten</h4>
        <ul>
          <li>22.11. - Max Mustermann für LG Freihand gemeldet</li>
          <li>21.11. - Mannschaft LG Freihand gebildet</li>
          <li>20.11. - Anna Musterfrau für LP gemeldet</li>
        </ul>
      </div>
    </div>
  );
};
```

### 3. Gemeinsame Mitgliederverwaltung
```javascript
// components/MitgliederDashboard.jsx
const MitgliederDashboard = () => {
  const { mitglieder } = useMitgliederData();
  
  return (
    <div className="mitglieder-dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Aktive Mitglieder</h4>
          <span className="big-number">{mitglieder.aktiv}</span>
        </div>
        <div className="stat-card">
          <h4>RWK-Teilnehmer</h4>
          <span className="big-number">{mitglieder.rwk}</span>
        </div>
        <div className="stat-card">
          <h4>KM-Meldungen</h4>
          <span className="big-number">{mitglieder.km}</span>
        </div>
      </div>
      
      <div className="mitglieder-actions">
        <button className="primary-button">
          Mitglied hinzufügen
        </button>
        <button className="secondary-button">
          Excel importieren
        </button>
        <button className="secondary-button">
          Liste exportieren
        </button>
      </div>
      
      <div className="mitglieder-liste">
        {/* Tabelle aller Mitglieder mit RWK/KM Status */}
      </div>
    </div>
  );
};
```

## Mobile Optimierung

### Responsive Tab-Navigation
```css
/* Mobile: Tabs werden zu Dropdown */
@media (max-width: 768px) {
  .tab-navigation {
    display: flex;
    flex-direction: column;
  }
  
  .tab-navigation button {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
```

### Mobile Dashboard-Layout
```
+----------------------------------+
| KSV Einbeck Sport App            |
+----------------------------------+
| [🎯 Rundenwettkämpfe      ▼]     |
+----------------------------------+
|                                  |
| RWK Status 2024/25:              |
| ✓ Liga A - 5 Schützen            |
| ✓ Liga B - 3 Schützen            |
|                                  |
| Nächste Runde: 15.12.            |
|                                  |
| [Schützen verwalten]             |
| [Ergebnisse eingeben]            |
| [Tabellen ansehen]               |
|                                  |
+----------------------------------+
```

## Vorteile des einheitlichen Dashboards

1. **Konsistente Benutzererfahrung**
   - Gleiche Navigation für RWK und KM
   - Einheitliches Design und Verhalten

2. **Effiziente Nutzung**
   - Alle Vereinsfunktionen an einem Ort
   - Schneller Wechsel zwischen Bereichen

3. **Gemeinsame Datenbasis**
   - Mitglieder für beide Bereiche nutzbar
   - Konsistente Stammdaten

4. **Zukunftssicher**
   - Einfache Erweiterung um weitere Module
   - Skalierbare Architektur

## Migration von bestehenden Nutzern

### Sanfte Einführung
- Bestehende RWK-Funktionen bleiben unverändert
- KM-Tab zunächst nur für Beta-Nutzer sichtbar
- Schrittweise Einführung neuer Features

### Schulung
- Video-Tutorial für das neue Dashboard
- Schriftliche Anleitung für Vereinsadmins
- Support während der Umstellungsphase