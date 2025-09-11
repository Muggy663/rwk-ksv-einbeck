# 🎯 RWK Platform

> **Modulare Plattform für Schützenverband-Verwaltung**

Eine skalierbare, modulare Lösung für die digitale Verwaltung von Schützenvereinen und Kreisverbänden. Entwickelt als Weiterentwicklung der erfolgreichen RWK Einbeck App.

[![Version](https://img.shields.io/badge/Version-1.0.0--alpha-orange?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#)
[![Platform](https://img.shields.io/badge/Platform-Multi--Tenant-green?style=for-the-badge)](#)

## ✨ Vision

**Eine Plattform - Alle Kreisverbände**

Statt 20 verschiedene Apps zu pflegen, eine modulare Plattform mit automatischen Updates für alle Kreisverbände in Deutschland.

## 🧩 Module

Die Plattform ist modular aufgebaut. Jeder Verband oder Verein bucht nur das, was er wirklich braucht. Die Preise sind bewusst niedrig gehalten, um die laufenden Kosten (Server, Wartung) zu decken und die Weiterentwicklung zu unterstützen – nicht, um Profit zu erzielen.

### **Für Kreisverbände (Wettkampf-Verwaltung):**
- 🎯 **RWK-Modul:** €10 / Monat
- 🏆 **KM-Modul:** €10 / Monat
- 📦 **Wettkampf-Paket (RWK + KM):** **€15 / Monat** (Starker Anreiz, beides zu nutzen)

### **Für Vereine (Vereinssoftware):**
Die Preise für die Vereinssoftware staffeln sich fair nach der Größe des Vereins.
- **Klein** (< 50 Mitglieder): **€5 / Monat**
- **Mittel** (51 - 150 Mitglieder): **€10 / Monat**
- **Groß** (> 150 Mitglieder): **€15 / Monat**

### **Einrichtung & Support:**
- **Einmalige Einrichtung:** **€99** (inkl. Datenimport & Einführung)

## 🏗️ Architektur

### **Hybrid-Ansatz:**
```
Central Update Server
├── Core Framework (Auto-Update)
├── Module Registry
└── Version Management

Separate Instanzen:
├── ksv-einbeck.de (eigene Domain/DB)
├── ksv-goettingen.de (eigene Domain/DB)
└── ksv-hannover.de (eigene Domain/DB)
```

**Vorteile:**
- ✅ Separate Domains & Datenbanken (Unabhängigkeit)
- ✅ Zentrale Updates (keine 20 Versionen pflegen)
- ✅ Individuelle Anpassungen möglich
- ✅ DSGVO-konform (getrennte Datenverarbeitung)

## 🚀 Features

### **Für Kreisverbände:**
- **Modulares System** - Nur bezahlen was genutzt wird
- **Automatische Updates** - Immer aktuelle Version
- **Eigene Domain** - z.B. ksv-musterstadt.de
- **Custom Branding** - Logo, Farben, Design
- **DSGVO-Compliance** - Getrennte Datenverarbeitung

### **Für Vereine:**
- **Mitgliederverwaltung** - Excel-Import, SEPA-Lastschrift
- **Digitales Kassenbuch** - Gemeinnützigkeits-Reports
- **RWK-Teilnahme** - Ergebniserfassung, Live-Tabellen
- **KM-Meldungen** - Automatische Startlisten
- **Statistiken** - Mitgliederentwicklung, Finanzen

## 🛠️ Technologie

- **Frontend:** Next.js 14, React 18, TypeScript
- **Backend:** Node.js, Firebase/PostgreSQL
- **Updates:** Automatisches Update-System
- **Security:** Tenant-Isolation, DSGVO-konform
- **Deployment:** Docker, Kubernetes

## 📋 Roadmap

### **Phase 1: Basis (Q1 2025)**
- [x] Projekt-Setup
- [ ] Core-Framework extrahieren
- [ ] Module-System implementieren
- [ ] RWK/KM Module portieren

### **Phase 2: Neue Module (Q2 2025)**
- [ ] Mitglieder-Modul entwickeln
- [ ] SEPA-Integration (SPG-Verein 4 Alternative)
- [ ] Finanz-Modul mit Gemeinnützigkeits-Reports
- [ ] Excel-Import/Export

### **Phase 3: Platform (Q3 2025)**
- [ ] Update-System implementieren
- [ ] Multi-Tenant Support
- [ ] Erste Pilot-Kunden
- [ ] Performance-Optimierung

### **Phase 4: Scale (Q4 2025)**
- [ ] 10+ Kreisverbände onboarden
- [ ] API für Integrationen
- [ ] Mobile Apps
- [ ] Marketplace für Third-Party Module

## 💰 Geschäftsmodell

### **Zielkunden:**
- **Kreisschützenverbände** in Deutschland (~400 potentielle Kunden)
- **Landesverbände** für überregionale Verwaltung
- **Große Schützenvereine** (>200 Mitglieder)

### **Revenue Streams:**
- **Faire Modul-Abonnements** (siehe oben)
- **Einmalige Einrichtungsgebühr** (€99)
- **Optionaler Premium-Support** (auf Anfrage)
- **Individuelle Weiterentwicklung** (auf Anfrage)

### **Break-Even:**
- **15 Kunden** mit Vollpaket = €4.350/Monat
- **Entwicklungskosten** amortisiert nach 12 Monaten
- **Skalierung** auf 100+ Kunden möglich

## 🎯 Competitive Advantage

### **vs. Bestehende Lösungen:**
- **Modularer Ansatz** - Nur bezahlen was genutzt wird
- **Automatische Updates** - Keine IT-Kenntnisse erforderlich
- **Schießsport-Expertise** - Von Praktikern für Praktiker
- **DSGVO-Ready** - Rechtssichere Datenverarbeitung
- **Faire Preise** - Angepasst an Vereinsbudgets

### **vs. Eigenentwicklung:**
- **Sofort verfügbar** - Keine 2 Jahre Entwicklungszeit
- **Bewährt im Einsatz** - 15+ Vereine nutzen bereits RWK-Basis
- **Kontinuierliche Weiterentwicklung** - Neue Features regelmäßig
- **Support inklusive** - Keine eigene IT-Abteilung nötig

## 📞 Kontakt

**Entwicklung & Vertrieb:**
- **E-Mail:** rwk-leiter-ksve@gmx.de
- **Entwickler:** Marcel Bünger (KSV Einbeck)
- **Demo:** Verfügbar auf Anfrage

**Pilot-Programm:**
- **Kostenlose 3-Monats-Testphase** für erste 5 Kreisverbände
- **Kostenlose Migration** bestehender Daten
- **Persönliche Einführung** und Schulung

## 📄 Lizenz

MIT License - Siehe [LICENSE](LICENSE) für Details.

**Kommerzielle Nutzung erlaubt** - Flexible Lizenzierung für Kreisverbände.

---

**Status:** 🚧 In Entwicklung (Alpha)  
**Nächster Meilenstein:** Core-Framework Extraktion  
**Geschätzte Beta:** Q2 2025  
**Produktiv-Release:** Q3 2025

*Entwickelt mit ❤️ für den deutschen Schießsport*