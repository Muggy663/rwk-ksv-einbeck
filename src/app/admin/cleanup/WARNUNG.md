# ⚠️ WARNUNG: Datenbereinigungsfunktion deaktiviert ⚠️

## Kritischer Fehler in der Datenbereinigung

Die Datenbereinigungsfunktion wurde deaktiviert, da sie einen kritischen Fehler enthielt, der zum Löschen von Daten führte.

### Was ist passiert?

Die Funktion `performAdvancedCleanup` in `src/lib/services/advanced-cleanup.ts` hat fälschlicherweise alle Daten gelöscht, die als "verwaist" oder "inkonsistent" erkannt wurden, ohne ausreichende Prüfungen durchzuführen. Dies führte zum Verlust von Schützen-Daten und deren Ergebnissen.

### Betroffene Daten

- Schützen (rwk_shooters)
- Schützen-Ergebnisse (rwk_scores)
- Schützen-Team-Zuordnungen (rwk_team_shooters)

### Aktuelle Maßnahmen

1. Die Bereinigungsfunktion wurde deaktiviert, um weiteren Datenverlust zu verhindern.
2. Die Diagnose-Funktion bleibt aktiv, um Probleme zu identifizieren, ohne Änderungen vorzunehmen.

### Nächste Schritte

1. Manuelle Wiederherstellung der gelöschten Daten
2. Überarbeitung der Bereinigungsfunktion mit besseren Sicherheitsmaßnahmen:
   - Backup vor Bereinigung
   - Detaillierte Protokollierung aller Änderungen
   - Bestätigungsdialog mit Auflistung der zu löschenden Daten
   - Schrittweise Bereinigung mit Zwischenbestätigungen

### Kontakt

Bei Fragen oder Problemen wenden Sie sich bitte an den Administrator.

---

**NICHT ENTFERNEN:** Diese Warnung dient als Erinnerung, die Bereinigungsfunktion gründlich zu überarbeiten, bevor sie wieder aktiviert wird.