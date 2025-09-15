# 🚧 Wartungsarbeiten 15.09.2025 - Rollen-System Update

## 📋 Checkliste für den 15.09.2025

### 🔒 1. Login-Sperre aktivieren
- [ ] **LoginBlocker aktivieren** in Login-Seite einbauen
- [ ] **Komponente:** `/src/components/LoginBlocker.tsx` (bereits erstellt)
- [ ] **Aktivierung:** LoginBlocker in `/src/app/login/page.tsx` einbauen

### 👥 2. Benutzerrollen umstellen

#### 🎯 Finale Rollen-Struktur (Best-of-Both Hybrid):

**👑 Globale Rollen (Plattform-Ebene):**
- `SUPER_ADMIN`: Entwickler/Betreiber (admin@rwk-einbeck.de) - Vollzugriff auf alles
- `SYSTEM_ADMIN`: System-Administration (Zukunft) - Technische Wartung
- `DATA_MANAGER`: Daten-Import/Export (Zukunft) - Migrations-Aufgaben

**🎯 Kreisverband-Rollen (KV-Ebene):**
- `KV_WETTKAMPFLEITER`: Vollzugriff auf RWK & KM im eigenen KV
- `KV_KM_ORGA`: Hilfspersonal, Vollzugriff auf KM-Modul
- `KV_PRESSEWART`: Schreibzugriff auf News, Lesezugriff auf Wettkämpfe
- `KV_KAMPFRICHTER`: KM-Ergebnisse erfassen, Startlisten verwalten

**🏢 Vereins-Rollen (Club-Ebene - Sofort):**
- `VORSTAND`: Vollzugriff auf alle Module des eigenen Vereins
- `SPORTLEITER`: RWK/KM-Meldungen, Lesezugriff auf Mitglieder für Mannschaftsplanung
- `KASSENWART`: Vollzugriff auf Finanzen & Mitglieder (inkl. SEPA)
- `SCHRIFTFUEHRER`: Vollzugriff auf Vereinsrecht (Protokolle, Wahlen), Lesezugriff auf Mitglieder

**🎓 Erweiterte Vereins-Rollen (Phase 2):**
- `JUGENDWART`: Jugend-Mitglieder verwalten, Ausbildungen planen
- `DAMENWART`: Damen-spezifische Aktivitäten und Events
- `ZEUGWART`: Waffen & Ausrüstung verwalten, Inventar führen
- `PRESSEWART`: Vereins-News schreiben, Berichte erstellen
- `TRAINER`: Ausbildungen durchführen, Lizenzen verwalten
- `AUSBILDER`: Fortgeschrittene Schulungen, Prüfungen abnehmen
- `VEREINSSCHUETZE`: Basis-Mitglied, eigene Daten einsehen
- `EHRENMITGLIED`: Lesezugriff auf Vereinsgeschichte und Ehrungen

**🌍 Skalierungs-Rollen (Zukunft):**
- `VERBANDSLEITER`: Multi-KV-Verwaltung für andere Verbände
- `LANDESSCHIESSWART`: Landes-Ebene für DSB-Integration

#### Rollen-Änderungen:
- [ ] **Datenbank-Migration:** `user_permissions` Collection auf neue Struktur umstellen (von `role: 'vereinsvertreter'` zu `clubRoles: { 'clubId': 'sportleiter' }`).
- [ ] **Marcel (marcel.buenger@gmx.de):** Bleibt `vereinsvertreter`, wird später zu neuen Rollen migriert.
- [ ] **Bestehende Vereinsvertreter:** In die neue `clubRoles`-Struktur migrieren, z.B. als `sportleiter`.
- [ ] **Bestehende KM-Orga:** In die neue `kvRoles`-Struktur migrieren, z.B. als `kv_km_orga`.

### 🔐 3. URL-Sicherung implementieren

#### Vereinssoftware-Seiten absichern:
- [ ] `/src/app/vereinssoftware/page.tsx` - Hauptseite
- [ ] `/src/app/vereinssoftware/mitglieder/page.tsx`
- [ ] `/src/app/vereinssoftware/beitraege/page.tsx`
- [ ] `/src/app/vereinssoftware/finanzen/page.tsx`
- [ ] `/src/app/vereinssoftware/jubilaeen/page.tsx`
- [ ] `/src/app/vereinssoftware/lizenzen/page.tsx`
- [ ] `/src/app/vereinssoftware/aufgaben/page.tsx`
- [ ] `/src/app/vereinssoftware/vereinsrecht_protokolle/page.tsx`

#### Code-Template für Berechtigungsprüfung:
```typescript
// Am Anfang jeder geschützten Seite (Client Component)
import { useAuth } from '@/hooks/useAuth'; // Beispielhafter Hook

const { user, userPermissions } = useAuth();
const clubId = 'aktueller-vereins-kontext'; // aus URL oder State

const hasAccess = (allowedRoles) => {
  if (userPermissions?.platformRole === 'SUPER_ADMIN') return true;
  const userRole = userPermissions?.clubRoles?.[clubId];
  return userRole && allowedRoles.includes(userRole);
};

if (!hasAccess(['vorstand', 'kassenwart'])) {
  return <AccessDeniedComponent />;
}
```

### 🛡️ 4. Firebase Security Rules Revolution

#### 🔧 Helper-Funktionen (3-Ebenen-Architektur):
```javascript
// 👑 Globale Rollen
function isSuperAdmin() { return request.auth.token.email == 'admin@rwk-einbeck.de'; }
function isSystemAdmin() { return getUserRole() == 'system_admin'; }
function isDataManager() { return getUserRole() == 'data_manager'; }

// 🎯 KV-Rollen
function isKvWettkampfleiter(kvId) { return getUserKvRole(kvId) == 'kv_wettkampfleiter'; }
function isKvKmOrga(kvId) { return getUserKvRole(kvId) == 'kv_km_orga'; }
function isKvPressewart(kvId) { return getUserKvRole(kvId) == 'kv_pressewart'; }
function isKvKampfrichter(kvId) { return getUserKvRole(kvId) == 'kv_kampfrichter'; }

// 🏢 Vereins-Rollen (Granular)
function isVereinsrolle(clubId, role) {
  let permissions = getUserPermissions();
  return isAuthenticated() && permissions.clubId == clubId && permissions.role == role;
}

function isSportleiter(clubId) { return isVereinsrolle(clubId, 'sportleiter'); }
function isKassenwart(clubId) { return isVereinsrolle(clubId, 'kassenwart'); }
function isSchriftfuehrer(clubId) { return isVereinsrolle(clubId, 'schriftfuehrer'); }
function isVorstand(clubId) { return isVereinsrolle(clubId, 'vorstand'); }
function isJugendwart(clubId) { return isVereinsrolle(clubId, 'jugendwart'); }
function isDamenwart(clubId) { return isVereinsrolle(clubId, 'damenwart'); }
```

#### 📖 Öffentliche Bereiche (Tabellen bleiben öffentlich):
```javascript
// RWK-Tabellen - Komplett öffentlich für Transparenz
match /seasons/{season} { allow read: if true; }
match /clubs/{club} { allow read: if true; }
match /rwk_leagues/{league} { allow read: if true; }
match /shooters/{shooter} { allow read: if true; }
match /rwk_scores/{score} { allow read: if true; }
match /newsItems/{news} { allow read: if true; }
```

#### 🎯 RWK-System (Hybrid-Sicherheit):
```javascript
match /rwk_teams/{team} {
  allow read: if true; // Öffentlich für Tabellen
  allow write: if isSuperAdmin() || 
               isSportleiter(resource.data.clubId) || 
               isKvWettkampfleiter(resource.data.kvId);
}

match /rwk_scores/{score} {
  allow read: if true;
  allow create: if isSportleiter(request.resource.data.clubId) && 
                 isValidRingCount(request.resource.data.totalRinge);
  allow update, delete: if isSuperAdmin() || 
                        isKvWettkampfleiter(resource.data.kvId);
}
```

#### 🏆 KM-System (Granulare Kontrolle):
```javascript
match /km_meldungen/{meldung} {
  allow read: if isSuperAdmin() || 
              isKvWettkampfleiter(resource.data.kvId) || 
              isKvKmOrga(resource.data.kvId) ||
              isSportleiter(resource.data.clubId);
  allow write: if isSuperAdmin() || 
               isKvWettkampfleiter(resource.data.kvId) || 
               isKvKmOrga(resource.data.kvId);
}

match /km_startlisten/{startliste} {
  allow read: if true; // Öffentlich nach Erstellung
  allow write: if isSuperAdmin() || isKvKmOrga(resource.data.kvId);
}
```

#### 🏢 Vereinssoftware (Multi-Tenant + Granular):
```javascript
// Basis-Regel: Vereinsmitglieder können eigene Vereinsdaten lesen
match /clubs/{clubId}/{collection}/{docId} {
  allow read: if isSuperAdmin() || 
              isVorstand(clubId) || 
              isSportleiter(clubId) || 
              isKassenwart(clubId) || 
              isSchriftfuehrer(clubId);
  allow write: if isSuperAdmin() || isVorstand(clubId);
}

// Finanz-Regeln (Nur Kassenwart + Vorstand)
match /clubs/{clubId}/finanzen/{docId} {
  allow read, write: if isSuperAdmin() || 
                     isVorstand(clubId) || 
                     isKassenwart(clubId);
}

// Protokoll-Regeln (Schriftführer + Vorstand)
match /clubs/{clubId}/protokolle/{docId} {
  allow read: if isSuperAdmin() || 
              isVorstand(clubId) || 
              isSchriftfuehrer(clubId) ||
              isKassenwart(clubId); // Kann Protokolle lesen
  allow write: if isSuperAdmin() || 
               isVorstand(clubId) || 
               isSchriftfuehrer(clubId);
}

// Mitglieder-Regeln (Erweiterte Lesezugriffe)
match /clubs/{clubId}/mitglieder/{memberId} {
  allow read: if isSuperAdmin() || 
              isVorstand(clubId) || 
              isKassenwart(clubId) || 
              isSchriftfuehrer(clubId) ||
              isSportleiter(clubId); // Für Mannschaftsplanung
  allow write: if isSuperAdmin() || 
               isVorstand(clubId) || 
               isKassenwart(clubId);
}
```

### 📱 5. Dashboard-Auswahl anpassen

#### 🎯 Bereiche pro Rolle (Erweiterte Matrix):

**👑 Globale Rollen:**
- [ ] **Super-Admin:** Alle Bereiche + System-Tools
- [ ] **System-Admin:** Alle Bereiche + Wartung
- [ ] **Data-Manager:** Alle Bereiche + Import/Export

**🎯 KV-Rollen:**
- [ ] **KV-Wettkampfleiter:** RWK + KM (Vollzugriff)
- [ ] **KV-KM-Orga:** KM (Vollzugriff) + RWK (Lesezugriff)
- [ ] **KV-Pressewart:** News (Schreibzugriff) + RWK/KM (Lesezugriff)
- [ ] **KV-Kampfrichter:** KM-Ergebnisse + Startlisten

**🏢 Vereins-Rollen (Sofort):**
- [ ] **Vereinsvorstand:** Alle 3 Bereiche (RWK + KM + Vereinssoftware)
- [ ] **Sportleiter:** RWK + KM (Vollzugriff)
- [ ] **Kassenwart:** Vereinssoftware (Finanzen + Mitglieder)
- [ ] **Schriftführer:** Vereinssoftware (Protokolle + Mitglieder-Lesezugriff)

**🎓 Erweiterte Rollen (Phase 2):**
- [ ] **Jugendwart:** Vereinssoftware (Jugend-Mitglieder + Ausbildungen)
- [ ] **Damenwart:** Vereinssoftware (Damen-Events + Mitglieder-Filter)
- [ ] **Zeugwart:** Vereinssoftware (Inventar + Waffen-Verwaltung)
- [ ] **Pressewart:** Vereinssoftware (News + Berichte)
- [ ] **Trainer:** Vereinssoftware (Lizenzen + Ausbildungen)
- [ ] **Vereinsschütze:** Vereinssoftware (Eigene Daten + Lesezugriff)

### 🧪 6. Tests durchführen

#### 🎭 Test-Accounts erstellen (Rollen-Matrix):
- [ ] **Super-Admin-Test:** admin@rwk-einbeck.de (Vollzugriff)
- [ ] **Vereinsvertreter-Test:** marcel.buenger@gmx.de (Legacy-Rolle)
- [ ] **KV-Wettkampfleiter-Test:** Vollzugriff RWK/KM
- [ ] **KV-KM-Orga-Test:** KM-Vollzugriff, RWK-Lesezugriff
- [ ] **Vereinsvorstand-Test:** Alle 3 Bereiche für eigenen Verein
- [ ] **Sportleiter-Test:** Nur RWK/KM für eigenen Verein
- [ ] **Kassenwart-Test:** Nur Finanzen/Mitglieder für eigenen Verein
- [ ] **Schriftführer-Test:** Nur Protokolle/Mitglieder-Lesezugriff
- [ ] **Fremder-Verein-Test:** Kein Zugriff auf andere Vereinsdaten

#### 🎯 Test-Szenarien (Erweiterte Matrix):

**Dashboard-Tests:**
- [ ] Jede Rolle sieht nur erlaubte Bereiche
- [ ] Gesperrte Bereiche sind ausgegraut
- [ ] Korrekte Weiterleitungen nach Login

**URL-Sicherheit:**
- [ ] Direkte URLs werden für falsche Rollen blockiert
- [ ] Cross-Verein-Zugriffe werden verhindert
- [ ] API-Endpunkte respektieren Rollen

**Firebase-Rules:**
- [ ] Öffentliche Tabellen bleiben lesbar
- [ ] Multi-Tenant-Trennung funktioniert
- [ ] Granulare Berechtigungen greifen
- [ ] Keine Privilege-Escalation möglich

**Performance-Tests:**
- [ ] Keine Endlosschleifen bei Rollen-Checks
- [ ] Schnelle Berechtigungs-Validierung
- [ ] Effiziente Firestore-Abfragen

**Cross-Verein-Tests:**
- [ ] Sportleiter A kann nicht Verein B bearbeiten
- [ ] Kassenwart A sieht keine Finanzen von Verein B
- [ ] Schriftführer A kann keine Protokolle von Verein B lesen

**API-Endpunkt-Tests:**
- [ ] `/api/clubs/[clubId]/mitglieder` - Rollen-Validierung
- [ ] `/api/clubs/[clubId]/beitraege` - Kassenwart-Only
- [ ] `/api/clubs/[clubId]/protokolle` - Schriftführer-Access
- [ ] `/api/rwk/teams` - Sportleiter-Berechtigung
- [ ] `/api/km/meldungen` - KM-Orga-Zugriff

### 📧 7. Kommunikation

#### Benutzer informieren:
- [ ] **E-Mail an alle Benutzer:** Neue Rollen erklären
- [ ] **FAQ aktualisieren:** Rollen-System dokumentieren
- [ ] **Support bereitstellen:** Für Rückfragen

### 🔄 8. Rollback-Plan (5-Minuten-Notfall)

#### 🚨 Sofort-Maßnahmen bei kritischen Problemen:
- [ ] **LoginBlocker deaktivieren** (1 Min): Kommentar in `/src/app/login/page.tsx`
- [ ] **Firebase-Regeln zurücksetzen** (2 Min): Backup-Rules aus Git deployen
- [ ] **URL-Sicherung entfernen** (1 Min): Berechtigungs-Checks auskommentieren
- [ ] **Dashboard-Sperre aufheben** (1 Min): Alle Bereiche wieder freigeben

#### 📋 Rollback-Scripts (Vorbereitet):
```bash
# Notfall-Rollback (5 Minuten)
git checkout HEAD~1 -- firestore.rules
firebase deploy --only firestore:rules

# URL-Sicherung deaktivieren
find src/app -name "*.tsx" -exec sed -i 's/if (!hasAccess/\/\/ if (!hasAccess/g' {} \;

# LoginBlocker ausschalten
sed -i 's/<LoginBlocker/{\/\* <LoginBlocker/g; s/\/>/\*\/}/g' src/app/login/page.tsx
```

#### 🎯 Rollback-Prioritäten:
1. **Kritisch (0-5 Min):** Login-Zugang wiederherstellen
2. **Hoch (5-15 Min):** Vereinsvertreter-Zugang zu Vereinssoftware
3. **Mittel (15-30 Min):** RWK/KM-Funktionen normalisieren
4. **Niedrig (30+ Min):** Optimierungen und Feintuning

#### 📞 Eskalations-Plan:
- **0-5 Min:** Automatische Rollback-Scripts
- **5-15 Min:** Marcel direkt kontaktieren
- **15+ Min:** Wartungsmodus aktivieren, vollständiger Rollback

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

**Geschätzte Dauer:** 3-6 Stunden (erweiterte Rollen-Matrix)

**Phasen-Plan:**
- **Phase 1 (1h):** Login-Sperre + Basis-Rollen (Sportleiter, Kassenwart, Schriftführer, Vorstand)
- **Phase 2 (2h):** Firebase-Rules + URL-Sicherung + Tests
- **Phase 3 (1h):** Dashboard-Anpassung + Cross-Verein-Tests
- **Phase 4 (1h):** Performance-Tests + Dokumentation
- **Puffer (1h):** Unvorhergesehene Probleme + Rollback-Tests

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
- **System:** Bereit für Rollen-Revolution am 15.09.

### 🚀 Langfristige Vision (Post-Wartung):
- **Multi-Verband-Fähigkeit:** Andere Kreisverbände können eigene Instanzen nutzen
- **Vereins-Autonomie:** Jeder Verein hat komplett getrennte Daten
- **API-Schnittstellen:** Externe Tools können sicher andocken
- **Skalierungs-Bereitschaft:** Von 15 auf 150+ Vereine erweiterbar
- **Compliance-Ready:** DSGVO-konforme Multi-Tenant-Architektur

---

**Erstellt am:** 11.09.2025  
**Wartungstermin:** 15.09.2025  
**Status:** Vorbereitet ✅