# 🏗️ RWK Platform - Modularisierungs-Plan

> **Ziel:** Modulare Plattform für Schützenverbände mit Update-System

## 📋 Implementierungs-Phasen

### **Phase 1: Basis-Setup (2-3 Wochen)**
- [ ] Neues Git-Repo `rwk-platform` erstellen
- [ ] Projekt-Struktur anlegen
- [ ] Bestehende RWK-App als Basis kopieren
- [ ] Core-Framework extrahieren
- [ ] Module-System implementieren
- [ ] Lokale Test-Umgebung einrichten

### **Phase 2: RWK/KM Module (1-2 Wochen)**
- [ ] RWK-Modul aus bestehender App extrahieren
- [ ] KM-Modul aus bestehender App extrahieren
- [ ] Module-Loader implementieren
- [ ] Dependency-System einrichten
- [ ] Erste Tests mit modularer Struktur

### **Phase 3: Mitglieder-Modul (3-4 Wochen)**
- [ ] Datenbank-Schema für Mitglieder entwerfen
- [ ] DSGVO-konforme Mitgliederdatenbank
- [ ] Excel-Import für bestehende Daten (Einbecker Schützengilde)
- [ ] Beitragsverwaltung implementieren
- [ ] SEPA-Lastschrift Integration
- [ ] Austritte/Eintritte automatisieren
- [ ] Mitgliederstatistiken integrieren
- [ ] Export-Funktionen (Excel, PDF)

### **Phase 4: Finanz-Modul (2-3 Wochen)**
- [ ] Kassenbuch digital implementieren
- [ ] Beitragsabrechnung automatisieren
- [ ] Ausgaben/Einnahmen-Tracking
- [ ] Gemeinnützigkeits-Reports (wichtig!)
- [ ] Integration mit Mitglieder-Modul
- [ ] Finanzstatistiken
- [ ] Budget-Planung Tools
- [ ] Steuer-Export Funktionen

### **Phase 5: Update-System (2-3 Wochen)**
- [ ] Central Update Server implementieren
- [ ] Auto-Update Mechanismus
- [ ] Rollback-Funktionalität
- [ ] Module-Registry System
- [ ] Version-Management
- [ ] Update-Notifications
- [ ] Backup vor Updates

### **Phase 6: Multi-Instance Support (2-3 Wochen)**
- [ ] Instance-Configuration System
- [ ] Separate Datenbank pro Instanz
- [ ] Domain-Routing implementieren
- [ ] Branding-System (Logo, Farben)
- [ ] Tenant-Isolation sicherstellen
- [ ] Migration-Tools für bestehende Daten

### **Phase 7: Testing & Pilot (2-3 Wochen)**
- [ ] Umfangreiche Tests mit KSV Einbeck
- [ ] Pilot-Instanz für zweiten Kreisverband
- [ ] Performance-Optimierung
- [ ] Security-Audit
- [ ] Dokumentation vervollständigen
- [ ] Support-System einrichten

## 🎯 Prioritäten

### **Sofort (Woche 1-2):**
1. Git-Repo Setup
2. Projekt-Struktur
3. Modularisierungs-Konzept

### **Kurzfristig (Woche 3-6):**
4. Mitglieder-Modul (für Einbecker Schützengilde)
5. SEPA-Integration (SPG-Verein 4 Alternative)

### **Mittelfristig (Woche 7-12):**
6. Finanz-Modul
7. Update-System
8. Zweite Pilot-Instanz

## 💰 Geschäftsmodell

### **Zielpreise:**
- RWK-Modul: €12/Monat
- KM-Modul: €8/Monat
- Mitglieder-Modul: €15/Monat
- Finanz-Modul: €12/Monat
- **Vollpaket: €29/Monat** (statt €47)

### **Staffelung nach Größe:**
- Klein (bis 50 Mitglieder): €20/Monat (-30%)
- Mittel (51-150 Mitglieder): €29/Monat
- Groß (150+ Mitglieder): €35/Monat (+20%)

## 🔧 Technische Anforderungen

### **SEPA-Integration:**
- [ ] SPG-Verein 4 Alternative recherchieren
- [ ] SEPA-XML Generation
- [ ] Bank-Integration (Sparkasse, Volksbank)
- [ ] Lastschrift-Verwaltung
- [ ] Rücklastschrift-Handling

### **DSGVO-Compliance:**
- [ ] Datenschutz-Konzept
- [ ] Einverständniserklärungen
- [ ] Löschfunktionen
- [ ] Datenexport für Mitglieder
- [ ] Audit-Log

### **Performance:**
- [ ] Caching-Strategy
- [ ] Database-Optimierung
- [ ] CDN für Assets
- [ ] Monitoring & Alerting

## 📊 Erfolgs-Metriken

### **Technische KPIs:**
- [ ] Update-Zeit < 5 Minuten
- [ ] Downtime < 1% pro Monat
- [ ] Page Load Time < 2 Sekunden
- [ ] 99.9% Uptime

### **Business KPIs:**
- [ ] 3 Pilot-Kunden bis Ende 2025
- [ ] 10 Kunden bis Mitte 2026
- [ ] Break-Even bei 15 Kunden
- [ ] Customer Satisfaction > 4.5/5

## 📝 Notizen

### **Lessons Learned:**
- Preise müssen realistisch für Kreisverbände sein
- Mitgliederschwund ist überall ein Problem
- Excel-Migration ist essentiell
- SEPA-Integration komplex aber notwendig
- Update-System kritisch für Wartbarkeit

### **Risiken:**
- Komplexität des Update-Systems
- SEPA-Compliance Anforderungen
- Datenbank-Migration Herausforderungen
- Verschiedene RWK-Ordnungen pro Kreisverband

---

**Status:** 🚀 Bereit zum Start
**Nächster Schritt:** Git-Repo erstellen und Projekt-Struktur anlegen
**Verantwortlich:** Marcel Bünger
**Letzte Aktualisierung:** Januar 2025