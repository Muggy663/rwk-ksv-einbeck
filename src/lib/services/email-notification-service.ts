import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

export interface EmailNotificationData {
  teamName: string;
  leagueName: string;
  durchgang: number;
  resultCount: number;
  resultDetails: Array<{
    shooterName: string;
    score: number;
    teamName: string;
  }>;
  userName: string;
  timestamp: Date;
}

/**
 * Sendet eine E-Mail-Benachrichtigung für neue RWK-Ergebnisse
 * Diese Funktion wird direkt beim Speichern aufgerufen für sofortige Benachrichtigungen
 */
export async function sendResultNotificationEmail(data: EmailNotificationData): Promise<boolean> {
  try {
    logDebug('Sende E-Mail-Benachrichtigung für Ergebnisse:', {
      teamName: data.teamName,
      leagueName: data.leagueName,
      durchgang: data.durchgang,
      resultCount: data.resultCount
    });

    // Firebase Auth Token holen
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    let authHeaders = {};
    
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        authHeaders = { 'Authorization': `Bearer ${token}` };
      } catch (tokenError) {
        logWarn('Konnte Firebase-Token nicht laden:', tokenError);
      }
    }

    // Erstelle detaillierte Ergebnis-Liste
    const resultDetailsList = data.resultDetails.map(result => 
      `• ${result.shooterName}: ${result.score} Ringe (${result.teamName})`
    ).join('\r\n');

    // Formatiere Zeitstempel
    const formattedTimestamp = data.timestamp.toLocaleString('de-DE', {
      timeZone: 'Europe/Berlin',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // E-Mail-Daten zusammenstellen
    const emailFormData = new FormData();
    emailFormData.append('subject', 'Neue Ergebnisse eingegangen');
    emailFormData.append('message', `Neue Ergebnisse eingegangen:

Mannschaft: ${data.teamName}
Liga: ${data.leagueName}
Durchgang: ${data.durchgang}
Anzahl Ergebnisse: ${data.resultCount}
Zeitpunkt: ${formattedTimestamp}

📊 Ergebnis-Details:
${resultDetailsList}

Eingegeben von: ${data.userName}

Die Ergebnisse wurden digital erfasst und sind sofort in den RWK-Tabellen verfügbar.

WICHTIGER HINWEIS:
Bitte antworten Sie NICHT auf diese E-Mail.
Bei Fragen oder Rückmeldungen schreiben Sie an: rwk-leiter-ksve@gmx.de

Mit sportlichen Grüßen
Marcel Bünger
Rundenwettkampfleiter KSVE Einbeck`);

    emailFormData.append('recipients', JSON.stringify([
      { name: 'RWK-Leiter', email: 'rwk-leiter-ksve@gmx.de' }
    ]));

    // E-Mail senden
    const emailResponse = await fetch('/api/send-email', {
      method: 'POST',
      headers: authHeaders,
      body: emailFormData
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      logError('E-Mail-Benachrichtigung fehlgeschlagen:', errorText);
      return false;
    }

    const responseData = await emailResponse.json();
    
    if (responseData.success) {
      logInfo(`E-Mail-Benachrichtigung erfolgreich gesendet: ${data.teamName} - ${data.resultCount} Ergebnisse (DG ${data.durchgang})`);
      return true;
    } else {
      logError('E-Mail-Benachrichtigung fehlgeschlagen:', responseData.message);
      return false;
    }

  } catch (error) {
    logError('Fehler beim Senden der E-Mail-Benachrichtigung:', error);
    return false;
  }
}

/**
 * Gruppiert Ergebnisse nach Mannschaft und Durchgang für E-Mail-Benachrichtigungen
 */
export function groupResultsForNotification(results: Array<{
  teamId: string;
  teamName: string;
  leagueName: string;
  durchgang: number;
  shooterName: string;
  totalRinge: number;
}>): Array<{
  teamId: string;
  teamName: string;
  leagueName: string;
  durchgang: number;
  results: Array<{ shooterName: string; score: number; teamName: string; }>;
}> {
  const grouped = results.reduce((acc, result) => {
    const key = `${result.teamId}-${result.durchgang}`;
    
    if (!acc[key]) {
      acc[key] = {
        teamId: result.teamId,
        teamName: result.teamName,
        leagueName: result.leagueName,
        durchgang: result.durchgang,
        results: []
      };
    }
    
    acc[key].results.push({
      shooterName: result.shooterName,
      score: result.totalRinge,
      teamName: result.teamName
    });
    
    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped);
}

/**
 * Sendet E-Mail-Benachrichtigungen für alle gruppierten Ergebnisse
 */
export async function sendAllResultNotifications(
  results: Array<{
    teamId: string;
    teamName: string;
    leagueName: string;
    durchgang: number;
    shooterName: string;
    totalRinge: number;
  }>,
  userName: string
): Promise<{ sent: number; failed: number }> {
  const groupedResults = groupResultsForNotification(results);
  let sent = 0;
  let failed = 0;

  for (const group of groupedResults) {
    const notificationData: EmailNotificationData = {
      teamName: group.teamName,
      leagueName: group.leagueName,
      durchgang: group.durchgang,
      resultCount: group.results.length,
      resultDetails: group.results,
      userName,
      timestamp: new Date()
    };

    const success = await sendResultNotificationEmail(notificationData);
    if (success) {
      sent++;
    } else {
      failed++;
    }

    // Kurze Pause zwischen E-Mails um Rate Limiting zu vermeiden
    if (groupedResults.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { sent, failed };
}