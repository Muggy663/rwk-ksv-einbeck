import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { cleanupExpiredEvents } from './cleanupEvents';
import { onAuditLogCreated, testScoreNotification } from './emailNotifications';

admin.initializeApp();

// Resend API Key aus Environment Variables
const RESEND_API_KEY = functions.config().resend?.api_key || process.env.RESEND_API_KEY;

// Exportiere die Funktion zum Löschen abgelaufener Termine
export { cleanupExpiredEvents, onAuditLogCreated, testScoreNotification };

/**
 * Cloud Function: Benachrichtigung bei neuen RWK-Ergebnissen
 * Wird automatisch ausgelöst, wenn ein neues Ergebnis in rwk_scores erstellt wird
 */
export const onRWKScoreCreated = functions.firestore
  .document('rwk_scores/{scoreId}')
  .onCreate(async (snap, context) => {
    try {
      const scoreData = snap.data();
      const scoreId = context.params.scoreId;
      
      console.log('Neues RWK-Ergebnis erstellt:', scoreId, scoreData);
      
      // Sammle alle notwendigen Daten - verwende zuerst die Daten aus dem Score-Dokument
      let teamName = scoreData.teamName || 'Unbekannt';
      let leagueName = scoreData.leagueName || 'Unbekannte Liga';
      let shooterName = scoreData.shooterName || 'Unbekannter Schütze';
      let clubName = 'Unbekannter Verein';
      
      // Nur wenn Daten fehlen, aus der Datenbank nachladen
      if (teamName === 'Unbekannt' && scoreData.teamId) {
        try {
          const teamDoc = await admin.firestore().collection('rwk_teams').doc(scoreData.teamId).get();
          if (teamDoc.exists) {
            const teamData = teamDoc.data();
            teamName = teamData?.name || teamName;
            
            // Liga-Daten laden falls nicht vorhanden
            if (!scoreData.leagueName && teamData?.leagueId) {
              try {
                const leagueDoc = await admin.firestore().collection('rwk_leagues').doc(teamData.leagueId).get();
                if (leagueDoc.exists) {
                  leagueName = leagueDoc.data()?.name || leagueName;
                }
              } catch (error) {
                console.warn('Fehler beim Laden der Liga:', error);
              }
            }
            
            // Verein-Daten laden
            if (teamData?.clubId) {
              try {
                const clubDoc = await admin.firestore().collection('clubs').doc(teamData.clubId).get();
                if (clubDoc.exists) {
                  clubName = clubDoc.data()?.name || clubName;
                }
              } catch (error) {
                console.warn('Fehler beim Laden des Vereins:', error);
              }
            }
          }
        } catch (error) {
          console.warn('Fehler beim Laden der Mannschaft:', error);
        }
      }
      
      // Schützen-Name aus Score-Daten verwenden, falls vorhanden
      if (scoreData.shooterName) {
        shooterName = scoreData.shooterName;
      } else if (scoreData.shooterId) {
        try {
          const shooterDoc = await admin.firestore().collection('shooters').doc(scoreData.shooterId).get();
          if (shooterDoc.exists) {
            shooterName = shooterDoc.data()?.name || shooterName;
          }
        } catch (error) {
          console.warn('Fehler beim Laden des Schützen:', error);
        }
      }
      
      // Benutzer-Daten laden (wer hat das Ergebnis eingegeben)
      let userName = scoreData.enteredByUserName || 'Unbekannter Benutzer';
      let userEmail = 'unbekannt@example.com';
      if (scoreData.enteredByUserId || scoreData.createdBy) {
        try {
          const userId = scoreData.enteredByUserId || scoreData.createdBy;
          const userDoc = await admin.firestore().collection('user_permissions').doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userName = userData?.displayName || userData?.email || userName;
            userEmail = userData?.email || userEmail;
          }
        } catch (error) {
          console.warn('Fehler beim Laden der Benutzerdaten:', error);
        }
      }
      
      // Zähle alle Ergebnisse für diese Mannschaft und Durchgang
      let totalResultsForTeamAndRound = 1; // Das aktuelle Ergebnis
      if (scoreData.teamId && scoreData.durchgang) {
        try {
          const scoresQuery = admin.firestore()
            .collection('rwk_scores')
            .where('teamId', '==', scoreData.teamId)
            .where('durchgang', '==', scoreData.durchgang)
            .where('competitionYear', '==', scoreData.competitionYear || new Date().getFullYear());
          
          const scoresSnapshot = await scoresQuery.get();
          totalResultsForTeamAndRound = scoresSnapshot.size;
        } catch (error) {
          console.warn('Fehler beim Zählen der Ergebnisse:', error);
        }
      }
      
      // E-Mail senden
      if (RESEND_API_KEY) {
        const emailData = {
          from: 'RWK Einbeck <noreply@rwk-einbeck.de>',
          to: ['rwk-leiter-ksve@gmx.de'],
          subject: `Neue Ergebnisse eingegangen`,
          html: `
            <h2>Neue Ergebnisse eingegangen:</h2>
            <br>
            <p><strong>Mannschaft:</strong> ${teamName}</p>
            <p><strong>Liga:</strong> ${leagueName}</p>
            <p><strong>Durchgang:</strong> ${scoreData.durchgang || 'Unbekannt'}</p>
            <p><strong>Anzahl Ergebnisse:</strong> ${totalResultsForTeamAndRound}</p>
            <p><strong>Zeitpunkt:</strong> ${new Date().toLocaleString('de-DE', { 
              timeZone: 'Europe/Berlin',
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}</p>
            <br>
            <h3>📊 Ergebnis-Details:</h3>
            <p><strong>Schütze:</strong> ${shooterName}</p>
            <p><strong>Ringe:</strong> ${scoreData.score || 'Unbekannt'}</p>
            <p><strong>Verein:</strong> ${clubName}</p>
            <p><strong>Eingegeben von:</strong> ${userName} (${userEmail})</p>
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
Durchgang: ${scoreData.durchgang || 'Unbekannt'}
Anzahl Ergebnisse: ${totalResultsForTeamAndRound}
Zeitpunkt: ${new Date().toLocaleString('de-DE', { 
  timeZone: 'Europe/Berlin',
  day: '2-digit',
  month: '2-digit', 
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
})}

Ergebnis-Details:
Schütze: ${shooterName}
Ringe: ${scoreData.score || 'Unbekannt'}
Verein: ${clubName}
Eingegeben von: ${userName} (${userEmail})

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
          console.log(`E-Mail-Benachrichtigung für neues Ergebnis gesendet: ${shooterName} - ${scoreData.score} Ringe (${teamName})`);
        }
      } else {
        console.warn('RESEND_API_KEY nicht konfiguriert - E-Mail wird nicht gesendet');
      }
      
    } catch (error) {
      console.error('Fehler in onRWKScoreCreated:', error);
    }
  });

/**
 * Cloud Function: Batch-Benachrichtigung bei mehreren neuen RWK-Ergebnissen
 * Sammelt Ergebnisse über 30 Sekunden und sendet eine zusammengefasste E-Mail
 */
export const onRWKScoreBatch = functions.firestore
  .document('rwk_scores/{scoreId}')
  .onCreate(async (snap, _context) => {
    try {
      const scoreData = snap.data();
      
      // Warte 30 Sekunden und sammle dann alle neuen Ergebnisse
      setTimeout(async () => {
        try {
          const thirtySecondsAgo = new Date(Date.now() - 30000);
          
          // Sammle alle Ergebnisse der letzten 30 Sekunden für diese Mannschaft und Durchgang
          if (scoreData.teamId && scoreData.durchgang) {
            const recentScoresQuery = admin.firestore()
              .collection('rwk_scores')
              .where('teamId', '==', scoreData.teamId)
              .where('durchgang', '==', scoreData.durchgang)
              .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtySecondsAgo));
            
            const recentScoresSnapshot = await recentScoresQuery.get();
            
            if (recentScoresSnapshot.size > 1) {
              console.log(`Batch von ${recentScoresSnapshot.size} Ergebnissen erkannt für Team ${scoreData.teamId}, Durchgang ${scoreData.durchgang}`);
              
              // Hier könnte eine zusammengefasste E-Mail gesendet werden
              // Für jetzt loggen wir nur, dass ein Batch erkannt wurde
            }
          }
        } catch (error) {
          console.error('Fehler beim Verarbeiten des Ergebnis-Batches:', error);
        }
      }, 30000);
      
    } catch (error) {
      console.error('Fehler in onRWKScoreBatch:', error);
    }
  });

/**
 * Cloud Function: Benachrichtigung bei neuen Mannschaften
 * Wird automatisch ausgelöst, wenn eine neue Mannschaft erstellt wird
 */
export const onTeamCreated = functions.firestore
  .document('rwk_teams/{teamId}')
  .onCreate(async (snap, _context) => {
    try {
      const teamData = snap.data();
      
      // Club-Name laden
      let clubName = 'Unbekannter Verein';
      if (teamData.clubId) {
        try {
          const clubDoc = await admin.firestore().collection('clubs').doc(teamData.clubId).get();
          if (clubDoc.exists) {
            clubName = clubDoc.data()?.name || clubName;
          }
        } catch (error) {
          console.warn('Fehler beim Laden des Vereinsnamens:', error);
        }
      }
      
      // Saison-Name laden
      let seasonName = 'Unbekannte Saison';
      if (teamData.seasonId) {
        try {
          const seasonDoc = await admin.firestore().collection('seasons').doc(teamData.seasonId).get();
          if (seasonDoc.exists) {
            seasonName = seasonDoc.data()?.name || seasonName;
          }
        } catch (error) {
          console.warn('Fehler beim Laden des Saisonnamens:', error);
        }
      }
      
      // E-Mail senden
      if (RESEND_API_KEY) {
        const emailData = {
          from: 'RWK Einbeck <noreply@rwk-einbeck.de>',
          to: ['rwk-leiter-ksve@gmx.de'],
          subject: `🆕 Neue Mannschaft angelegt: ${teamData.name}`,
          html: `
            <h2>Neue Mannschaft wurde angelegt</h2>
            <p><strong>Mannschaft:</strong> ${teamData.name}</p>
            <p><strong>Verein:</strong> ${clubName}</p>
            <p><strong>Saison:</strong> ${seasonName}</p>
            <p><strong>Disziplin:</strong> ${teamData.leagueType || 'Nicht angegeben'}</p>
            <p><strong>Schützen:</strong> ${teamData.shooterIds?.length || 0}</p>
            <p><strong>Außer Konkurrenz:</strong> ${teamData.outOfCompetition ? 'Ja' : 'Nein'}</p>
            <br>
            <p><a href="https://rwk-einbeck.de/admin/teams">→ Zur Mannschaftsverwaltung</a></p>
            <hr>
            <p><small>Diese E-Mail wurde automatisch generiert.</small></p>
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
          console.error('Fehler beim Senden der E-Mail:', await response.text());
        } else {
          console.log(`E-Mail-Benachrichtigung für neue Mannschaft ${teamData.name} gesendet`);
        }
      } else {
        console.warn('RESEND_API_KEY nicht konfiguriert - E-Mail wird nicht gesendet');
      }
      
    } catch (error) {
      console.error('Fehler in onTeamCreated:', error);
    }
  });

/**
 * Cloud Function zum Erstellen eines neuen Benutzers mit Rolle und Vereinszuweisung
 * 
 * @param data - Enthält die Benutzerdaten (email, password, displayName, role, clubId)
 * @returns Ein Objekt mit success, message und uid (bei Erfolg)
 */
export const createUserWithRole = functions.https.onCall(async (data, context) => {
  // Überprüfen, ob der aufrufende Benutzer ein Admin ist
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Nicht authentifiziert.'
    );
  }

  try {
    // Admin-Berechtigung prüfen
    const callerEmail = context.auth.token.email || '';
    
    if (callerEmail !== 'admin@rwk-einbeck.de') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Nur der Administrator darf Benutzer erstellen.'
      );
    }

    // Validierung der Eingabedaten
    const { email, password, displayName, role, clubId } = data;
    
    if (!email || !password) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'E-Mail und Passwort sind erforderlich.'
      );
    }

    if ((role === 'vereinsvertreter' || role === 'mannschaftsfuehrer') && !clubId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Für die Rolle "${role}" muss ein Verein ausgewählt werden.`
      );
    }

    // Benutzer in Firebase Authentication erstellen
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || undefined,
    });

    // Berechtigungen in Firestore speichern
    await admin.firestore().collection('user_permissions').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName: displayName || null,
      role,
      clubId: clubId || null,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Erfolg zurückgeben
    return {
      success: true,
      message: `Benutzer ${email} wurde erfolgreich erstellt.`,
      uid: userRecord.uid,
    };
  } catch (error: any) {
    console.error('Fehler beim Erstellen des Benutzers:', error);
    
    // Fehler zurückgeben
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Beim Erstellen des Benutzers ist ein Fehler aufgetreten.'
    );
  }
});