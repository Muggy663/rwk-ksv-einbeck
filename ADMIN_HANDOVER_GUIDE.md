# Handbuch für die Administration und Übergabe der RWK Einbeck App

**Version:** 1.0
**Datum:** 2024-05-21

## 1. Zweck dieses Dokuments

Dieses Dokument dient als zentrale Anleitung für die technische und administrative Verwaltung der RWK Einbeck App. Es soll sicherstellen, dass der Betrieb der Anwendung auch bei einem Wechsel des Administrators reibungslos weiterlaufen kann. Es beschreibt die notwendigen Zugänge, die Kerntechnologien und die wichtigsten administrativen Aufgaben.

---

## 2. Notwendige Zugänge & Konten

Für die vollständige Verwaltung der App sind folgende Zugänge erforderlich. Stelle sicher, dass diese bei einer Übergabe an einen Nachfolger übertragen werden.

- **Vercel-Konto:**
  - **Zweck:** Hosting der Web-Anwendung (Frontend). Hier wird die App gebaut und der Welt zur Verfügung gestellt.
  - **URL:** [https://vercel.com](https://vercel.com)

- **Firebase-Konto (Google):**
  - **Zweck:** Backend der Anwendung. Beinhaltet Benutzer-Authentifizierung, Datenbank und Dateispeicher.
  - **URL:** [https://console.firebase.google.com/](https://console.firebase.google.com/)
  - **Projekte-ID:** `[DEINE_FIREBASE_PROJEKT_ID]`

- **Git-Repository (z.B. GitHub, GitLab):**
  - **Zweck:** Speicherung des Quellcodes. Vercel ist mit diesem Repository verbunden und deployed automatisch bei Änderungen.
  - **URL:** `[URL_DEINES_GIT_REPOSITORIES]`

- **Domain-Registrar (z.B. Strato, IONOS):**
  - **Zweck:** Verwaltung der Domain `rwk-einbeck-app.vercel.app` oder einer benutzerdefinierten Domain.
  - **URL:** `[URL_DES_REGISTRARS]`

- **E-Mail-Konto (z.B. GMX):**
  - **Zweck:** Verwaltung der offiziellen Kontakt-E-Mail (`rwk-leiter-ksve@gmx.de`), die auch für die Erstellung der oben genannten Konten verwendet wurde.

---

## 3. Kerntechnologien (Einfache Erklärung)

- **Next.js (React):** Das ist das "Skelett" und die "Haut" der Webseite, die die Benutzer sehen.
- **Firebase:** Das ist das "Gehirn" und das "Gedächtnis" der App.
  - **Firestore:** Die Datenbank, in der alle Ergebnisse, Mannschaften, Schützen, etc. gespeichert sind.
  - **Authentication:** Die Benutzerverwaltung, die Logins und die verschiedenen Rollen (Admin, Vereinsvertreter) regelt.
  - **Storage:** Der Speicherort für hochgeladene Dateien wie Dokumente oder Urkunden-Vorlagen.
- **Vercel:** Der "Motor", der den Code aus dem Git-Repository nimmt und dafür sorgt, dass die Webseite online und schnell erreichbar ist.

---

## 4. Administrative Standardaufgaben

Diese Aufgaben werden regelmäßig vom RWK-Leiter / Administrator im Admin-Bereich der App ausgeführt.

### 4.1. Benutzerverwaltung
- **Neue Benutzer anlegen:** Erfolgt im Admin-Bereich unter "Benutzer". E-Mail und Rolle müssen zugewiesen werden.
- **Rollen ändern:** Einem bestehenden Benutzer eine andere Rolle (z.B. Mannschaftsführer zu Vereinsvertreter) zuweisen.
- **Benutzer deaktivieren/löschen:** Wenn jemand den Verein verlässt oder keine Berechtigung mehr benötigt.

### 4.2. Saison-Management

Die App ist für die Verwaltung von Saisons ausgelegt.

- **Neue Saison starten:** Vor Beginn der neuen Wettkampfperiode muss eine neue Saison angelegt werden. Dies geschieht im Admin-Bereich.
- **Saisonwechsel durchführen:** Am Ende einer Saison gibt es die Funktion "Saisonwechsel". Diese sollte:
  1. Die aktuellen Ranglisten finalisieren.
  2. Basierend auf §16 der RWK-Ordnung die Auf- und Absteiger für die Ligen vorschlagen/durchführen.
  3. Die Mannschaften in die neuen Ligen für die kommende Saison verschieben.
  4. Die alte Saison archivieren, sodass die Daten weiterhin einsehbar bleiben.
- **Disziplinen und Ligen verwalten:** Sicherstellen, dass alle benötigten Disziplinen und Ligastrukturen für die neue Saison korrekt eingerichtet sind.

### 4.3. Datenpflege & Sonderfälle
- **Ersatzschützen verwalten:** Wenn ein Schütze ausfällt, muss dies im Admin-Bereich über die entsprechende Funktion (siehe §12 RWK-Ordnung) nachgepflegt werden. Dies beinhaltet das Austauschen des Schützen und ggf. das Transferieren von Ergebnissen.
- **AK-Wertung ("Außer Konkurrenz"):** Mannschaften oder einzelne Schützen können bei der Erstellung oder Bearbeitung als "AK" markiert werden, damit sie korrekt in den Ranglisten erscheinen (oder eben nicht in die Wertung einfließen).

---

## 5. Notfallplan ("Was tun, wenn...")

- **...die App nicht erreichbar ist?**
  1. **Vercel Status prüfen:** https://www.vercel-status.com/
  2. **Firebase Status prüfen:** https://status.firebase.google.com/
  3. **Vercel Deployment Logs prüfen:** Im Vercel-Konto nach dem letzten Deployment suchen und die Logs auf Fehler überprüfen. Oft ist ein fehlerhafter Code-Push die Ursache. Man kann jederzeit zu einem früheren, funktionierenden Deployment zurückkehren.

- **...Daten inkonsistent sind?**
  1. Über den Admin-Bereich oder direkt in der Firebase Firestore Konsole die entsprechenden Daten (z.B. ein falsches Ergebnis) suchen und korrigieren. **Vorsicht:** Direkte Änderungen in der Datenbank sollten nur mit Bedacht vorgenommen werden.

---

## 6. Übergabe-Checkliste

- [ ] Alle unter Punkt 2 genannten Zugangsdaten wurden übergeben.
- [ ] Der neue Administrator wurde in die Bedienung des Admin-Bereichs eingewiesen.
- [ ] Die `VERCEL_DEPLOYMENT.md` wurde erklärt, falls Code-Änderungen anstehen.
- [ ] Dieses Dokument wurde übergeben und besprochen.