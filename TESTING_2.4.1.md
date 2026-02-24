# 🧪 Testing Guide Version 2.4.1

## Schnellstart

```bash
npm run dev
```

Dann öffne: http://localhost:3000

## ✅ Was zu testen ist

### 1. RWK-Tabellen (WICHTIGSTE ÄNDERUNG)
**URL:** http://localhost:3000/rwk-tabellen

**Test-Szenario:**
1. Wähle eine Liga aus
2. Öffne eine Liga mit unvollständigen Durchgängen
3. **Erwartung:** 
   - Wenn Team A: DG1=850, DG2=860, DG3=null hat
   - Und Team B: DG1=840, DG2=850, DG3=870 hat
   - Dann zeigt Liga nur DG1+DG2 als Wertung (weil Team A DG3 fehlt)
   - Anzeige: **1710** (fett) und **(2580)** in Klammern für Team B

**Mobile Test:**
- Drehe Handy ins Portrait
- Prüfe ob Klammer-Anzeige auch funktioniert

### 2. Ligalisten Mobile
**URL:** http://localhost:3000/ligalisten

**Test-Szenario:**
1. Öffne auf Handy (oder Browser-DevTools Mobile-Ansicht)
2. **Erwartung:**
   - Buttons nicht mehr zu groß
   - Cards stapeln vertikal
   - Icons kleiner (6x6)
   - Alles gut lesbar

### 3. Neue Komponenten (Optional)

Die neuen Komponenten sind fertig, aber noch nicht eingebaut. Du kannst sie später verwenden:

#### LoadingButton
```tsx
import { LoadingButton } from '@/components/ui/loading-button';

<LoadingButton loading={isSubmitting} loadingText="Speichert...">
  Speichern
</LoadingButton>
```

#### ConfirmDialog
```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

<ConfirmDialog
  open={showConfirm}
  onOpenChange={setShowConfirm}
  onConfirm={handleDelete}
  title="Wirklich löschen?"
  description="Diese Aktion kann nicht rückgängig gemacht werden."
  variant="destructive"
/>
```

#### EmptyState
```tsx
import { EmptyState } from '@/components/ui/empty-state';
import { FileText } from 'lucide-react';

<EmptyState
  icon={FileText}
  title="Noch keine Dokumente"
  description="Laden Sie Ihr erstes Dokument hoch"
  action={{
    label: "Dokument hochladen",
    onClick: () => router.push('/upload')
  }}
/>
```

#### Breadcrumbs
```tsx
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

<Breadcrumbs items={[
  { label: 'Admin', href: '/admin' },
  { label: 'Mannschaften', href: '/admin/teams' },
  { label: 'Bearbeiten' }
]} />
```

#### FormField
```tsx
import { FormField } from '@/components/ui/form-field';

<FormField
  label="E-Mail"
  name="email"
  type="email"
  value={email}
  onChange={setEmail}
  error={emailError}
  required
  placeholder="beispiel@email.de"
/>
```

#### useDebounce
```tsx
import { useDebounce } from '@/hooks/use-debounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  fetchResults(debouncedSearch);
}, [debouncedSearch]);
```

## 🐛 Bekannte Probleme

Keine bekannten Probleme. Falls du welche findest, notiere sie!

## 📝 Feedback

Notiere während des Testens:
- ✅ Was funktioniert gut
- ❌ Was funktioniert nicht
- 💡 Verbesserungsideen

## 🚀 Nach dem Testing

Wenn alles funktioniert:
```bash
git add -A
git commit -m "Version 2.4.1: UX-Verbesserungen"
git push origin master
```

## 📞 Bei Problemen

1. Prüfe Browser-Console (F12)
2. Prüfe Terminal-Output
3. Notiere Fehler-Meldungen
4. Melde dich bei mir!

---

**Viel Erfolg beim Testen! 🎯**
