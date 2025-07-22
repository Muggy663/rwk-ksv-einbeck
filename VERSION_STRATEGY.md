# Versionierungsstrategie für RWK Einbeck

## Hybride Versionierung

Wir verwenden eine hybride Versionierungsstrategie, bei der die Web-App und die native App teilweise synchronisierte Versionsnummern haben:

### Format

- **Web-App**: 0.9.9.x
- **Native App**: 0.9.x.y

### Bedeutung der Nummern

1. **Erste Zahl (0)**: Hauptversion des Gesamtprojekts
2. **Zweite Zahl (9)**: Unterversion des Gesamtprojekts
3. **Dritte Zahl**:
   - Web-App: Funktionsversion der Web-App (9)
   - Native App: Funktionsversion der nativen App (1)
4. **Vierte Zahl**:
   - Web-App: Bugfix/Patch-Version der Web-App
   - Native App: Bugfix/Patch-Version der nativen App

### Beispiele

- Web-App 0.9.9.6 + Native App 0.9.1.0
- Web-App 0.9.9.7 + Native App 0.9.1.1
- Web-App 0.9.9.8 + Native App 0.9.2.0

### Wann erhöhen?

- **Dritte Zahl**: Bei größeren Funktionsänderungen oder neuen Features
- **Vierte Zahl**: Bei Bugfixes, kleinen Verbesserungen oder Anpassungen

### Vorteile

- Klare Zuordnung zur Hauptversion des Projekts
- Unabhängige Entwicklungszyklen für Web und App
- Bessere Kommunikation mit Nutzern
- Flexibilität bei Updates

## Versionshistorie

### Web-App
- 0.9.9.0: Vollständiges E-Mail-System mit Error-Monitoring
- 0.9.9.5: App-Verbesserungen und Copyright-Informationen
- 0.9.9.6: Verbesserte PDF-Anzeige

### Native App
- 0.9.1.0: Erste offizielle Version mit verbesserter PDF-Anzeige und Statusleisten-Fix