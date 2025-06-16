# MongoDB-Integration für RWK Einbeck App

## Übersicht

In Version 0.7.5 wurde die Dokumentenverwaltung von einer lokalen JSON-Datei auf MongoDB migriert. Diese Dokumentation beschreibt die Implementierung und Verwendung der MongoDB-Integration.

## Architektur

Die MongoDB-Integration besteht aus folgenden Komponenten:

1. **MongoDB-Verbindung** (`src/lib/db/mongodb.ts`):
   - Stellt eine Verbindung zur MongoDB-Datenbank her
   - Verwendet die Umgebungsvariable `MONGODB_URI`
   - Implementiert Singleton-Pattern für die Entwicklungsumgebung

2. **Dokument-Service** (`src/lib/db/document-service-mongo.ts`):
   - CRUD-Operationen für Dokumente in MongoDB
   - Konvertierung zwischen MongoDB-Dokumenten und App-Dokumenten
   - Migration von JSON zu MongoDB

3. **API-Routen**:
   - `/api/documents`: Liste aller Dokumente, Erstellen neuer Dokumente
   - `/api/documents/[id]`: Lesen, Aktualisieren, Löschen einzelner Dokumente
   - `/api/upload`: Hochladen von Dateien in MongoDB GridFS
   - `/api/files/[id]`: Abrufen von Dateien aus MongoDB GridFS
   - `/api/migrate`: Migration von JSON zu MongoDB
   - `/api/admin/storage-check`: Überprüfung der MongoDB-Speichernutzung

4. **Admin-Seiten**:
   - `/admin/migrate`: Migration von JSON zu MongoDB
   - `/admin/storage`: Überwachung der MongoDB-Speichernutzung

5. **Fallback-Mechanismus**:
   - Wenn MongoDB nicht verfügbar ist, wird auf die lokale JSON-Datei zurückgegriffen
   - Implementiert in `document-service.ts` und auf der Dokumentenseite

## Einrichtung

### MongoDB Atlas

1. Erstellen Sie ein Konto bei [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Erstellen Sie einen Cluster (kostenloser M0-Cluster ist ausreichend)
3. Erstellen Sie einen Datenbankbenutzer mit Lese- und Schreibrechten
4. Erlauben Sie Netzwerkzugriff von überall (0.0.0.0/0) für die Entwicklung
5. Kopieren Sie die Verbindungszeichenfolge

### Umgebungsvariablen

Erstellen Sie eine `.env.local`-Datei im Hauptverzeichnis des Projekts:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rwk_einbeck?retryWrites=true&w=majority
```

Ersetzen Sie `username`, `password` und `cluster.mongodb.net` mit Ihren tatsächlichen Werten.

### Abhängigkeiten

Installieren Sie die erforderlichen Abhängigkeiten:

```bash
npm install mongodb @radix-ui/react-progress
```

## Migration

Um Dokumente von der JSON-Datei zu MongoDB zu migrieren:

1. Öffnen Sie die Seite `/admin/migrate` im Browser
2. Klicken Sie auf "Migration starten"
3. Warten Sie, bis die Migration abgeschlossen ist

## Speichernutzung

Um die MongoDB-Speichernutzung zu überwachen:

1. Öffnen Sie die Seite `/admin/storage` im Browser
2. Die Seite zeigt die aktuelle Speichernutzung und verfügbaren Speicherplatz an

## Bekannte Probleme und Lösungen

### Speichernutzungsanzeige

Die Speichernutzungsanzeige kann manchmal 0.00 MB anzeigen, obwohl Dokumente vorhanden sind. Dies liegt daran, dass MongoDB die Speichernutzung anders berechnet als erwartet. Die Anzeige ist dennoch nützlich, um Trends zu erkennen.

### Vercel-Deployment

Beim Deployment auf Vercel gibt es einige Einschränkungen:

1. Vercel hat ein schreibgeschütztes Dateisystem, daher können keine Dateien lokal gespeichert werden
2. Die MongoDB-Integration funktioniert auf Vercel, aber die Dateien müssen in MongoDB GridFS gespeichert werden
3. Die Migration muss lokal durchgeführt werden, bevor die Anwendung auf Vercel deployed wird

## Weiterentwicklung

Für zukünftige Versionen sind folgende Verbesserungen geplant:

1. Verbesserte Fehlerbehandlung bei der MongoDB-Verbindung
2. Caching von häufig abgerufenen Dokumenten für bessere Performance
3. Automatische Bereinigung von nicht mehr verwendeten Dateien in GridFS
4. Verbesserte Speichernutzungsanzeige mit detaillierteren Informationen

## Für Entwickler

### MongoDB-Verbindung

Die MongoDB-Verbindung wird in `src/lib/db/mongodb.ts` implementiert. Die Verbindung wird als Singleton implementiert, um mehrere Verbindungen während der Entwicklung zu vermeiden.

```typescript
// Beispiel für die Verwendung der MongoDB-Verbindung
import { getMongoDb } from '@/lib/db/mongodb';

async function example() {
  const db = await getMongoDb();
  const collection = db.collection('documents');
  const documents = await collection.find({}).toArray();
  return documents;
}
```

### GridFS für Dateien

Dateien werden in MongoDB GridFS gespeichert. Die API-Route `/api/upload` implementiert das Hochladen von Dateien, und die API-Route `/api/files/[id]` implementiert das Abrufen von Dateien.

```typescript
// Beispiel für das Hochladen einer Datei
const formData = new FormData();
formData.append('file', file);
formData.append('category', 'ausschreibung');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
const filePath = data.path; // /api/files/[id]
```

### Fallback-Mechanismus

Der Fallback-Mechanismus ist in `document-service.ts` und auf der Dokumentenseite implementiert. Wenn MongoDB nicht verfügbar ist, wird auf die lokale JSON-Datei zurückgegriffen.

```typescript
// Beispiel für den Fallback-Mechanismus
async function getAllDocuments() {
  try {
    // Versuche zuerst, Dokumente von der MongoDB-API zu laden
    const apiResponse = await fetch('/api/documents');
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      if (apiData.documents && apiData.documents.length > 0) {
        return apiData.documents;
      }
    }
  } catch (apiErr) {
    console.warn('Fehler beim Laden der Dokumente aus MongoDB, fallback zu JSON:', apiErr);
  }
  
  // Fallback: Lade Dokumente aus der JSON-Datei
  const jsonResponse = await fetch('/data/documents.json');
  const jsonData = await jsonResponse.json();
  return jsonData.documents;
}
```