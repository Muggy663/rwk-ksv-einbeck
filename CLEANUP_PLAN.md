# Bereinigungsplan für RWK Einbeck App

## 1. Entfernen doppelter Dateien

Folgende Dateien können entfernt werden, da TypeScript-Versionen vorhanden sind:

- `src/lib/services/calendar-service.js` (behalte `.ts`)
- `src/lib/services/updates-service.js` (behalte `.ts`)
- `src/lib/services/statistics-service.js` (behalte `.ts`)
- `src/lib/services/pdf-service.js` (behalte `.ts`)
- `src/hooks/use-auth.js` (behalte `.ts`)
- `src/components/pdf-export-button.js` (behalte `.tsx`)
- `src/app/layout.js` (behalte `.tsx`)

## 2. Entfernen nicht verwendeter Dateien

Diese Dateien scheinen nicht mehr benötigt zu werden:

- `src/app/favicon.ico.bak` (Backup-Datei)
- `src/app/_app.tsx` (nicht benötigt in Next.js 13+)
- `docs/Textdokument (neu).txt` (leeres oder temporäres Dokument)
- `mongoatlasdb.txt` (in Dokumentation integriert)
- `commit_message.txt` (temporäre Datei)
- `firebase-debug.log` (Log-Datei)
- `firestore-debug.log` (Log-Datei)

## 3. Konsolidieren der Ordnerstruktur

Folgende Ordner sollten reorganisiert werden:

- `src/ai/` → `src/dev/ai/` (wenn nur für Entwicklung)
- `src/docs/` und `docs/` → ein einziger Ordner `docs/`
- `src/components/stats/` und `src/components/statistics/` → ein Ordner

## 4. Konsolidieren der Services

Diese Services sollten zusammengeführt werden:

- `src/lib/services/document-service.ts`
- `src/lib/services/document-service-client.ts`
- `src/lib/services/documents-service.ts`

## 5. Aktualisieren der .gitignore

Fügen Sie diese Einträge zu `.gitignore` hinzu:

```
# Build-Artefakte
.next/
out/

# Logs
firebase-debug.log
firestore-debug.log
*.log

# Umgebungsvariablen
.env.local
.env.*.local

# Temporäre Dateien
*.bak
*.tmp
```

## 6. Überprüfen nicht verwendeter Abhängigkeiten

Führen Sie diesen Befehl aus, um nicht verwendete Abhängigkeiten zu finden:

```bash
npx depcheck
```

## 7. Firestore zu MongoDB Migration (separates Projekt)

### Schritte:

1. **Datenmodellierung**: 
   - Definieren Sie das MongoDB-Schema basierend auf Ihrem Firestore-Schema
   - Erstellen Sie Interfaces für alle Datentypen

2. **Migrations-Tool**:
   - Erstellen Sie ein Tool, das Daten aus Firestore liest
   - Transformieren Sie die Daten ins MongoDB-Format
   - Schreiben Sie die Daten in MongoDB

3. **Service-Umstellung**:
   - Erstellen Sie MongoDB-Versionen aller Firestore-Services
   - Implementieren Sie Fallback-Mechanismen
   - Aktualisieren Sie API-Routen

4. **Testen**:
   - Testen Sie die Migration mit einer kleinen Datenmenge
   - Vergleichen Sie die Ergebnisse

5. **Vollständige Migration**:
   - Führen Sie die vollständige Migration durch
   - Überwachen Sie den Prozess

6. **Validierung**:
   - Überprüfen Sie, ob alle Daten korrekt migriert wurden
   - Führen Sie Integrationstests durch