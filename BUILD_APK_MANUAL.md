# APK Build ohne Android Studio

## 🛠️ Gradle Build (Kommandozeile)

### 1. Java JDK installieren
- Download: https://adoptium.net/
- Version: JDK 17 oder höher

### 2. APK erstellen
```bash
cd android
./gradlew assembleDebug
```

### 3. APK-Datei finden
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 📱 Installation auf Android
1. APK auf Handy kopieren
2. "Unbekannte Quellen" aktivieren
3. APK antippen → Installieren

## 🚀 Für Produktion
```bash
./gradlew assembleRelease
```
(Benötigt Signing-Key)