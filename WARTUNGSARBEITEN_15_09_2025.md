# 🚧 Wartungsarbeiten 15.09.2025 - Rollen-System Update

## 📋 Checkliste für den 15.09.2025

### 🔒 1. Login-Sperre aktivieren
- [ ] **LoginBlocker aktivieren** in Login-Seite einbauen
- [ ] **Komponente:** `/src/components/LoginBlocker.tsx` (bereits erstellt)
- [ ] **Aktivierung:** LoginBlocker in `/src/app/login/page.tsx` einbauen

### 👥 2. Benutzerrollen umstellen

#### Neue Rollen-Struktur:
- **🏃♂️ SPORTLEITER** (statt Vereinsvertreter)
  - ✅ RWK: Vollzugriff
  - ✅ KM: Vollzugriff  
  - ❌ Vereinssoftware: Gesperrt

- **💰 KASSENWART**
  - ✅ Mitgliederverwaltung: Vollzugriff
  - ✅ Beitragsverwaltung: Vollzugriff + SEPA
  - ✅ Geburtstage & Jubiläen: Vollzugriff
  - ❌ Protokolle/Wahlen: Gesperrt
  - ❌ Aufgaben/Lizenzen: Gesperrt

- **📝 SCHRIFTFÜHRER**
  - ✅ Protokolle/Wahlen: Vollzugriff
  - ✅ Mitgliederverwaltung: Nur Lesezugriff
  - ❌ Finanzen/SEPA: Gesperrt

- **👔 VEREINSVORSTAND**
  - ✅ Vereinssoftware: Alle 6 Bereiche
  - ✅ RWK: Lesezugriff
  - ✅ KM: Lesezugriff

- **🏆 KM_ORGA**
  - ✅ KM: Vollzugriff + Admin
  - ✅ RWK: Lesezugriff
  - ❌ Vereinssoftware: Gesperrt

- **🔧 ADMIN**
  - ✅ Alles: Vollzugriff

#### Rollen-Änderungen:
- [ ] **Marcel (marcel.buenger@gmx.de):** `vereinsvertreter` → `sportleiter`
- [ ] **Andere Vereinsvertreter:** Rollen prüfen und anpassen

### 🔐 3. URL-Sicherung implementieren

#### Vereinssoftware-Seiten absichern:
- [ ] `/src/app/vereinssoftware/page.tsx` - Hauptseite
- [ ] `/src/app/vereinssoftware/mitglieder/page.tsx`
- [ ] `/src/app/vereinssoftware/beitraege/page.tsx`
- [ ] `/src/app/vereinssoftware/jubilaeen/page.tsx`
- [ ] `/src/app/vereinssoftware/lizenzen/page.tsx`
- [ ] `/src/app/vereinssoftware/aufgaben/page.tsx`

#### Code-Template für Berechtigungsprüfung:
```typescript
// Am Anfang jeder Vereinssoftware-Seite
const isVereinsvorstand = userAppPermissions?.role === 'vereinsvorstand';
const isKassenwart = userAppPermissions?.role === 'kassenwart';
const isSchriftfuehrer = userAppPermissions?.role === 'schriftfuehrer';
const isAdmin = userAppPermissions?.role === 'admin' || user?.email === 'admin@rwk-einbeck.de';

// Bereichsspezifische Berechtigung prüfen
const hasAccess = isVereinsvorstand || isAdmin || 
  (isKassenwart && ['mitglieder', 'beitraege', 'jubilaeen'].includes(currentPage)) ||
  (isSchriftfuehrer && ['protokolle'].includes(currentPage));

if (user && userAppPermissions && !hasAccess) {
  return <AccessDeniedComponent />;
}
```

### 🛡️ 4. Firebase Security Rules

#### Neue Firestore Rules:
```javascript
// Multi-Tenant Vereinssoftware Rules
match /clubs/{clubId}/mitglieder/{document} {
  allow read, write: if isVereinsvorstand(clubId) || isKassenwart(clubId) || isAdmin();
}

match /clubs/{clubId}/beitraege/{document} {
  allow read, write: if isVereinsvorstand(clubId) || isKassenwart(clubId) || isAdmin();
}

match /clubs/{clubId}/protokolle/{document} {
  allow read, write: if isVereinsvorstand(clubId) || isSchriftfuehrer(clubId) || isAdmin();
}

// RWK/KM Rules (global)
match /shooters/{document} {
  allow read, write: if isSportleiter() || isVereinsvorstand() || isAdmin();
}

match /km_meldungen/{document} {
  allow read, write: if isSportleiter() || isKMOrga() || isAdmin();
}
```

### 📱 5. Dashboard-Auswahl anpassen

#### Bereiche pro Rolle anzeigen:
- [ ] **Sportleiter:** Nur RWK + KM
- [ ] **Kassenwart:** Nur Vereinssoftware (eingeschränkt)
- [ ] **Schriftführer:** Nur Vereinssoftware (eingeschränkt)
- [ ] **Vereinsvorstand:** Alle 3 Bereiche
- [ ] **KM-Orga:** Nur KM + RWK (Lesezugriff)
- [ ] **Admin:** Alle Bereiche

### 🧪 6. Tests durchführen

#### Test-Accounts erstellen:
- [ ] **Sportleiter-Test:** Nur RWK/KM Zugang
- [ ] **Kassenwart-Test:** Nur Mitglieder/Finanzen
- [ ] **Schriftführer-Test:** Nur Protokolle
- [ ] **Vereinsvorstand-Test:** Vollzugriff

#### Test-Szenarien:
- [ ] Dashboard-Auswahl zeigt korrekte Bereiche
- [ ] Direkte URLs werden blockiert
- [ ] Firebase-Regeln funktionieren
- [ ] Keine Endlosschleifen

### 📧 7. Kommunikation

#### Benutzer informieren:
- [ ] **E-Mail an alle Benutzer:** Neue Rollen erklären
- [ ] **FAQ aktualisieren:** Rollen-System dokumentieren
- [ ] **Support bereitstellen:** Für Rückfragen

### 🔄 8. Rollback-Plan

#### Falls Probleme auftreten:
- [ ] **Alte Rollen wiederherstellen**
- [ ] **LoginBlocker deaktivieren**
- [ ] **URL-Sicherung entfernen**
- [ ] **Firebase-Regeln zurücksetzen**

---

## 📝 Wichtige Dateien

### Bereits erstellt:
- ✅ `/src/components/MaintenanceBanner.tsx` - Wartungshinweis (aktiv)
- ✅ `/src/components/LoginBlocker.tsx` - Login-Sperre (bereit)
- ✅ Alle Multi-Tenant APIs erstellt
- ✅ Alle Vereinssoftware-Bereiche auf Multi-Tenant umgestellt

### Noch zu bearbeiten:
- ⏳ Login-Seite (LoginBlocker einbauen)
- ⏳ Alle Vereinssoftware-Seiten (URL-Sicherung)
- ⏳ Firebase Security Rules
- ⏳ Dashboard-Auswahl (Rollen-spezifische Anzeige)

---

## 🎯 Ziel

**Nach den Wartungsarbeiten:**
- Saubere Rollen-Trennung
- Sichere URL-Zugriffe  
- Multi-Tenant Vereinssoftware
- Keine Berechtigungs-Lecks

**Geschätzte Dauer:** 2-4 Stunden (je nach Tests)

---

## 📞 Kontakt

Bei Problemen während der Wartung:
- **Marcel:** marcel.buenger@gmx.de
- **Entwickler:** Verfügbar für Support

---

---

## 🔄 Änderungen seit Version 1.5.7 (11.09.2025)

### ✅ Bereits implementiert:
- **MaintenanceBanner** auf Startseite aktiviert (Wartungshinweis ab sofort sichtbar)
- **LoginBlocker** erstellt (bereit für 15.09.)
- **Dashboard-Auswahl** angepasst: Vereinsvertreter sehen Vereinssoftware als gesperrt
- **Console.log Endlosschleife** in Dashboard behoben
- **Wartungshinweis** vereinfacht (keine Rollen-Details, keine Zeitangaben)
- **Vereinsvertreter-Zugang** zur Vereinssoftware über Dashboard entfernt
- **URL-Zugriffe** noch offen (für Entwicklung bis 15.09.)

### 📋 Status der Vorbereitung:
- ✅ **Wartungshinweis:** Läuft bereits
- ✅ **LoginBlocker:** Bereit, aber noch nicht aktiv
- ✅ **Dashboard-Sperre:** Funktioniert
- ⏳ **URL-Sicherung:** Wartet auf 15.09.
- ⏳ **Rollen-Umstellung:** Wartet auf 15.09.
- ⏳ **Firebase-Regeln:** Wartet auf 15.09.

### 🎯 Aktueller Stand:
- **Benutzer sehen:** Wartungshinweis auf Startseite
- **Vereinsvertreter:** Können nicht mehr über Dashboard zur Vereinssoftware
- **Direkte URLs:** Funktionieren noch (für Entwicklung)
- **System:** Bereit für Wartungsarbeiten am 15.09.

---

**Erstellt am:** 11.09.2025  
**Wartungstermin:** 15.09.2025  
**Status:** Vorbereitet ✅