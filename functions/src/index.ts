import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { cleanupExpiredEvents } from './cleanupEvents';

admin.initializeApp();

// Resend API Key aus Environment Variables
const RESEND_API_KEY = functions.config().resend?.api_key || process.env.RESEND_API_KEY;

// Exportiere die Funktion zum Löschen abgelaufener Termine
export { cleanupExpiredEvents };

/**
 * Cloud Function: Benachrichtigung bei neuen Mannschaften
 * Wird automatisch ausgelöst, wenn eine neue Mannschaft erstellt wird
 */
export const onTeamCreated = functions.firestore
  .document('rwk_teams/{teamId}')
  .onCreate(async (snap, context) => {
    try {
      const teamData = snap.data();
      const teamId = context.params.teamId;
      
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