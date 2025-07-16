# RWK Einbeck - App Update Guide

## 🔄 Update-Strategien

### 📊 **Automatische Updates (90% der Fälle)**
Diese Änderungen werden **sofort** in der App sichtbar, **ohne neue APK**:

#### ✅ Automatisch aktualisiert:
- Neue Dokumente/Ausschreibungen
- Ergebnisse und Tabellen
- Texte und Inhalte
- Termine und News
- Benutzer-Daten
- Statistiken

#### 🔧 Technischer Grund:
App lädt Inhalte von `https://rwk-einbeck.vercel.app` - bei Web-App-Updates ist alles sofort verfügbar.

---

### 📱 **Neue APK erforderlich (10% der Fälle)**

#### ⚠️ Neue APK nötig bei:
- **Design-Änderungen** (Layout, Farben, Navigation)
- **Neue Features** (Push-Notifications, Kamera, etc.)
- **App-Icon Änderungen**
- **Capacitor-Updates**
- **Performance-Optimierungen**

---

## 🛠️ **APK-Update Prozess**

### 1. Änderungen identifizieren
```bash
# Prüfen ob neue APK nötig ist
git log --oneline | head -10
```

**Neue APK nötig wenn:**
- `src/app/layout.tsx` geändert
- `capacitor.config.ts` geändert
- `next.config.js` geändert
- Neue Dependencies in `package.json`

### 2. Neue APK erstellen
```bash
# 1. Web-App für Capacitor bauen
npm run build:capacitor

# 2. Capacitor synchronisieren
npx cap sync

# 3. APK erstellen
cd android
.\gradlew.bat assembleDebug
```

### 3. APK-Datei finden
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 4. Versionsnummer erhöhen
**In `android/app/build.gradle`:**
```gradle
android {
    defaultConfig {
        versionCode 2        // +1 erhöhen
        versionName "0.9.9.4" // Version anpassen
    }
}
```

---

## 📋 **Update-Checkliste**

### Vor jedem Git Push fragen:
- [ ] Wurden Layout-Dateien geändert?
- [ ] Neue Features hinzugefügt?
- [ ] Capacitor-Config geändert?
- [ ] Dependencies aktualisiert?

### Falls JA → Neue APK erstellen:
- [ ] `npm run build:capacitor`
- [ ] `npx cap sync`
- [ ] `.\gradlew.bat assembleDebug`
- [ ] APK in Dokumente hochladen
- [ ] Vereinsvertreter benachrichtigen

### Falls NEIN → Nur Git Push:
- [ ] Änderungen sind automatisch verfügbar
- [ ] Keine weitere Aktion nötig

---

## 🚨 **Wann Marcel benachrichtigen**

### Sofort benachrichtigen bei:
1. **Capacitor-Updates** (`npm update @capacitor/core`)
2. **Next.js Major-Updates** (14.x → 15.x)
3. **Android-Gradle-Updates**
4. **Neue native Features** gewünscht
5. **Performance-Problemen** in der App

### Automatische Benachrichtigung:
```bash
# In package.json - Script hinzufügen
"check-app-updates": "echo 'Prüfe ob neue APK nötig...' && git diff --name-only HEAD~1 | grep -E '(layout|capacitor|next.config)' && echo 'NEUE APK NÖTIG!' || echo 'Nur Web-Update'"
```

---

## 📱 **Verteilung neuer APKs**

### 1. APK in Dokumente-Bereich hochladen
- Kategorie: "App-Updates"
- Titel: "RWK Einbeck App v0.9.9.4"
- Beschreibung: "Neue Features: ..."

### 2. Rundschreiben versenden
**Vorlage:**
```
Betreff: RWK Einbeck App - Update verfügbar

Liebe Vereinsvertreter,

eine neue Version der RWK Einbeck App ist verfügbar:

📱 Version: 0.9.9.4
🆕 Neue Features:
- [Liste der Änderungen]

📥 Download: [Link zur APK]

Installation:
1. Alte App deinstallieren
2. Neue APK herunterladen
3. "Unbekannte Quellen" aktivieren
4. APK installieren

Bei Fragen: rwk-leiter-ksv@gmx.de

Viele Grüße
RWK-Leitung
```

---

## 🔧 **Troubleshooting**

### Build-Fehler:
```bash
# Cache leeren
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

### Sync-Probleme:
```bash
# Capacitor neu synchronisieren
npx cap sync --force
```

### Android Studio Probleme:
```bash
# Projekt neu öffnen
npx cap open android
```

---

## 📊 **Update-Häufigkeit**

### Erfahrungswerte:
- **Web-Updates**: Täglich bis wöchentlich (automatisch)
- **APK-Updates**: Monatlich bis quartalsweise
- **Major-Updates**: 1-2x pro Jahr

### Saison-Updates:
- **Vor Saison**: Neue Features, Design-Updates
- **Während Saison**: Nur kritische Bugfixes
- **Nach Saison**: Große Überarbeitungen

---

## 🎯 **Für Nachfolger**

### Wichtige Dateien:
- `capacitor.config.ts` - App-Konfiguration
- `android/app/build.gradle` - Versionsnummern
- `next.config.js` - Build-Konfiguration
- Dieses Dokument - Update-Prozess

### Bei Übergabe prüfen:
- [ ] Android Studio installiert
- [ ] Java JDK verfügbar
- [ ] Gradle funktioniert
- [ ] APK-Build erfolgreich
- [ ] Dokumentation verstanden

**Kontakt bei Problemen:** Marcel Bünger (rwk-leiter-ksv@gmx.de)