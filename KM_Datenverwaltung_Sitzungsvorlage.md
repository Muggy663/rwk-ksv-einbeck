# Datenverwaltung-Strategie für KM-System
## Sitzungsvorlage für Präsident & Kreissportleiterin

**Datum:** Januar 2025  
**Thema:** Langfristige Datenpflege-Strategie für Kreismeisterschaftsmeldungen

---

## 🎯 **Problemstellung**

Die digitale KM-Meldung benötigt eine klare Strategie für die Pflege der Schützendaten:

### **Herausforderungen:**
- Schützendaten ändern sich laufend (Austritte, Todesfälle, Vereinswechsel)
- Mehrfach-Vereinsmitgliedschaften (verschiedene Startrechte je Disziplin)
- RWK-Ergebnisse dürfen nicht verloren gehen
- Aufwand vs. Datenqualität abwägen

---

## 📋 **Diskutierte Optionen**

### **Option A: Vereinsvertreter pflegen selbst**
- **Pro:** Aktuelle Daten, dezentrale Verantwortung
- **Contra:** Unzuverlässig, unterschiedliche Motivation

### **Option B: KM-Orga macht jährlichen Import**
- **Pro:** Eine verantwortliche Person, überschaubar
- **Contra:** Daten nicht immer aktuell

### **Option C: Hybrid-Ansatz**
- **Pro:** Beste Datenqualität durch beide Quellen
- **Contra:** Komplexeste Umsetzung

---

## ✅ **Empfohlene Lösung**

### **Pragmatischer Ansatz:**

#### **Einmalig (2025):**
- **Aktueller Excel-Import** als Grundlage (einmalig)
- **RWK-Teilnehmer 2024/25** bleiben geschützt (wegen laufender Saison)

#### **Danach (ab 2026):**
- **Vereinsvertreter pflegen selbst** ihre Mitglieder
- **Eigenverantwortung:** Wer nicht pflegt, hat unordentliche Listen
- **Kein Problem für andere** - jeder Verein sieht nur seine eigenen

---

## 🔧 **Technische Umsetzung**

### **Schutz wichtiger Daten:**
```javascript
// Nur aktuelle RWK-Teilnehmer schützen
protected: schuetze.rwkClubId && saison === "2024/25"
```

### **Mehrfach-Vereinsmitgliedschaft:**
```javascript
// Schütze mit verschiedenen Startrechten
{
  name: "Max Mustermann",
  rwkClubId: "verein_a",           // RWK-Teilnahme
  kmStartrechte: {
    "1.10": "verein_b",            // LG Freihand für Verein B
    "1.11": "verein_c",            // LG Auflage für Verein C
    "2.10": "verein_a"             // LP für Verein A
  }
}
```

---

## 💡 **Vorteile dieser Lösung**

1. **Einfach umsetzbar** - keine komplexe Logik
2. **Klare Verantwortung** bei Vereinen
3. **Motivation zur Pflege** - eigene Unordnung stört
4. **Schutz wichtiger Daten** - laufende RWK-Saison bleibt erhalten
5. **Realistische Erwartungen** - "gut genug" statt "perfekt"

---

## 📅 **Workflow**

### **Jährlicher Zyklus:**
1. **September:** Meldeschluss-Erinnerungen
2. **Oktober-Dezember:** Meldephase mit Vereinspflege
3. **Januar:** Startplan-Erstellung
4. **März/April:** Kreismeisterschaften

### **Laufende Pflege:**
- Vereinsvertreter können jederzeit Mitglieder bearbeiten/hinzufügen
- Inaktive Mitglieder markieren (nicht löschen)
- Bei Problemen: Support-System nutzen

---

## ❓ **Entscheidungsfragen für die Sitzung**

1. **Stimmen Sie der empfohlenen Strategie zu?**
2. **Sollen Vereinsvertreter verpflichtet werden zur Datenpflege?**
3. **Wie gehen wir mit Mehrfach-Vereinsmitgliedschaften um?**
4. **Wer ist Ansprechpartner bei Datenproblemen?**
5. **Gibt es Sonderregelungen für bestimmte Vereine?**

---

## 📝 **Nächste Schritte nach Beschluss**

1. **Dokumentation** der beschlossenen Strategie
2. **Schulung** der Vereinsvertreter
3. **Handbuch** erweitern um Datenpflege-Hinweise
4. **System** entsprechend konfigurieren
5. **Pilotphase** mit ausgewählten Vereinen

---

**Fazit:** Die empfohlene Lösung ist pragmatisch, umsetzbar und schützt wichtige Daten, während sie den Vereinen die Verantwortung für ihre eigenen Listen gibt.