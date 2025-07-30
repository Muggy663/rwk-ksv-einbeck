# Beta-Strategie für KM-Meldungen

## Problem: Versteckte Entwicklung auf Vercel

Da Vercel keine lokalen Tests für alle Features ermöglicht, brauchen wir eine Strategie für die versteckte Entwicklung der KM-Funktionen.

## Empfohlene Lösung: Feature-Flags + Beta-Bereich

### 1. Feature-Flag System

```javascript
// lib/features.js
export const FEATURES = {
  KM_MELDUNGEN: process.env.NEXT_PUBLIC_ENABLE_KM === 'true',
  KM_ADMIN: process.env.NEXT_PUBLIC_ENABLE_KM_ADMIN === 'true'
};

// Verwendung in Komponenten
import { FEATURES } from '@/lib/features';

{FEATURES.KM_MELDUNGEN && (
  <NavigationItem href="/km">Kreismeisterschaft</NavigationItem>
)}
```

### 2. Beta-Zugang System

```javascript
// lib/beta.js
export const checkBetaAccess = (user) => {
  return user?.roles?.includes('km_beta') || 
         user?.email?.includes('@ksv-einbeck.de');
};

// Hook für Beta-Zugang
export const useBetaAccess = () => {
  const { user } = useAuth();
  return checkBetaAccess(user);
};
```

### 3. Middleware für KM-Routen

```javascript
// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // KM-Routen nur für Beta-Nutzer
  if (request.nextUrl.pathname.startsWith('/km')) {
    const betaToken = request.cookies.get('beta-access')?.value;
    
    if (!betaToken || betaToken !== process.env.BETA_ACCESS_TOKEN) {
      return NextResponse.redirect(new URL('/beta-login', request.url));
    }
  }
}

export const config = {
  matcher: '/km/:path*'
};
```

## Implementierungsstrategie

### Phase 1: Versteckte Entwicklung (Woche 1-2)

1. **Separate KM-Routen erstellen**
   ```
   pages/km/
   ├── index.js          // KM Dashboard
   ├── meldungen.js      // Meldungsformular
   ├── admin.js          // Admin-Bereich
   └── beta-login.js     // Beta-Anmeldung
   ```

2. **Keine Navigation zu KM-Bereichen**
   - Zugriff nur über direkte URLs
   - Keine Links in der Hauptnavigation

3. **Beta-Login Seite**
   ```javascript
   // pages/km/beta-login.js
   const BetaLogin = () => {
     const [password, setPassword] = useState('');
     
     const handleLogin = () => {
       if (password === 'km2025beta') {
         document.cookie = 'beta-access=km2025beta; path=/';
         router.push('/km');
       }
     };
     
     return (
       <div className="beta-login">
         <h1>KM 2025 Beta-Zugang</h1>
         <input 
           type="password" 
           value={password}
           onChange={(e) => setPassword(e.target.value)}
           placeholder="Beta-Passwort"
         />
         <button onClick={handleLogin}>Zugang</button>
       </div>
     );
   };
   ```

### Phase 2: Kontrollierte Beta (Woche 3)

1. **Beta-Button für ausgewählte Nutzer**
   ```javascript
   // components/BetaAccess.jsx
   const BetaAccess = () => {
     const { user } = useAuth();
     const hasBetaAccess = checkBetaAccess(user);
     
     if (!hasBetaAccess) return null;
     
     return (
       <div className="beta-section">
         <Link href="/km" className="beta-button">
           🧪 Beta: Kreismeisterschaft 2025
         </Link>
         <span className="beta-badge">Beta</span>
       </div>
     );
   };
   ```

2. **Integration in bestehende Navigation**
   ```javascript
   // components/Navigation.jsx
   <nav>
     <Link href="/">RWK</Link>
     <Link href="/tabellen">Tabellen</Link>
     <BetaAccess /> {/* Nur für Beta-Nutzer sichtbar */}
   </nav>
   ```

### Phase 3: Vollständige Integration (Nach Go-Live)

1. **Feature-Flags aktivieren**
   ```bash
   # Vercel Environment Variables
   NEXT_PUBLIC_ENABLE_KM=true
   NEXT_PUBLIC_ENABLE_KM_ADMIN=true
   ```

2. **Navigation erweitern**
   ```javascript
   <nav>
     <Link href="/">RWK</Link>
     <Link href="/tabellen">Tabellen</Link>
     <Link href="/km">Kreismeisterschaft</Link> {/* Jetzt für alle */}
   </nav>
   ```

## Startseiten-Anpassung

### Aktueller Zustand beibehalten
- Hauptfokus bleibt auf RWK
- Keine Verwirrung für bestehende Nutzer

### Beta-Phase: Minimale Änderungen
```javascript
// pages/index.js - Ergänzung
const HomePage = () => {
  return (
    <div>
      {/* Bestehender Content */}
      <RWKDashboard />
      
      {/* Beta-Bereich nur für berechtigte Nutzer */}
      <BetaAccess />
    </div>
  );
};
```

### Nach Go-Live: Vollständige Integration
```javascript
// pages/index.js - Erweitert
const HomePage = () => {
  return (
    <div>
      <h1>KSV Einbeck Sport App</h1>
      
      <div className="modules">
        <ModuleCard 
          title="Rundenwettkämpfe"
          href="/rwk"
          icon="🎯"
        />
        <ModuleCard 
          title="Kreismeisterschaft"
          href="/km"
          icon="🏆"
        />
      </div>
    </div>
  );
};
```

## Testing-Strategie

### Lokale Entwicklung
```bash
# .env.local
NEXT_PUBLIC_ENABLE_KM=true
BETA_ACCESS_TOKEN=km2025beta
```

### Vercel Preview Deployments
- Feature-Flags über Environment Variables steuern
- Beta-Passwort für Tester bereitstellen
- Separate Preview-URLs für verschiedene Test-Szenarien

### Produktions-Deployment
```bash
# Vercel Production Environment
NEXT_PUBLIC_ENABLE_KM=false  # Zunächst deaktiviert
BETA_ACCESS_TOKEN=km2025beta # Für Beta-Tester
```

## Beta-Tester Management

### Ausgewählte Vereine für Beta
- 2-3 technikaffine Vereine
- Verschiedene Vereinsgrößen testen
- Regelmäßiges Feedback sammeln

### Beta-Zugang verwalten
```javascript
// lib/betaUsers.js
export const BETA_USERS = [
  'admin@ksv-einbeck.de',
  'sportleiter@sv-muster.de',
  'test@beispielverein.de'
];

export const isBetaUser = (email) => {
  return BETA_USERS.includes(email) || 
         email.endsWith('@ksv-einbeck.de');
};
```

## Vorteile dieser Strategie

1. **Versteckte Entwicklung**: Normale Nutzer sehen nichts von KM-Features
2. **Kontrollierte Tests**: Nur ausgewählte Beta-Tester haben Zugang
3. **Flexibilität**: Feature-Flags ermöglichen schnelle Aktivierung/Deaktivierung
4. **Sicherheit**: Middleware schützt vor unberechtigtem Zugriff
5. **Sauberer Go-Live**: Einfache Aktivierung für alle Nutzer