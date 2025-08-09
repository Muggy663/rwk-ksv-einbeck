# 🔄 **SCHÜTZEN-MIGRATION PLAN**
## **Nach RWK-Abschluss morgen Abend**

---

## 📋 **VORBEREITUNG**

### ✅ **1. Wartungshinweis auf Startseite**
- [ ] Wartungshinweis aktivieren
- [ ] Benutzer über geplante Arbeiten informieren
- [ ] Zeitfenster kommunizieren

### ✅ **2. Backup erstellen**
- [ ] Vollständiges Firestore-Backup
- [ ] Excel-Export aller aktuellen Schützen
- [ ] Dokumentation der aktuellen Datenstruktur

---

## 🚀 **MIGRATION DURCHFÜHRUNG**

### ✅ **Phase 1: Daten-Bereinigung**
- [ ] Alle `rwk_shooters` löschen
- [ ] Alle `km_shooters` löschen
- [ ] Collections komplett leeren

### ✅ **Phase 2: Neu-Import**
- [ ] Excel-Datei mit korrekter Struktur vorbereiten
- [ ] Import-Script ausführen
- [ ] Datenvalidierung durchführen

### ✅ **Phase 3: System-Anpassung**
- [ ] KM-System auf `rwk_shooters` umstellen
- [ ] Doppelte Queries entfernen
- [ ] Vereinsseiten testen

### ✅ **Phase 4: Validierung**
- [ ] Alle Schützen korrekt importiert
- [ ] Vereinszuordnungen stimmen
- [ ] RWK + KM funktionieren

---

## 📊 **EXCEL-FORMAT**

```
A1: Mitgliedsnummer (mit führender 0)
B1: Verein
C1: Akad. Titel
D1: Name (Nachname)
E1: Vorname
F1: Nachsatz
G1: Geburtsdatum
```

---

## ⚠️ **WICHTIGE HINWEISE**

1. **Timing**: Erst nach RWK-Abschluss starten
2. **Backup**: Immer vollständiges Backup vor Migration
3. **Testing**: Alle Funktionen nach Migration testen
4. **Rollback**: Plan B bereithalten falls Probleme

---

## 🎯 **ERGEBNIS**

- ✅ Eine zentrale Schützen-Collection (`rwk_shooters`)
- ✅ Keine Duplikate mehr
- ✅ RWK + KM nutzen dieselben Daten
- ✅ Bessere Performance
- ✅ Einfachere Wartung