# Vorbereitung für den Google Play Store

## 1. Signierung der App

### Keystore erstellen
```bash
keytool -genkey -v -keystore rwk-einbeck-key.keystore -alias rwk-einbeck -keyalg RSA -keysize 2048 -validity 10000
```

### Keystore-Informationen in build.gradle eintragen
Fügen Sie folgende Zeilen in `android/app/build.gradle` ein:

```gradle
android {
    // ... andere Konfigurationen
    
    signingConfigs {
        release {
            storeFile file("rwk-einbeck-key.keystore")
            storePassword "IHR_KEYSTORE_PASSWORT"
            keyAlias "rwk-einbeck"
            keyPassword "IHR_KEY_PASSWORT"
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            // ... andere Konfigurationen
        }
    }
}
```

## 2. App-Bundle erstellen

```bash
cd android
./gradlew bundleRelease
```

Das App-Bundle wird unter `android/app/build/outputs/bundle/release/app-release.aab` erstellt.

## 3. Google Play Console einrichten

1. Registrieren Sie sich als Entwickler (einmalige Gebühr von 25 USD)
2. Erstellen Sie eine neue App in der Play Console
3. Füllen Sie alle erforderlichen Informationen aus:
   - App-Name: RWK Einbeck
   - Kurzbeschreibung
   - Vollständige Beschreibung
   - Screenshots (mind. 2 für Smartphones)
   - Feature-Grafik (1024 x 500 px)
   - App-Symbol (512 x 512 px)
   - Datenschutzerklärung (URL)
   - Kontaktinformationen

## 4. Datenschutz und Sicherheit

### Datenschutzerklärung
Erstellen Sie eine Datenschutzerklärung, die folgende Punkte abdeckt:
- Welche Daten werden gesammelt
- Wie werden die Daten verwendet
- Werden Daten an Dritte weitergegeben
- Wie können Nutzer ihre Daten einsehen/löschen

### Google Play Data Safety
Füllen Sie das Data Safety-Formular in der Play Console aus:
- Welche Daten sammelt die App
- Werden sensible Daten gesammelt
- Wie werden die Daten verwendet
- Werden Daten verschlüsselt

## 5. App-Berechtigungen minimieren

Überprüfen Sie die Berechtigungen in `AndroidManifest.xml` und entfernen Sie alle nicht benötigten Berechtigungen.

## 6. App-Veröffentlichung

1. Laden Sie das App-Bundle (.aab) in der Play Console hoch
2. Wählen Sie die Länder für die Veröffentlichung
3. Legen Sie den Preis fest (kostenlos)
4. Wählen Sie die Altersfreigabe
5. Starten Sie mit einem geschlossenen Test oder offenen Test
6. Nach erfolgreichen Tests: Veröffentlichung im Play Store

## 7. App-Updates

Für zukünftige Updates:
1. Erhöhen Sie die `versionCode` und `versionName` in `android/app/build.gradle`
2. Erstellen Sie ein neues App-Bundle
3. Laden Sie es in der Play Console hoch

## 8. Wichtige Sicherheitsaspekte

- Verwahren Sie den Keystore sicher - er ist für zukünftige Updates erforderlich
- Aktivieren Sie App-Signierung durch Google Play
- Implementieren Sie SSL-Pinning für API-Anfragen
- Überprüfen Sie regelmäßig Sicherheitsupdates für alle Abhängigkeiten