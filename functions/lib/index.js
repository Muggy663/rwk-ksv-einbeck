"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserWithRole = exports.cleanupExpiredEvents = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cleanupEvents_1 = require("./cleanupEvents");
Object.defineProperty(exports, "cleanupExpiredEvents", { enumerable: true, get: function () { return cleanupEvents_1.cleanupExpiredEvents; } });
admin.initializeApp();
/**
 * Cloud Function zum Erstellen eines neuen Benutzers mit Rolle und Vereinszuweisung
 *
 * @param data - Enthält die Benutzerdaten (email, password, displayName, role, clubId)
 * @returns Ein Objekt mit success, message und uid (bei Erfolg)
 */
exports.createUserWithRole = functions.https.onCall(async (data, context) => {
    // Überprüfen, ob der aufrufende Benutzer ein Admin ist
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Nicht authentifiziert.');
    }
    try {
        // Admin-Berechtigung prüfen
        const callerEmail = context.auth.token.email || '';
        if (callerEmail !== 'admin@rwk-einbeck.de') {
            throw new functions.https.HttpsError('permission-denied', 'Nur der Administrator darf Benutzer erstellen.');
        }
        // Validierung der Eingabedaten
        const { email, password, displayName, role, clubId } = data;
        if (!email || !password) {
            throw new functions.https.HttpsError('invalid-argument', 'E-Mail und Passwort sind erforderlich.');
        }
        if ((role === 'vereinsvertreter' || role === 'mannschaftsfuehrer') && !clubId) {
            throw new functions.https.HttpsError('invalid-argument', `Für die Rolle "${role}" muss ein Verein ausgewählt werden.`);
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
    }
    catch (error) {
        console.error('Fehler beim Erstellen des Benutzers:', error);
        // Fehler zurückgeben
        throw new functions.https.HttpsError('internal', error.message || 'Beim Erstellen des Benutzers ist ein Fehler aufgetreten.');
    }
});
//# sourceMappingURL=index.js.map