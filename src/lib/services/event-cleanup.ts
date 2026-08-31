import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc, Timestamp, writeBatch } from 'firebase/firestore';

/**
 * Deaktiviert - Automatisches Löschen sollte über Firebase Functions erfolgen
 * @returns 0 (keine Löschung)
 */
export async function cleanupExpiredEvents(): Promise<number> {
  // Client-side Cleanup deaktiviert - sollte über Firebase Functions erfolgen
  // Grund: Sicherheit und Zuverlässigkeit
  return 0;
}
