// src/lib/auth/authFetch.ts
// Kleiner Client-Helper: fetch mit automatischem Firebase-ID-Token im Authorization-Header.
// Für Aufrufe an abgesicherte API-Routen (z.B. /api/shooters, /api/members, /api/km/*).

import type { User } from 'firebase/auth';

/**
 * Liefert den aktuell angemeldeten Nutzer. Wartet dabei kurz auf die
 * Firebase-Auth-Initialisierung, falls currentUser beim ersten Aufruf
 * (z.B. direkt nach dem Laden einer Seite) noch nicht gesetzt ist.
 * Sonst gingen Requests ohne Token raus → 401.
 */
async function getCurrentUserOrWait(): Promise<User | null> {
  const { auth } = await import('@/lib/firebase/config');
  if (auth.currentUser) return auth.currentUser;

  return new Promise<User | null>((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(auth.currentUser);
    }, 3000);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const user = await getCurrentUserOrWait();
  const headers = new Headers(init.headers || {});
  if (user) {
    const token = await user.getIdToken();
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
