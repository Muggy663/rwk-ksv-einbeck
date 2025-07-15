# 📧 Bounce-Handling Setup für rwk-einbeck.de

## 1. Resend Webhook konfigurieren

### In Resend Dashboard:
1. Gehe zu **Webhooks** → **Add Webhook**
2. URL: `https://rwk-einbeck.de/api/email-webhook`
3. Events auswählen:
   - `email.bounced` (E-Mail nicht zustellbar)
   - `email.complained` (Spam-Beschwerde)
   - `email.delivery_delayed` (Verzögerung)

## 2. Webhook-Handler erstellen

```javascript
// src/app/api/email-webhook/route.ts
export async function POST(request: Request) {
  const data = await request.json();
  
  if (data.type === 'email.bounced') {
    // E-Mail an Admin senden
    console.log('❌ E-Mail nicht zustellbar:', data.data.to);
    
    // Optional: In Datenbank speichern
    // Optional: Admin benachrichtigen
  }
  
  return Response.json({ received: true });
}
```

## 3. Admin-Benachrichtigungen

Bei Bounce/Fehler automatisch E-Mail an:
- rwk-leiter-ksv@gmx.de

## 4. Dashboard-Integration

Fehlgeschlagene E-Mails im Admin-Bereich anzeigen.