# 🔄 Automatisierte Versionsverwaltung

## Übersicht
Das Projekt verwendet ein automatisiertes System zur Versionsverwaltung. Die Version wird zentral in der `package.json` verwaltet und automatisch in alle relevanten Dateien übertragen.

## Workflow für Versionsänderungen

### 1. Version in package.json ändern
```json
{
  "version": "2.3.7b_n"
}
```

### 2. Automatische Aktualisierung ausführen
```bash
npm run update-version
```

### 3. Ergebnis
- ✅ README.md wird automatisch aktualisiert
- ✅ Alle `{{ VERSION }}` Platzhalter werden ersetzt
- ✅ Konsistente Versionierung überall

## Für Entwickler/Nachfolger

**WICHTIG:** Niemals manuell Versionen in README.md ändern!

### Bei neuen Releases:
1. Öffne `package.json`
2. Ändere die `version` Zeile
3. Führe `npm run update-version` aus
4. Commit & Push

### Beispiel:
```bash
# Version ändern (in package.json)
"version": "2.4.0"

# Script ausführen
npm run update-version

# Git Commit
git add .
git commit -m "Version 2.4.0"
git push
```

## Technische Details

### Script-Pfad
- `scripts/update-version.js`

### Betroffene Dateien
- `README.md` (alle `{{ VERSION }}` Platzhalter)
- Weitere Dateien können einfach hinzugefügt werden

### Platzhalter-Format
```
{{ VERSION }} → wird ersetzt durch package.json version
```

## Vorteile
- 🎯 Single Source of Truth
- 🚀 Automatisierung verhindert Fehler
- 📝 Konsistente Dokumentation
- ⚡ Schnelle Updates

---
*Erstellt für nahtlose Versionsverwaltung im RWK Einbeck Projekt*