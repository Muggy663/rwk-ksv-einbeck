const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createNewsArticle() {
  try {
    const newsData = {
      title: "🚀 Version 1.9.2 - Cache leeren erforderlich",
      content: `Nach dem Update auf Version 1.9.2 ist es wichtig, den Cache zu leeren, um alle neuen Features optimal nutzen zu können.

**📱 Für die Android App:**
- App komplett schließen (aus den letzten Apps entfernen)
- App neu starten
- Bei Problemen: App-Cache in den Android-Einstellungen leeren

**🌐 Für die Web-Version (Browser):**
- **Chrome/Edge:** Strg + Shift + R (Windows) oder Cmd + Shift + R (Mac)
- **Firefox:** Strg + F5 (Windows) oder Cmd + Shift + R (Mac)
- **Safari:** Cmd + Option + R (Mac)

**📱 Für Safari auf iPhone/iPad:**
1. Einstellungen → Safari → Erweitert → Website-Daten
2. "Alle Website-Daten entfernen" wählen
3. Safari komplett schließen und neu öffnen
4. rwk-einbeck.de erneut aufrufen

**🔄 Alternative für alle Browser:**
- Seite öffnen → F12 drücken → Rechtsklick auf Aktualisieren-Button → "Cache leeren und hart neu laden"

**✨ Was ist neu in Version 1.9.2:**
- Verbesserte Performance
- Optimierte Benutzeroberfläche
- Bugfixes und Stabilität
- Erweiterte Sicherheitsfeatures

Nach dem Cache-Leeren sollten alle neuen Features einwandfrei funktionieren!`,
      excerpt: "Cache leeren nach Update auf Version 1.9.2 für optimale Performance - Anleitung für alle Geräte",
      category: "wichtig",
      priority: "hoch",
      status: "veroeffentlicht",
      targetAudience: "alle",
      pinned: true,
      tags: ["Update", "Cache", "Version 1.9.2", "Anleitung"],
      attachments: [],
      authorEmail: "admin@rwk-einbeck.de",
      authorName: "RWK Admin",
      createdAt: admin.firestore.Timestamp.now(),
      views: 0,
      slug: "version-192-cache-leeren"
    };

    const docRef = await db.collection('news').add(newsData);
    console.log('✅ News-Artikel erstellt mit ID:', docRef.id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des News-Artikels:', error);
    process.exit(1);
  }
}

createNewsArticle();