# ✅ **MIGRATION CHECKLIST**
## **Schritt-für-Schritt Anleitung**

---

## 🚀 **VOR DER MIGRATION**

### ✅ **1. Wartungshinweis aktivieren**
```typescript
// In src/app/page.tsx Zeile ~75
<MaintenanceBanner 
  show={true} // ← Auf true ändern
  message="🔧 Wartungsarbeiten: Schützen-System wird optimiert. Kurze Unterbrechung möglich."
  type="warning"
/>
```

### ✅ **2. Backup erstellen**
- [ ] Firestore-Export über Google Cloud Console
- [ ] Excel-Export der aktuellen Schützen
- [ ] Screenshots der wichtigsten Seiten

### ✅ **3. Excel-Datei vorbereiten**
Format prüfen:
```
A1: Mitgliedsnummer (z.B. "0123")
B1: Verein (exakter Name wie in der App)
C1: Akad. Titel (optional)
D1: Name (Nachname)
E1: Vorname
F1: Nachsatz (optional)
G1: Geburtsdatum (TT.MM.JJJJ oder JJJJ)
```

---

## 🔄 **MIGRATION DURCHFÜHREN**

### ✅ **Schritt 1: Migration-Seite öffnen**
1. Gehe zu: `/admin/migration`
2. Lies alle Warnungen sorgfältig
3. Stelle sicher, dass RWK abgeschlossen ist

### ✅ **Schritt 2: Bereinigung**
1. Klicke "🧹 Alle Schützen löschen"
2. Bestätige die Warnung
3. Warte auf Erfolgsmeldung
4. Prüfe Ergebnis

### ✅ **Schritt 3: Import**
1. Wähle Excel-Datei aus
2. Klicke "📊 Excel importieren"
3. Warte auf Abschluss
4. Prüfe Import-Statistik

---

## 🧪 **NACH DER MIGRATION TESTEN**

### ✅ **1. Admin-Bereich**
- [ ] `/admin/shooters` - Alle Schützen sichtbar?
- [ ] `/admin/teams` - Mannschaften funktionieren?
- [ ] `/admin/clubs` - Vereine korrekt?

### ✅ **2. Vereinsbereich**
- [ ] `/verein/schuetzen` - Schützen pro Verein?
- [ ] `/verein/mannschaften` - Teams funktionieren?
- [ ] Schützen anlegen funktioniert?

### ✅ **3. RWK-System**
- [ ] `/rwk-tabellen` - Tabellen laden?
- [ ] Ergebnisse anzeigen funktioniert?
- [ ] Schützen in Teams sichtbar?

### ✅ **4. KM-System**
- [ ] `/km/meldungen` - Meldungen möglich?
- [ ] `/km/mitglieder` - Schützen sichtbar?
- [ ] KM-Startlisten generieren?

---

## 🎯 **ABSCHLUSS**

### ✅ **1. Wartungshinweis deaktivieren**
```typescript
// In src/app/page.tsx
<MaintenanceBanner 
  show={false} // ← Zurück auf false
  ...
/>
```

### ✅ **2. Erfolg kommunizieren**
- [ ] Vereine informieren
- [ ] Neue Funktionen erklären
- [ ] Support-Kontakt bereitstellen

### ✅ **3. Monitoring**
- [ ] Erste Stunden überwachen
- [ ] Fehler-Logs prüfen
- [ ] User-Feedback sammeln

---

## 🆘 **NOTFALL-PLAN**

Falls Probleme auftreten:

1. **Sofort**: Wartungshinweis aktivieren
2. **Backup**: Firestore-Restore durchführen
3. **Rollback**: Alte Version deployen
4. **Kommunikation**: Nutzer informieren

---

## 📞 **SUPPORT-KONTAKTE**

- **Entwickler**: Marcel Bünger
- **E-Mail**: rwk-leiter-ksve@gmx.de
- **Notfall**: Sofortige Benachrichtigung

---

**🎯 ZIEL**: Ein System, eine Datenquelle, keine Duplikate!