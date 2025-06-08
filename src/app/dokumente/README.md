# Dokumentenseite

Diese Komponente stellt eine Dokumentenseite für die RWK App Einbeck bereit. Sie zeigt verschiedene Dokumente wie Ausschreibungen, Formulare und Regelwerke an, die im `/public/documents`-Ordner gespeichert sind.

## Struktur

- `page.tsx`: Hauptkomponente der Dokumentenseite
- `documents.ts`: Enthält die Dokumentendaten
- `DocumentCard.tsx`: Wiederverwendbare Komponente zur Anzeige eines einzelnen Dokuments

## Dokumentenstruktur im public-Ordner

Die Dokumente sind im `/public/documents`-Ordner nach Kategorien organisiert:

```
/public/documents/
  ├── ausschreibungen/
  │   ├── ausschreibung_luftdruck_2025.pdf
  │   └── ausschreibung_kk_2025.pdf
  ├── formulare/
  │   ├── mannschaftsmeldebogen.pdf
  │   └── ergebnismeldebogen.pdf
  ├── ordnungen/
  │   └── rwk_ordnung.pdf
  └── archiv/
      ├── ausschreibung_luftdruck_2024.pdf
      └── ausschreibung_kk_2024.pdf
```

## Wichtige Hinweise

1. **Dateinamen**: Verwenden Sie keine Leerzeichen oder Sonderzeichen in Dateinamen. Verwenden Sie stattdessen Unterstriche (_).
   - Richtig: `ausschreibung_kk_2025.pdf`
   - Falsch: `Ausschreibung RWK Kleinkaliber 2025.pdf`

2. **Pfade**: Stellen Sie sicher, dass die Pfade in der JSON-Datei mit den tatsächlichen Dateinamen übereinstimmen.

3. **Aktivierung**: Ein Dokument wird nur angezeigt, wenn es als aktiv markiert ist (`"active": true`) und die Datei tatsächlich existiert.

## Hinzufügen neuer Dokumente

Um neue Dokumente hinzuzufügen:

1. Legen Sie die PDF-Datei im entsprechenden Unterordner von `/public/documents` ab (ohne Leerzeichen im Dateinamen)
2. Fügen Sie einen neuen Eintrag in der `documents.json`-Datei hinzu
3. Stellen Sie sicher, dass die URL auf den korrekten Pfad im Unterordner verweist

## Beispiel für einen neuen Dokumenteneintrag

```json
{
  "id": "9",
  "title": "Neues Dokument",
  "description": "Beschreibung des neuen Dokuments",
  "path": "/documents/formulare/neues_dokument.pdf",
  "category": "formular",
  "date": "1. Januar 2025",
  "fileType": "PDF",
  "fileSize": "150 KB",
  "active": true
}
```