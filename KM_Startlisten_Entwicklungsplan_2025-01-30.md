# KM-Startlisten & Ergebnisse - Entwicklungsplan

**Datum:** 30. Januar 2025  
**Bereich:** Kreismeisterschafts-System - Startlisten-Generierung & Ergebniserfassung  
**Ziel:** Vollständige Digitalisierung des KM-Wettkampfablaufs

## 🎯 **Priorisierte Features (nach Wichtigkeit)**

### **Phase 1: Erweiterte Startlisten-Generierung (Woche 1-2)**

#### 1.1 **Disziplin-spezifische Zeiten** ⭐⭐⭐
- **Problem:** Verschiedene Disziplinen haben unterschiedliche Schießzeiten
- **Lösung:** 
  - Erweitere `km_disziplinen` um `schiesszeit_minuten` Feld
  - Startlisten-Algorithmus berücksichtigt individuelle Zeiten
  - Automatische Zeitberechnung pro Disziplin

#### 1.2 **Auflage vs. Freihand Unterscheidung** ⭐⭐⭐
- **Problem:** Verschiedene Bewertungssysteme und Zeitbedarf
- **Lösung:**
  - `km_disziplinen.auflage` Boolean-Feld nutzen
  - Separate Zeitslots für Auflage-Disziplinen
  - Unterschiedliche Standverteilung (Auflage braucht spezielle Stände)

#### 1.3 **Gewehr-Sharing Hinweise** ⭐⭐⭐
- **Problem:** Vereine haben oft weniger Gewehre als Schützen
- **Lösung:**
  - Neues Feld in `km_meldungen`: `gewehr_sharing_hinweis` (Text)
  - Anzeige in Startlisten-Generierung
  - Berücksichtigung bei Zeitplanung (längere Pausen)

### **Phase 2: VM-Ergebnisse & Leistungsbasierte Sortierung (Woche 3)**

#### 2.1 **VM-Ergebnisse Integration** ⭐⭐
- **Datenmodell:** 
  ```
  km_vm_ergebnisse:
  - meldung_id (Referenz)
  - ergebnis_ringe (Integer)
  - ergebnis_teiler (Integer, für Auflage)
  - eingegeben_von (User-ID)
  - eingegeben_am (Timestamp)
  ```

#### 2.2 **Leistungsbasierte Sortierung** ⭐⭐
- **Funktionen:**
  - Sortierung nach VM-Ergebnis (beste zuerst)
  - Fallback: Alphabetisch bei fehlenden Ergebnissen
  - Konfigurierbar pro Disziplin

### **Phase 3: Export-Funktionen (Woche 4)**

#### 3.1 **PDF-Startlisten** ⭐⭐
- **Features:**
  - Gruppierung nach Disziplinen
  - Wettkampfklassen-Unterteilung (nach Sitzung)
  - Gewehr-Sharing Hinweise sichtbar
  - Professionelles Layout

#### 3.2 **Excel-Export** ⭐
- **Formate:**
  - Startlisten (bearbeitbar)
  - Ergebnislisten-Vorlagen
  - NSSV-kompatible Formate

### **Phase 4: Ergebniserfassung & Auswertung (Woche 5-6)**

#### 4.1 **KM-Ergebnisse erfassen** ⭐⭐⭐
- **Datenmodell:**
  ```
  km_ergebnisse:
  - meldung_id (Referenz)
  - ergebnis_ringe (Integer)
  - ergebnis_teiler (Integer, für Auflage)
  - platz_disziplin (Integer)
  - platz_altersklasse (Integer)
  - eingegeben_von (User-ID)
  - eingegeben_am (Timestamp)
  ```

#### 4.2 **Ergebnislisten-Generator** ⭐⭐⭐
- **Funktionen:**
  - Automatische Platzberechnung
  - Gruppierung nach Disziplin + Altersklasse
  - Auflage: Zehntelwertung
  - Freihand: Ganze Ringe
  - PDF-Export der Ergebnislisten

#### 4.3 **Ergebniserfassung-Interface** ⭐⭐
- **Features:**
  - Schnelle Eingabe (Barcode-Scanner ready)
  - Live-Platzberechnung
  - Fehlervalidierung
  - Bulk-Import aus Excel

### **Phase 5: Admin-Funktionen (Woche 7)**

#### 5.1 **Erweiterte Startlisten-Verwaltung** ⭐⭐
- **Features:**
  - Startzeiten für ganze Gruppen anpassen
  - Nachmeldungen einarbeiten
  - Absagen verwalten
  - Startlisten "einfrieren" (keine Änderungen mehr)

#### 5.2 **Wettkampf-Dashboard** ⭐
- **Features:**
  - Live-Status des Wettkampfs
  - Fortschritt pro Disziplin
  - Fehlende Ergebnisse anzeigen

## 🗂️ **Datenbank-Erweiterungen**

### Neue Collections:
```javascript
// Erweiterte Disziplinen
km_disziplinen: {
  schiesszeit_minuten: Number,
  auflage: Boolean,
  zehntelwertung: Boolean
}

// VM-Ergebnisse
km_vm_ergebnisse: {
  meldung_id: String,
  ergebnis_ringe: Number,
  ergebnis_teiler: Number,
  eingegeben_von: String,
  eingegeben_am: Timestamp
}

// KM-Ergebnisse
km_ergebnisse: {
  meldung_id: String,
  ergebnis_ringe: Number,
  ergebnis_teiler: Number,
  platz_disziplin: Number,
  platz_altersklasse: Number,
  eingegeben_von: String,
  eingegeben_am: Timestamp
}

// Erweiterte Meldungen
km_meldungen: {
  gewehr_sharing_hinweis: String, // "2 Schützen, 1 Gewehr"
  vm_ergebnis_erforderlich: Boolean
}
```

## 🔄 **Workflow-Integration**

### Kompletter KM-Ablauf:
1. **Meldungen** → Vereine melden Schützen
2. **VM-Ergebnisse** → Qualifikationsergebnisse erfassen
3. **Startlisten** → Automatische Generierung mit allen Faktoren
4. **Wettkampf** → Durchführung mit generierten Listen
5. **Ergebnisse** → Erfassung der KM-Ergebnisse
6. **Auswertung** → Automatische Ergebnislisten

## 📊 **Technische Umsetzung**

### Algorithmus-Verbesserungen:
```javascript
// Erweiterte Startlisten-Generierung
function generiereErweiterteStartliste(meldungen, config) {
  // 1. Nach Disziplin gruppieren
  // 2. VM-Ergebnisse berücksichtigen (Sortierung)
  // 3. Gewehr-Sharing beachten (Zeitpuffer)
  // 4. Auflage/Freihand trennen
  // 5. Disziplin-spezifische Zeiten anwenden
  // 6. Wettkampfklassen berücksichtigen (nach Sitzung)
}
```

### Performance-Optimierungen:
- Caching für häufige Abfragen
- Batch-Updates für Ergebnisse
- Optimierte Datenbankindizes

## 🎯 **Erfolgskriterien**

### Quantitative Ziele:
- **Zeitersparnis:** 80% weniger Aufwand für Startlisten-Erstellung
- **Fehlerreduktion:** 95% weniger manuelle Fehler
- **Benutzerfreundlichkeit:** Max. 3 Klicks für Standardaufgaben

### Qualitative Ziele:
- Sportleiterin kann kompletten KM-Ablauf digital verwalten
- Vereine erhalten professionelle, fehlerfreie Startlisten
- Ergebnislisten werden automatisch generiert
- System ist intuitiv bedienbar

## 📅 **Zeitplan**

| Woche | Phase | Deliverables |
|-------|-------|--------------|
| 1-2   | Erweiterte Startlisten | Disziplin-Zeiten, Auflage/Freihand, Gewehr-Sharing |
| 3     | VM-Integration | VM-Ergebnisse erfassen, Leistungssortierung |
| 4     | Export-Funktionen | PDF-Startlisten, Excel-Export |
| 5-6   | Ergebniserfassung | KM-Ergebnisse, Ergebnislisten-Generator |
| 7     | Admin-Features | Erweiterte Verwaltung, Dashboard |

## 🔮 **Zukunftserweiterungen** (nach KM 2026)

- **Live-Ergebnisse:** Echtzeit-Updates während Wettkampf
- **Statistik-Dashboard:** Mehrjährige Auswertungen
- **Mobile App:** Für Wettkampfleiter vor Ort
- **Automatische Urkunden:** PDF-Generierung mit Namen

---

**Status:** Planung abgeschlossen  
**Nächster Schritt:** Implementierung Phase 1 - Erweiterte Startlisten-Generierung  
**Verantwortlich:** Entwicklungsteam  
**Review:** Nach jeder Phase mit Sportleiterin