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

## Hinzufügen neuer Dokumente

Um neue Dokumente hinzuzufügen:

1. Legen Sie die PDF-Datei im entsprechenden Unterordner von `/public/documents` ab
2. Fügen Sie einen neuen Eintrag in der `documents.ts`-Datei hinzu
3. Stellen Sie sicher, dass die URL auf den korrekten Pfad im Unterordner verweist

## Beispiel für einen neuen Dokumenteneintrag

```typescript
{
  id: '9',
  title: 'Neues Dokument',
  description: 'Beschreibung des neuen Dokuments',
  url: '/documents/formulare/neues_dokument.pdf', // Pfad zum entsprechenden Unterordner
  category: 'formular', // 'ausschreibung', 'formular', 'ordnung' oder 'archiv'
  date: '1. Januar 2025',
  fileType: 'PDF',
  fileSize: '150 KB'
}
```