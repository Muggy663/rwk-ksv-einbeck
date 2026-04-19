import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

export type LoginEventType = 'success' | 'failed' | 'blocked';

export interface LoginEvent {
  id?: string;
  type: LoginEventType;
  email: string;
  timestamp: Timestamp;
  errorCode?: string;
  userAgent?: string;
}

export async function logLoginEvent(type: LoginEventType, email: string, errorCode?: string) {
  try {
    await addDoc(collection(db, 'login_events'), {
      type,
      email: email.toLowerCase(),
      timestamp: Timestamp.now(),
      errorCode: errorCode || null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 100) : null,
    });
  } catch {
    // Fehler beim Logging soll Login nicht blockieren
  }
}

export async function getLoginStats(days = 7) {
  const since = Timestamp.fromDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

  const q = query(
    collection(db, 'login_events'),
    where('timestamp', '>=', since),
    orderBy('timestamp', 'desc'),
    limit(200)
  );

  const snap = await getDocs(q);
  const events = snap.docs.map(d => ({ id: d.id, ...d.data() } as LoginEvent));

  const success = events.filter(e => e.type === 'success').length;
  const failed = events.filter(e => e.type === 'failed').length;
  const blocked = events.filter(e => e.type === 'blocked').length;

  const failedReasons: Record<string, number> = {};
  events.filter(e => e.type === 'failed' && e.errorCode).forEach(e => {
    failedReasons[e.errorCode!] = (failedReasons[e.errorCode!] || 0) + 1;
  });

  const blockedReasons: Record<string, number> = {};
  events.filter(e => e.type === 'blocked' && e.errorCode).forEach(e => {
    blockedReasons[e.errorCode!] = (blockedReasons[e.errorCode!] || 0) + 1;
  });
  // Unique E-Mails mit Fehlversuchen
  const failedByEmail: Record<string, number> = {};
  events.filter(e => e.type === 'failed' || e.type === 'blocked').forEach(e => {
    failedByEmail[e.email] = (failedByEmail[e.email] || 0) + 1;
  });

  const suspiciousAccounts = Object.entries(failedByEmail)
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([email, count]) => ({ email, count }));

  const recent = events.slice(0, 10);

  return { success, failed, blocked, failedReasons, blockedReasons, suspiciousAccounts, recent, total: events.length };
}
