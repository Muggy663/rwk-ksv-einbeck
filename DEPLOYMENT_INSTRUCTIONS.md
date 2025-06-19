# Deployment-Anleitung für Firebase Functions

Um die Firebase Functions für die RWK App Einbeck zu deployen, folgen Sie diesen Schritten:

## Voraussetzungen

1. Node.js und npm müssen installiert sein
2. Firebase CLI muss installiert sein (`npm install -g firebase-tools`)
3. Sie müssen bei Firebase angemeldet sein (`firebase login`)

## Deployment-Schritte

1. Navigieren Sie zum Funktionsverzeichnis:
   ```bash
   cd functions
   ```

2. Installieren Sie die Abhängigkeiten:
   ```bash
   npm install
   ```

3. Bauen Sie die Funktionen:
   ```bash
   npm run build
   ```

4. Kehren Sie zum Hauptverzeichnis zurück:
   ```bash
   cd ..
   ```

5. Deployen Sie die Funktionen:
   ```bash
   firebase deploy --only functions
   ```

## Wichtige Hinweise

- Die Cloud Function `createUserWithRole` erfordert Admin-Berechtigungen
- Nur der Benutzer mit der E-Mail `admin@rwk-einbeck.de` kann diese Funktion aufrufen
- Die Funktion erstellt einen neuen Benutzer in Firebase Authentication und speichert die Berechtigungen in Firestore

## Fehlerbehebung

Falls beim Deployment Fehler auftreten:

1. Überprüfen Sie die Firebase-Logs:
   ```bash
   firebase functions:log
   ```

2. Stellen Sie sicher, dass Sie die richtige Firebase-Projekt-ID verwenden:
   ```bash
   firebase use --add
   ```

3. Überprüfen Sie die Berechtigungen in der Firebase Console