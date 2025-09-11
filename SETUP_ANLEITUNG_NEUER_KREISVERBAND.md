# 🚀 Setup-Anleitung: Neuer Kreisverband

## 📋 Voraussetzungen

- **GitHub Account** (kostenlos)
- **Firebase Account** (Google Account)
- **Vercel Account** (kostenlos)
- **Domain** (optional, €12/Jahr bei Strato)
- **Setup-Zeit:** 2-3 Stunden

---

## 🛠️ Schritt 1: Repository klonen

### 1.1 Repository kopieren
```bash
# Terminal öffnen
git clone https://github.com/Muggy663/rwk-platform.git rwk-[kreisverband]
cd rwk-[kreisverband]

# Beispiel für KSV Göttingen:
git clone https://github.com/Muggy663/rwk-platform.git rwk-goettingen
cd rwk-goettingen
```

### 1.2 Dependencies installieren
```bash
npm install
```

---

## 🔥 Schritt 2: Firebase Setup

### 2.1 Neues Firebase Project erstellen
1. **https://console.firebase.google.com** öffnen
2. **"Projekt hinzufügen"** klicken
3. **Projektname:** `rwk-[kreisverband]` (z.B. `rwk-goettingen`)
4. **Google Analytics:** Deaktivieren (optional)
5. **Projekt erstellen**

### 2.2 Firestore Database aktivieren
1. **"Firestore Database"** im Menü
2. **"Datenbank erstellen"**
3. **Produktionsmodus** wählen
4. **Standort:** `europe-west3 (Frankfurt)`
5. **Fertig**

### 2.3 Authentication aktivieren
1. **"Authentication"** im Menü
2. **"Loslegen"**
3. **"Sign-in method"** Tab
4. **"E-Mail/Passwort"** aktivieren
5. **Speichern**

### 2.4 Storage aktivieren
1. **"Storage"** im Menü
2. **"Loslegen"**
3. **Produktionsmodus** wählen
4. **Standort:** `europe-west3 (Frankfurt)`
5. **Fertig**

### 2.5 Web-App hinzufügen
1. **Projektübersicht** → **"</>"** Symbol
2. **App-Name:** `RWK [Kreisverband]`
3. **Firebase Hosting:** Nicht aktivieren
4. **App registrieren**
5. **Config-Daten kopieren** (wichtig!)

---

## ⚙️ Schritt 3: Konfiguration anpassen

### 3.1 Firebase Config eintragen
```bash
# .env.local Datei erstellen
touch .env.local
```

**.env.local Inhalt:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=deine_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rwk-kreisverband.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rwk-kreisverband
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rwk-kreisverband.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3.2 Kreisverband-Daten anpassen

**app/page.tsx** bearbeiten:
```typescript
// Zeile ~15 ändern
<h1 className="text-4xl font-bold text-center mb-4 text-blue-900">
  RWK [Kreisverband-Name]  // ← Hier ändern
</h1>

// Zeile ~18 ändern  
<p className="text-center text-blue-700">
  🎯 Rundenwettkampf-Verwaltung für den [Kreisverband-Name]  // ← Hier ändern
</p>
```

**app/layout.tsx** bearbeiten:
```typescript
// Zeile ~8 ändern
title: 'RWK [Kreisverband-Name]',  // ← Hier ändern
description: 'Rundenwettkampf-Verwaltung für den [Kreisverband-Name]',  // ← Hier ändern
```

### 3.3 Kontaktdaten anpassen

**app/impressum/page.tsx** bearbeiten:
```typescript
// Alle Kontaktdaten durch eigene ersetzen:
- Name des Kreisverbands
- Adresse
- E-Mail
- Telefon
- Verantwortliche Personen
```

---

## 🚀 Schritt 4: Vercel Deployment

### 4.1 Vercel Account erstellen
1. **https://vercel.com** öffnen
2. **"Sign Up"** mit GitHub Account
3. **Repository verknüpfen**

### 4.2 Projekt deployen
1. **"New Project"** klicken
2. **Repository auswählen** (`rwk-[kreisverband]`)
3. **Framework:** Next.js (automatisch erkannt)
4. **Environment Variables** hinzufügen:
   - Alle Werte aus `.env.local` eintragen
5. **Deploy** klicken

### 4.3 Domain verknüpfen (optional)
```bash
# Bei Strato Domain kaufen: rwk-[kreisverband].de
# In Vercel: Settings → Domains → Add Domain
# DNS bei Strato auf Vercel umleiten
```

---

## 👤 Schritt 5: Admin-User erstellen

### 5.1 Erste Registrierung
1. **Deployed App öffnen**
2. **"Registrieren"** klicken
3. **Admin-E-Mail** eingeben
4. **Passwort** erstellen

### 5.2 Admin-Rechte vergeben
```javascript
// Firebase Console → Firestore → users Collection
// Ersten User bearbeiten:
{
  email: "admin@kreisverband.de",
  role: "admin",
  rwk_admin: true,
  km_orga: true,
  vereins_admin: true,
  created_at: timestamp
}
```

---

## 🏢 Schritt 6: Basis-Daten importieren

### 6.1 Vereine anlegen
```javascript
// Firestore → vereine Collection erstellen
{
  id: "sv-beispiel",
  name: "SV Beispiel",
  ort: "Beispielstadt", 
  kontakt: "vorstand@sv-beispiel.de",
  aktiv: true
}
```

### 6.2 Disziplinen konfigurieren
```javascript
// Firestore → disziplinen Collection
{
  id: "kk",
  name: "Kleinkaliber",
  schusszahl: 30,
  ringe_max: 300,
  aktiv: true
}
```

### 6.3 Saisons anlegen
```javascript
// Firestore → saisons Collection  
{
  id: "2025-kk",
  name: "2025 Kleinkaliber",
  jahr: 2025,
  disziplin: "kk",
  status: "laufend"
}
```

---

## 🎯 Schritt 7: Testing & Go-Live

### 7.1 Funktionstest
- [ ] **Login/Logout** funktioniert
- [ ] **RWK-Tabellen** werden angezeigt
- [ ] **Vereinsauswahl** funktioniert
- [ ] **Responsive Design** auf Mobile

### 7.2 Erste Daten eingeben
- [ ] **Vereine** importieren
- [ ] **Mannschaften** anlegen
- [ ] **Test-Ergebnisse** eingeben
- [ ] **Tabellen** prüfen

### 7.3 Benutzer einladen
- [ ] **Vereinsvertreter** registrieren lassen
- [ ] **Rollen** zuweisen
- [ ] **Schulung** durchführen

---

## 💰 Kosten-Übersicht

### **Kostenlose Variante:**
- **Domain:** `rwk-kreisverband.vercel.app` (kostenlos)
- **Hosting:** Vercel Free Tier (kostenlos)
- **Firebase:** Spark Plan (kostenlos bis 1GB)
- **Gesamt:** €0/Monat

### **Premium Variante:**
- **Domain:** `rwk-kreisverband.de` (€12/Jahr)
- **Hosting:** Vercel Pro (€20/Monat)
- **Firebase:** Blaze Plan (Pay-as-you-go)
- **Gesamt:** ~€25/Monat

---

## 🆘 Support & Hilfe

### **Bei Problemen:**
1. **GitHub Issues:** https://github.com/Muggy663/rwk-platform/issues
2. **E-Mail:** rwk-leiter-ksve@gmx.de
3. **Dokumentation:** `/docs` Ordner im Repository

### **Setup-Service:**
- **Komplettes Setup:** €500 einmalig
- **Schulung:** €200 (2 Stunden)
- **Wartung:** €50/Monat

---

## ✅ Checkliste

- [ ] Repository geklont
- [ ] Firebase Project erstellt
- [ ] Firestore, Auth, Storage aktiviert
- [ ] .env.local konfiguriert
- [ ] Kreisverband-Daten angepasst
- [ ] Vercel Deployment erfolgreich
- [ ] Domain verknüpft (optional)
- [ ] Admin-User erstellt
- [ ] Basis-Daten importiert
- [ ] Funktionstest bestanden
- [ ] Erste Benutzer eingeladen

**🎉 Herzlichen Glückwunsch! Ihr RWK-System ist einsatzbereit!**

---

**Entwickelt von:** Marcel Bünger, RWK-Leiter KSV Einbeck  
**Version:** 1.0 (Januar 2025)  
**Lizenz:** Proprietär - Nur für autorisierte Kreisverbände