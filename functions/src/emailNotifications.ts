import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Resend API Key aus Environment Variables
const RESEND_API_KEY = functions.config().resend?.api_key || process.env.RESEND_API_KEY;

/**
 * Erweiterte E-Mail-Benachrichtigung für RWK-Ergebnisse
 * Nutzt Audit-Log-Daten für detaillierte Informationen
 */
export const onAuditLogCreated = functions.firestore
  .document('audit_logs/{auditId}')
  .onCreate(async (snap, _context) => {
    try {
      const auditData = snap.data();
      
      // Nur für RWK-Score-Erstellungen
      if (auditData.entityType !== 'score' || auditData.action !== 'create') {
        return;
      }
      
      console.log('Neuer Audit-Eintrag für Score-Erstellung:', auditData);
      
      // Sammle Ergebnisse für die gleiche Mannschaft und Durchgang in den letzten 5 Minuten
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const recentAuditQuery = admin.firestore()
        .collection('audit_logs')
        .where('entityType', '==', 'score')
        .where('action', '==', 'create')
        .where('teamId', '==', auditData.teamId)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(fiveMinutesAgo))
        .orderBy('timestamp', 'desc');
      
      const recentAuditSnapshot = await recentAuditQuery.get();
      const recentScores = recentAuditSnapshot.docs.map(doc => doc.data());
      
      // Gruppiere nach Durchgang
      const scoresByRound: { [key: number]: any[] } = {};
      recentScores.forEach(score => {
        const durchgang = score.details?.after?.durchgang || score.details?.description?.match(/DG (\d+)/)?.[1];
        if (durchgang) {
          const roundNum = parseInt(durchgang);
          if (!scoresByRound[roundNum]) {
            scoresByRound[roundNum] = [];
          }
          scoresByRound[roundNum].push(score);
        }
      });
      
      // Sende E-Mail für jeden Durchgang mit neuen Ergebnissen
      for (const [durchgang, scores] of Object.entries(scoresByRound)) {
        await sendScoreNotificationEmail(
          auditData.teamName || 'Unbekannt',
          auditData.leagueName || 'Unbekannte Liga',
          parseInt(durchgang),
          scores.length,
          scores,
          auditData.userName || 'Unbekannter Benutzer'
        );
      }
      
    } catch (error) {
      console.error('Fehler in onAuditLogCreated:', error);
    }
  });

/**
 * Sendet eine detaillierte E-Mail-Benachrichtigung für neue RWK-Ergebnisse
 */
async function sendScoreNotificationEmail(
  teamName: string,
  leagueName: string,
  durchgang: number,
  resultCount: number,
  scoreDetails: any[],
  userName: string
) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY nicht konfiguriert - E-Mail wird nicht gesendet');
    return;
  }
  
  try {
    // Erstelle detaillierte Ergebnis-Liste
    const scoreList = scoreDetails.map(score => {
      const description = score.details?.description || '';
      const shooterMatch = description.match(/Ergebnis erfasst: (.+?) - (\d+) Ringe/);
      const shooterName = shooterMatch?.[1] || 'Unbekannter Schütze';
      const rings = shooterMatch?.[2] || 'Unbekannt';
      
      return `• ${shooterName}: ${rings} Ringe`;
    }).join('\n');
    
    const timestamp = new Date().toLocaleString('de-DE', {
      timeZone: 'Europe/Berlin',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const emailData = {
      from: 'RWK Einbeck <noreply@rwk-einbeck.de>',
      to: ['rwk-leiter-ksve@gmx.de'],
      subject: `Neue Ergebnisse eingegangen`,
      html: `
        <h2>Neue Ergebnisse eingegangen:</h2>
        <br>
        <p><strong>Mannschaft:</strong> ${teamName}</p>
        <p><strong>Liga:</strong> ${leagueName}</p>
        <p><strong>Durchgang:</strong> ${durchgang}</p>
        <p><strong>Anzahl Ergebnisse:</strong> ${resultCount}</p>
        <p><strong>Zeitpunkt:</strong> ${timestamp}</p>
        <br>
        <h3>📊 Ergebnis-Details:</h3>
        <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace;">
${scoreList}
        </pre>
        <p><strong>Eingegeben von:</strong> ${userName}</p>
        <br>
        <p>Die Ergebnisse wurden digital erfasst und sind sofort in den RWK-Tabellen verfügbar.</p>
        <br>
        <p><a href="https://rwk-einbeck.de/rwk-tabellen">→ Zu den RWK-Tabellen</a></p>
        <p><a href="https://rwk-einbeck.de/admin/audit">→ Zum Änderungsprotokoll</a></p>
        <br>
        <hr>
        <p><strong>WICHTIGER HINWEIS:</strong><br>
        Bitte antworten Sie NICHT auf diese E-Mail.<br>
        Bei Fragen oder Rückmeldungen schreiben Sie an: <a href="mailto:rwk-leiter-ksve@gmx.de">rwk-leiter-ksve@gmx.de</a></p>
        <br>
        <p>Mit sportlichen Grüßen<br>
        Marcel Bünger<br>
        Rundenwettkampfleiter KSVE Einbeck</p>
      `,
      text: `
Neue Ergebnisse eingegangen:

Mannschaft: ${teamName}
Liga: ${leagueName}
Durchgang: ${durchgang}
Anzahl Ergebnisse: ${resultCount}
Zeitpunkt: ${timestamp}

Ergebnis-Details:
${scoreList}

Eingegeben von: ${userName}

Die Ergebnisse wurden digital erfasst und sind sofort in den RWK-Tabellen verfügbar.

WICHTIGER HINWEIS:
Bitte antworten Sie NICHT auf diese E-Mail.
Bei Fragen oder Rückmeldungen schreiben Sie an: rwk-leiter-ksve@gmx.de

Mit sportlichen Grüßen
Marcel Bünger
Rundenwettkampfleiter KSVE Einbeck
      `
    };
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fehler beim Senden der E-Mail:', errorText);
    } else {
      console.log(`E-Mail-Benachrichtigung gesendet: ${teamName} - ${resultCount} Ergebnisse (DG ${durchgang})`);
    }
    
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail-Benachrichtigung:', error);
  }
}

/**
 * Manuelle Funktion zum Testen der E-Mail-Benachrichtigungen
 */
export const testScoreNotification = functions.https.onCall(async (_data, context) => {
  // Nur für Admins
  if (!context.auth || context.auth.token.email !== 'admin@rwk-einbeck.de') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Nur der Administrator kann Test-E-Mails senden.'
    );
  }
  
  try {
    await sendScoreNotificationEmail(
      'Test Mannschaft I',
      'Test Liga',
      1,
      3,
      [
        { details: { description: 'Ergebnis erfasst: Max Mustermann - 285 Ringe (DG 1)' } },
        { details: { description: 'Ergebnis erfasst: Anna Beispiel - 292 Ringe (DG 1)' } },
        { details: { description: 'Ergebnis erfasst: Peter Test - 278 Ringe (DG 1)' } }
      ],
      'Test Administrator'
    );
    
    return { success: true, message: 'Test-E-Mail wurde gesendet.' };
  } catch (error) {
    console.error('Fehler beim Senden der Test-E-Mail:', error);
    throw new functions.https.HttpsError('internal', 'Fehler beim Senden der Test-E-Mail.');
  }
});