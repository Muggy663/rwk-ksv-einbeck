# Debugging-Notizen für Version 0.6.2

## Behobene Probleme

1. **Syntaxfehler in team-managers/page.tsx**
   - Unerwartete Zeilenumbruchzeichen (`\n`) in den map-Funktionen wurden entfernt
   - Betraf die Funktionen für `seasonsData`, `clubsData` und `leaguesData`

2. **Fehlende Pakete**
   - Folgende Pakete wurden installiert:
     ```bash
     npm install react-hook-form @hookform/resolvers zod jspdf jspdf-autotable
     ```
   - Diese Pakete werden für Formularvalidierung (LoginForm) und PDF-Generierung benötigt

3. **Berechtigungsfehler bei Documents und Audit**
   - Firestore-Regeln wurden aktualisiert, um Zugriff auf `audit_logs` und `documents` Collections zu ermöglichen

4. **Select.Item ohne value in der Audit-Komponente**
   - Leere Werte in den SelectItems der AuditTrail-Komponente wurden durch nicht-leere Werte ersetzt:
     - `""` wurde zu `"all-actions"` für den Aktionsfilter
     - `""` wurde zu `"all-dates"` für den Datumsfilter

5. **Fehlendes System & Berichte in der Admin-Navigation**
   - Ein neuer Menüpunkt für "System & Berichte" wurde in der MainNav-Komponente hinzugefügt
   - Verweist auf `/admin/exports` und verwendet das FileDown-Icon

## Offene Probleme

1. **PDF-Generierung wirft Fehler**
   - Zwei Fehler bei der PDF-Generierung festgestellt
   - Weitere Untersuchung erforderlich

2. **Port-Änderung**
   - Der Entwicklungsserver läuft jetzt auf Port 3000 statt auf 9003
   - Mögliche Ursachen: Konfigurationsänderung oder blockierter Port

3. **Watchpack-Fehler**
   - Warnungen bezüglich Systemdateien (DumpStack.log.tmp, hiberfil.sys, etc.)
   - Diese können ignoriert werden - normale Warnungen, wenn Next.js versucht, Systemdateien zu überwachen

4. **useLayoutEffect-Warnungen**
   - Warnungen bezüglich useLayoutEffect im Server-Rendering
   - Diese sind typisch für Next.js und beeinträchtigen die Funktionalität nicht

## Nächste Schritte

1. **PDF-Generierungsfehler beheben**
   - Fehler bei der PDF-Generierung identifizieren und beheben
   - Möglicherweise Probleme mit jsPDF oder jsPDF-autotable

2. **Weitere Tests durchführen**
   - Testen der Vorjahresdurchschnitt-Berechnung mit und ohne historische Daten
   - Überprüfen der Firestore-Regeln auf korrekte Funktionalität
   - Überprüfen der Navigation und Menüpunkte auf Vollständigkeit

3. **Dokumentation aktualisieren**
   - Handbuch und Fortschrittsnotizen auf den neuesten Stand bringen
   - Neue Features und Fehlerbehebungen dokumentieren