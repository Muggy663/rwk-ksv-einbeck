// src/app/dokumente/documents.ts
export interface Document {
  id: string;
  title: string;
  description: string;
  url: string;
  category: 'ausschreibung' | 'formular' | 'ordnung' | 'archiv';
  date: string;
  fileType: string;
  fileSize: string;
}

// Dokumente aus dem public/documents Ordner mit Unterordnern nach Kategorien
export const documents: Document[] = [
  {
    id: '1',
    title: 'Ausschreibung RWK Luftdruck 2025',
    description: 'Offizielle Ausschreibung für den Rundenwettkampf Luftdruck der Saison 2025',
    url: '/documents/ausschreibungen/ausschreibung_luftdruck_2025.pdf',
    category: 'ausschreibung',
    date: '15. April 2025',
    fileType: 'PDF',
    fileSize: '245 KB'
  },
  {
    id: '2',
    title: 'Ausschreibung RWK Kleinkaliber 2025',
    description: 'Offizielle Ausschreibung für den Rundenwettkampf Kleinkaliber der Saison 2025',
    url: '/documents/ausschreibungen/ausschreibung_kk_2025.pdf',
    category: 'ausschreibung',
    date: '15. März 2025',
    fileType: 'PDF',
    fileSize: '230 KB'
  },
  {
    id: '3',
    title: 'Mannschaftsmeldebogen',
    description: 'Formular zur Meldung von Mannschaften für den Rundenwettkampf',
    url: '/documents/formulare/mannschaftsmeldebogen.pdf',
    category: 'formular',
    date: '10. Januar 2025',
    fileType: 'PDF',
    fileSize: '125 KB'
  },
  {
    id: '4',
    title: 'Ergebnismeldebogen (Papierform)',
    description: 'Formular zur manuellen Erfassung von Wettkampfergebnissen',
    url: '/documents/formulare/ergebnismeldebogen.pdf',
    category: 'formular',
    date: '10. Januar 2025',
    fileType: 'PDF',
    fileSize: '110 KB'
  },
  {
    id: '5',
    title: 'RWK-Ordnung KSV Einbeck',
    description: 'Aktuelle Rundenwettkampfordnung des Kreisschützenverbandes Einbeck',
    url: '/rwk-ordnung',
    category: 'ordnung',
    date: '1. Januar 2025',
    fileType: 'Webseite',
    fileSize: '-'
  },
  {
    id: '6',
    title: 'Benutzerhandbuch RWK Einbeck App',
    description: 'Ausführliche Anleitung zur Nutzung der RWK Einbeck App',
    url: '/handbuch',
    category: 'ordnung',
    date: '24. Mai 2025',
    fileType: 'Webseite',
    fileSize: '-'
  },
  {
    id: '7',
    title: 'Ausschreibung RWK Luftdruck 2024',
    description: 'Archivierte Ausschreibung für den Rundenwettkampf Luftdruck der Saison 2024',
    url: '/documents/archiv/ausschreibung_luftdruck_2024.pdf',
    category: 'archiv',
    date: '15. April 2024',
    fileType: 'PDF',
    fileSize: '240 KB'
  },
  {
    id: '8',
    title: 'Ausschreibung RWK Kleinkaliber 2024',
    description: 'Archivierte Ausschreibung für den Rundenwettkampf Kleinkaliber der Saison 2024',
    url: '/documents/archiv/ausschreibung_kk_2024.pdf',
    category: 'archiv',
    date: '15. März 2024',
    fileType: 'PDF',
    fileSize: '225 KB'
  }
];