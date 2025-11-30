import React from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Document } from '@/lib/services/document-service';
import { DocumentCard } from './DocumentCard';

interface LigaGroupingProps {
  documents: Document[];
}

export function LigaGrouping({ documents }: LigaGroupingProps) {
  // Gruppiere Dokumente nach Liga-Typ
  const groupedDocuments: Record<string, Document[]> = {};
  
  // Bekannte Liga-Typen
  const knownTypes = [
    'Kreisoberliga',
    'Kreisliga',
    'Kreisklasse',
    'Bezirksliga',
    'Bezirksklasse',
    'Landesliga'
  ];
  
  // Gruppiere Dokumente nach Liga-Typ
  documents.forEach(doc => {
    let assigned = false;
    
    // Prüfe, ob der Titel einen bekannten Liga-Typ enthält
    for (const type of knownTypes) {
      if (doc.title.includes(type)) {
        if (!groupedDocuments[type]) {
          groupedDocuments[type] = [];
        }
        groupedDocuments[type].push(doc);
        assigned = true;
        break;
      }
    }
    
    // Wenn kein bekannter Typ gefunden wurde, füge es zu "Sonstige" hinzu
    if (!assigned) {
      if (!groupedDocuments['Sonstige']) {
        groupedDocuments['Sonstige'] = [];
      }
      groupedDocuments['Sonstige'].push(doc);
    }
  });
  
  // Sortiere die Gruppen nach Priorität
  const sortedGroups = Object.keys(groupedDocuments).sort((a, b) => {
    // Bekannte Typen haben Vorrang vor "Sonstige"
    if (a === 'Sonstige') return 1;
    if (b === 'Sonstige') return -1;
    
    // Sortiere nach der Reihenfolge in knownTypes
    const indexA = knownTypes.indexOf(a);
    const indexB = knownTypes.indexOf(b);
    return indexA - indexB;
  });
  
  return (
    <div className="space-y-8">
      {sortedGroups.map(group => (
        <div key={group} className="space-y-4">
          <h3 className="text-lg font-medium text-primary border-b pb-2">{group}</h3>
          {groupedDocuments[group].map(doc => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      ))}
    </div>
  );
}
