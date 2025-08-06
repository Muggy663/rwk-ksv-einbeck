import { httpsCallable } from 'firebase/functions';
import { functions } from './config';

/**
 * Erstellt einen neuen Benutzer mit Rolle und Vereinszuweisung
 * 
 * @param email - E-Mail-Adresse des neuen Benutzers
 * @param password - Passwort des neuen Benutzers
 * @param displayName - Anzeigename des neuen Benutzers (optional)
 * @param role - Rolle des neuen Benutzers (vereinsvertreter oder mannschaftsfuehrer)
 * @param clubId - ID des Vereins, dem der Benutzer zugewiesen wird (optional)
 * @returns Ein Promise mit dem Ergebnis der Cloud Function
 */
export const createUserWithRole = async (
  email: string,
  password: string,
  displayName: string | null,
  role: string,
  clubId: string | null
) => {
  const createUserFunction = httpsCallable(functions, 'createUserWithRole');
  
  try {
    const result = await createUserFunction({
      email,
      password,
      displayName,
      role,
      clubId
    });
    
    return result.data as { success: boolean; message: string; uid?: string };
  } catch (error: any) {
    console.error('Fehler beim Erstellen des Benutzers:', error);
    throw new Error(error.message || 'Beim Erstellen des Benutzers ist ein Fehler aufgetreten.');
  }
};
