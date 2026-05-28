# 📋 Changelog – RWK Einbeck App

Alle Versionen und Änderungen in chronologischer Reihenfolge.

---

## Version 2.5.3 (aktuell)
- **🐛 Bugfix**: Geschlecht (gender) von Schützen wird beim Ergebnis-Eintragen nicht mehr überschrieben
- **🔒 Datenschutz**: Schützen-Dokumente werden beim Speichern von Ergebnissen nur noch angelegt wenn sie noch nicht existieren – bestehende Daten bleiben unberührt
- **🔧 Refactoring**: `forEach` → `for...of` in `shared-results-complete.tsx` für korrekte async/await-Unterstützung
- **📁 Betroffene Dateien**: `shared-results-complete.tsx`, `verein/ergebnisse/page.tsx`, `rwk-tabellen/page.tsx`

## Version 2.5.2
- **🔒 Sicherheit**: Alle ungeschützten API-Routen mit Auth-Checks versehen (bulk-delete, license-management, substitutions, shooters, set-download-count, send-verification-email, excel-import, assign-roles)
- **🗑️ API**: `/api/repair-substitution` deaktiviert (war einmaliger DB-Fix mit hardcodierten IDs)
- **🛡️ XSS-Fix**: Benutzereingaben in Support-E-Mails werden jetzt sanitisiert
- **⚙️ Middleware**: `securityMiddleware` wird jetzt tatsächlich aufgerufen – Security Headers aktiv
- **🔧 TypeScript**: Alle 120 TS18046-Fehler behoben – `catch (error)` Blöcke überall mit `getErrorMessage()` gesichert
- **🔧 TypeScript**: Ungetypte `reduce({})` Aufrufe in Startlisten, PDF-Export und KM-Seiten mit expliziten Typen versehen
- **🔧 TypeScript**: React-Children-Traversal in `smart-table.tsx` und `ResponsiveTable.tsx` korrekt getyped
- **🎓 Ausbildung**: Grundgerüst für Ausbildungsmodul angelegt (`/ausbildung`) – noch nicht öffentlich verlinkt

## Version 2.5.1.2
- **📧 E-Mail-Verifizierung (Login)**: "Bestätigungs-E-Mail erneut senden"-Button auf der Login-Seite – erscheint automatisch wenn ein Konto noch nicht verifiziert ist
- **🛠️ E-Mail-Verifizierung (Admin)**: Neuer Button direkt im Support-Ticket-Dialog – Verifizierungslink per Firebase Admin SDK generieren und per E-Mail versenden ohne Umweg über die Benutzerverwaltung
- **⚙️ API**: Neue Route `/api/admin/resend-verification` für serverseitiges Generieren von Verifizierungslinks

## Version 2.5.1.1
- **🐛 Duplikat-Ergebnisse**: Doppelte Einträge beim manuellen Hinzufügen werden jetzt blockiert (Prüfung gegen DB, Zwischenliste und gerade gespeicherte Ergebnisse)
- **📧 E-Mail Signatur**: Doppelte Signatur in Benachrichtigungs-E-Mails behoben
- **🔍 Firestore Index**: `orderBy` aus dynamischen Collection-Queries entfernt, clientseitige Sortierung stattdessen (kein manueller Index-Aufwand pro Saison mehr)

## Version 2.5.1
- **🔒 Mannschaften**: Kontaktdaten Mannschaftsführer auch bei laufender Saison bearbeitbar
- **📝 Selektive Sperre**: Alle anderen Felder (Name, Disziplin, Schützen) bleiben bei laufender Saison gesperrt
- **ℹ️ Hinweis im Dialog**: Klarer Hinweis wenn nur Kontaktdaten geändert werden können

## Version 2.5.0
- **🔒 reCAPTCHA**: Umstellung auf v2 Invisible - keine Bildaufgaben mehr beim Login
- **⚡ Login**: Dynamische Sicherheitshinweise mit rotierenden wahrheitsgemäßen Texten
- **📊 Login-Monitoring**: Admin-Widget mit Erfolgs-/Fehlversuche-Statistiken und Fehlergründen
- **🚨 Verdächtige Accounts**: Automatische Erkennung bei ≥3 Fehlversuchen
- **📋 Ereignislog**: Letzte Login-Versuche mit E-Mail (maskiert), Grund und Uhrzeit
- **🏆 RWK-Tabellen**: KKP/KKG Scores werden jetzt korrekt aus allen Collections geladen (Mannschafts-Gesamt 0 Bug behoben)
- **📄 Handzettel**: Abgabetermin dynamisch aus Saison-Name (KK = 15. August, LG = 1. März)
- **📊 Gesamtergebnisliste**: Abgabetermin ebenfalls dynamisch eingefügt
- **👤 Schützen-Namen**: In PDFs jetzt korrekt Vor- + Nachname statt nur Nachname
- **🏢 Handzettel**: Vereinsname des Gastgebers unter 1. Durchgang
- **🔧 TypeScript**: Fehler von ~700 auf 24 reduziert (Code-Qualität)
- **🔒 Firebase Admin**: undefined-Bug in getFirestore() behoben
- **⚡ Services**: Fehlende Imports und Duplicate-Identifier-Fehler behoben

## Version 2.4.8
- **📄 Handzettel**: Abgabetermin dynamisch aus Saison-Name (KK = 15. August, LG = 1. März)
- **📊 Gesamtergebnisliste**: Abgabetermin ebenfalls dynamisch eingefügt
- **👤 Schützen-Namen**: In PDFs jetzt korrekt Vor- + Nachname statt nur Nachname
- **🏢 Handzettel**: Vereinsname des Gastgebers unter 1. Durchgang
- **🔧 TypeScript**: Fehler von ~700 auf 24 reduziert (Code-Qualität)
- **🔒 Firebase Admin**: undefined-Bug in getFirestore() behoben
- **⚡ Services**: Fehlende Imports und Duplicate-Identifier-Fehler behoben

## Version 2.4.7
- *In Entwicklung*

## Version 2.4.6
- *In Entwicklung*

## Version 2.4.5
- **🏢 Admin Teams**: Automatische Namensgenerierung aus Vereinsname + Mannschaftsstärke (römische Zahl)
- **🔧 Admin Teams**: Leerzeichen im Vereinsnamen werden beim Generieren normalisiert
- **➕ Admin Teams**: Mannschaftsstärke "Einzel" als neue Option hinzugefügt
- **⚡ Admin Teams**: Schützen-Liste lädt nicht mehr neu beim Tippen in anderen Feldern
- **📊 Admin Teams**: Altersübersicht zwischen Filter und Tabelle (0–20 / 21–40 / Ab 41 / Unbekannt)
- **👥 Admin Teams**: Anzeige von eindeutigen Schützen UND Gesamtmeldungen (Schützen in mehreren Disziplinen)
- **🏅 Urkunden**: Layout verfeinert und Fehler behoben
- **🎨 Glassmorphism**: CSS-Optimierungen und Micro-Animationen verfeinert

## Version 2.4.4 (21. März 2026)
- **⚡ Startseite**: Skeleton Loading für alle Karten (Updates, Termine, News)
- **📊 Startseite**: Gefühlte Ladezeit deutlich verbessert
- **🔧 Mannschaften**: Speichern-Button Mobile-Fix (requestSubmit statt form-Attribut)
- **🔧 Admin Teams**: 3-Query-Methode für Schützen-Laden
- **➕ Admin Teams**: Neue Mannschaft anlegen möglich
- **🔧 Admin Teams**: getShooterClubId Funktion ergänzt

## Version 2.4.3 (15. März 2026)
- **👥 Mannschaften**: Schützen-Suche nach Vor- und Nachname
- **🔍 Mannschaften**: Anzahl gefundener Schützen im Dialog angezeigt
- **🔧 Mannschaften**: Schützen-Ladelogik auf 3-Query-Methode umgestellt (clubId, rwkClubId, kmClubId)
- **🗓️ Termine**: Bearbeiten-Funktion repariert (Next.js 16 params-Fix)
- **🧹 Termine**: Auto-Cleanup abgelaufener Termine nach 30 Tagen
- **🏠 Startseite**: Hover-Effekt auf Termine-Karte entfernt
- **📱 Portal**: Umbenennung von App zu Portal im Manifest
- **🔒 Sicherheit**: Vercel AI-Training opt-out aktiviert

## Version 2.4.2 (5. März 2026)
- **🔐 Registrierung**: Optionales Name-Feld bei der Registrierung hinzugefügt
- **🏆 Urkunden**: Saison-Auswahl zeigt jetzt alle Saisons (nicht nur laufende)
- **👥 Dashboard**: KM-Karte für KV_KM_ORGA Benutzer wieder sichtbar
- **🐛 Tabellen-Flackern**: Hover-Effekt in User-Management Tabelle behoben
- **📋 Mannschaften**: Status-Anzeige und Legende bei Saison-Auswahl
- **🔒 Mannschaften**: Bearbeitung bei laufender Saison gesperrt (nur RWK-Leiter)

## Version 2.4.1 (17. Februar 2026)
- **✨ UX-Verbesserungen**: Neue UI-Komponenten für bessere Benutzerfreundlichkeit
- **🔘 LoadingButton**: Konsistente Loading-States mit Spinner in allen Buttons
- **⚠️ ConfirmDialog**: Bestätigungs-Dialoge für kritische Aktionen (Löschen)
- **📭 EmptyState**: Schöne leere Zustände statt leerer Tabellen
- **🍞 Breadcrumbs**: Navigation-Pfad für bessere Orientierung
- **📝 FormField**: Inline-Validierung mit sofortigem Fehler-Feedback
- **⏱️ useDebounce**: Optimierte Suche ohne unnötige API-Calls
- **🎯 Liga-weite Durchgangszählung**: Wertung nur bei vollständigen Durchgängen
- **📱 Mobile Optimierung**: Ligalisten-Seite für Smartphones angepasst

## Version 2.4 (16. Februar 2026)
- **🔐 Passwort-Reset**: "Passwort vergessen" Funktion auf Login-Seite hinzugefügt
- **👤 Profil-Verwaltung**: Neue Profil-Seite für Schießnachweis-Benutzer
- **📝 Erweiterte Felder**: Vorname, Nachname, Verein, Kreisverband, Straße, PLZ, Wohnort
- **🔒 Firestore Rules**: Profil-Updates für user_permissions erlaubt
- **🚫 Zugriffskontrolle**: Schießnachweis-Benutzer sehen nur Schießnachweis/Social Training
- **✅ Sicherheit**: INDIVIDUAL userType hat keinen Zugriff auf RWK/KM-Bereiche
- **🔄 Letztes Training wiederholen**: Button zum schnellen Wiederholen des letzten Trainings
- **🎯 Unified Login**: Einheitlicher Login für alle Benutzertypen mit automatischem Routing

## Version 2.4.0 (15. Februar 2026)
- **🎨 Glassmorphism Design**: Modernes, glasiges UI mit Blur-Effekten und sanften Animationen
- **🌈 Neue Farbpalette**: Sanftere Grüntöne im Light Mode, tiefere Farben im Dark Mode
- **✨ Animierte Hintergründe**: Gradient-Shifts und dynamische Farbverläufe
- **💎 Glass-Komponenten**: Cards, Buttons, Inputs mit durchscheinenden Effekten
- **🎭 Verbesserte Schatten**: Tiefere, weichere Schatten für bessere Tiefenwirkung
- **🔄 Smooth Transitions**: Flüssige Animationen und Hover-Effekte überall
- **🌙 Dark Mode Optimierung**: Automatische Anpassung aller Glaseffekte
- **🚀 Next.js 16 Migration**: Upgrade auf Next.js 16.1.6 mit React 19 Kompatibilität
- **⚡ Performance-Optimierung**: Batch Reads für Firebase - 68% weniger Datenbankzugriffe
- **🔧 Code-Refactoring**: Zentrale getShooterClubId() Funktion für konsistente clubId-Verwaltung
- **✅ Inkonsistenzen behoben**: 21 Dateien aktualisiert - einheitliche Shooter-clubId-Logik
- **📦 Wartbarkeit**: Reduzierung von Code-Duplikation durch zentrale Utility-Funktion
- **🎯 Stabilität**: Konsistente Verarbeitung von clubId/rwkClubId/kmClubId in allen Modulen
- **🔒 Sicherheit**: Alle console.log durch secure-logger ersetzt (DSGVO-konform)
- **📊 Firebase Optimierung**: Batch-Read Utility für 90-97% weniger Reads bei RWK-Tabellen

## Version 2.3.12 (09. Februar 2026)
- **📸 KM-Ergebnisse Batch-Import**: Alle Ergebnisse auf einmal per PDF/Foto hochladen
- **🤖 Gemini AI Integration**: Automatische Erkennung von Namen, Ringen und Serien
- **🎯 Namen-Matching**: Intelligente Zuordnung unabhängig von Namensformat (Vorname Nachname / Nachname, Vorname)
- **📊 Serien-Import**: Automatische Berechnung und Speicherung aller Serien (102.3, 104.7, etc.)
- **⚡ Batch-Verarbeitung**: 64 PDFs in einem Request - nur 1 API-Call statt 64
- **🗑️ Ergebnisse löschen**: Löschen-Button speichert jetzt korrekt in Datenbank
- **🌙 Dark-Mode**: Optimierte Darstellung für KM-Ergebnisse Seite

## Version 2.3.11 (30. Januar 2026)
- **📄 KM-Meldungen PDF-Export**: Neuer Button zum Exportieren der Meldungen als PDF-Datei
- **🔢 Nummerierte Meldungen**: PDF enthält fortlaufende Nummerierung (1-n) für bessere Übersicht
- **🎯 Perfekt für KKP**: Ideal für Disziplinen ohne Startlisten - einfach Meldungen als PDF exportieren
- **📊 Gefilterte Exporte**: PDF berücksichtigt aktuelle Filter (Verein, Disziplin, Suche)
- **📱 Responsive Design**: Button funktioniert auf Desktop und Mobile optimal

## Version 2.3.10 (24. Januar 2026)
- **🔧 Ersatzschützen-Verbesserung**: Ersetzte Schützen werden automatisch aus Einzelranglisten ausgeblendet
- **📊 Sortierung korrigiert**: Ersatzschützen nach Gesamtpunktzahl, normale Schützen nach Durchschnitt
- **🏷️ Substitution-Badges**: Verbesserte Anzeige von Ersatzschützen in Mannschaftstabellen
- **🎯 Automatische Erkennung**: System erkennt ersetzte Schützen über team_substitutions Datenbank
- **📱 Konsistente Darstellung**: Einheitliche Behandlung in Desktop-, Mobile- und PDF-Ansichten

## Version 2.3.9
- Vorherige Verbesserungen und Bugfixes

---

*Entwickelt mit ❤️ für den deutschen Schießsport – KSV Einbeck*
