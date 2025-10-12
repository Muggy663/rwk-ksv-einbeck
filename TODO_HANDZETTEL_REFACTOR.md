# 🔄 TODO: Handzettel-Generator Refactoring

## 📋 Problem
Es gibt zwei fast identische Handzettel-Generator Seiten:
1. `/handzettel-generator/page.tsx` (öffentlich, ohne Kontaktdaten)
2. `/verein/handtabellen/page.tsx` (authentifiziert, mit Kontaktdaten)

## 🎯 Lösung: Zusammenfassen in eine Komponente

### Vorgeschlagene Struktur:
```typescript
// src/components/handzettel/HandzettelGenerator.tsx
interface HandzettelGeneratorProps {
  showContactData: boolean;
  showGesamtTab?: boolean;
  backButtonHref?: string;
}

export function HandzettelGenerator({ 
  showContactData, 
  showGesamtTab = false,
  backButtonHref = "/dokumente"
}: HandzettelGeneratorProps) {
  // Gemeinsame Logik
  
  // Kontaktdaten-Filterung basierend auf showContactData:
  const teamsWithShooters = teamsData.map(team => ({
    ...team,
    shooters: (team.shooterIds || []).map(id => shooterMap.get(id)).filter(Boolean),
    // Kontaktdaten nur zeigen wenn erlaubt
    captainName: showContactData ? team.captainName : (team.captainName ? 'Mannschaftsführer' : ''),
    captainPhone: showContactData ? team.captainPhone : '',
    captainEmail: showContactData ? team.captainEmail : ''
  }));
}
```

### Dann in den Seiten:
```typescript
// /handzettel-generator/page.tsx (öffentlich)
export default function PublicHandzettelPage() {
  return (
    <HandzettelGenerator 
      showContactData={false}
      backButtonHref="/dokumente"
    />
  );
}

// /verein/handtabellen/page.tsx (authentifiziert)
export default function VereinHandtabellenPage() {
  return (
    <HandzettelGenerator 
      showContactData={true}
      showGesamtTab={true}
      backButtonHref="/verein/dashboard"
    />
  );
}
```

## ✅ Vorteile:
- **DRY Prinzip:** Keine Code-Duplikation mehr
- **Wartbarkeit:** Änderungen nur an einer Stelle
- **Konsistenz:** Beide Versionen bleiben automatisch synchron
- **Flexibilität:** Einfach erweiterbar für weitere Varianten

## 📝 Aufgaben:
- [x] Dashboard "Handtabellen" → "Meldebögen" umbenannt (v1.8.1)
- [x] Neue gemeinsame Komponente `HandzettelGenerator.tsx` erstellt
- [x] Öffentliche Seite auf neue Komponente umgestellt
- [x] Vereins-Seite auf neue Komponente umgestellt
- [x] Alte duplizierten Code entfernt
- [ ] Tests anpassen (falls vorhanden)

## 🎯 Priorität: Mittel
Funktioniert aktuell, aber Refactoring würde Code-Qualität verbessern.

---
*Erstellt: 12.10.2025 - Version 1.8.1*