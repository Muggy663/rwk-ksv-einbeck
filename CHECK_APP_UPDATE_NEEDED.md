# 🔍 Schnell-Check: Neue APK nötig?

## ❓ **Frage dich bei jeder Änderung:**

### 🟢 **NUR Web-Update (automatisch)**
- Neue Dokumente hochgeladen
- Ergebnisse eingetragen
- Texte geändert
- Termine hinzugefügt
- Benutzer-Daten aktualisiert
- Statistiken geändert

**→ Einfach Git Push - fertig! ✅**

---

### 🟡 **NEUE APK NÖTIG**
- Layout-Dateien geändert (`src/app/layout.tsx`)
- Design/CSS angepasst
- Navigation geändert
- Neue Seiten hinzugefügt
- `capacitor.config.ts` geändert
- `next.config.js` geändert
- Neue Dependencies installiert
- App-Icon geändert

**→ Marcel benachrichtigen! 📱**

---

## 🚨 **Sofort-Benachrichtigung an Marcel**

### Bei diesen Änderungen IMMER melden:
- Capacitor-Updates
- Next.js Major-Updates
- Android-Probleme
- Performance-Issues in der App
- Neue native Features gewünscht

### Nachricht-Vorlage:
```
Hey Marcel,

ich habe folgende Änderungen gemacht:
- [Liste der Änderungen]

Brauchen wir eine neue APK?

Grüße
[Name]
```

---

## 📋 **Für Marcel's Nachfolger**

Wenn Marcel nicht mehr da ist, diese Schritte für neue APK:

1. `npm run build:capacitor`
2. `npx cap sync`
3. `cd android && .\gradlew.bat assembleDebug`
4. APK in Dokumente hochladen
5. Rundschreiben versenden

**Vollständige Anleitung:** `APP_UPDATE_GUIDE.md`