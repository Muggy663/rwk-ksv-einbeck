import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

/**
 * @typedef {Object} UpdateEntry
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {Date} date
 * @property {string} version
 * @property {string} category
 */

/**
 * Lädt die neuesten Updates
 * @param {number} [limitCount=10] - Maximale Anzahl der zu ladenden Updates
 * @returns {Promise<UpdateEntry[]>} Liste der Updates
 */
export async function fetchUpdates(limitCount = 10) {
  try {
    const updatesQuery = query(
      collection(db, 'updates'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(updatesQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
        version: data.version || '',
        category: data.category || 'allgemein'
      };
    });
  } catch (error) {
    console.error('Fehler beim Laden der Updates:', error);
    return [];
  }
}