# To-Do Liste für Version 0.6.2

## Dringende Aufgaben

1. **PDF-Generierungsfehler beheben**
   - Fehler bei der PDF-Generierung identifizieren
   - Mögliche Probleme mit jsPDF oder jsPDF-autotable untersuchen
   - Fehlerbehandlung in der PDF-Generator-Klasse verbessern

2. **Firestore-Regeln testen**
   - Sicherstellen, dass die aktualisierten Regeln korrekt funktionieren
   - Zugriff auf audit_logs und documents Collections überprüfen
   - Berechtigungen für verschiedene Benutzerrollen testen

## Weitere Verbesserungen

1. **Automatische Mannschaftssuche**
   - Implementieren einer automatischen Suche beim Laden der Teams-Seite
   - Automatische Auswahl der neuesten Saison

2. **Vorjahresdurchschnitt-Berechnung optimieren**
   - Fehlerbehandlung verbessern
   - Caching-Mechanismus für bessere Performance implementieren

3. **Onboarding-Assistent und Passwortänderungsaufforderung**
   - Alternative Speichermethoden für Browser ohne localStorage
   - Verbesserte Benutzerführung

4. **UI-Verbesserungen**
   - Konsistente Fehlermeldungen
   - Verbesserte Ladeanimationen
   - Barrierefreiheit erhöhen

## Dokumentation

1. **Handbuch aktualisieren**
   - Neue Features dokumentieren
   - Bekannte Probleme und Workarounds beschreiben

2. **Entwicklerdokumentation**
   - Code-Kommentare verbessern
   - Architekturdiagramm erstellen
   - Datenflussdiagramm erstellen

## Tests

1. **Manuelle Tests**
   - PDF-Generierung mit verschiedenen Datenmengen
   - Vorjahresdurchschnitt-Berechnung mit und ohne historische Daten
   - Onboarding-Assistent und Passwortänderungsaufforderung mit verschiedenen Browsern

2. **Automatisierte Tests**
   - Unit-Tests für kritische Komponenten
   - Integration-Tests für Hauptfunktionen