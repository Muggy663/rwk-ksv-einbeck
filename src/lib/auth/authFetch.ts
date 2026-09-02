// src/lib/auth/authFetch.ts
// Kleiner Client-Helper: fetch mit automatischem Firebase-ID-Token im Authorization-Header.
// Für Aufrufe an abgesicherte API-Routen (z.B. /api/shooters, /api/members).

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { auth } = await import('@/lib/firebase/config');
  const user = auth.currentUser;
  const headers = new Headers(init.headers || {});
  if (user) {
    const token = await user.getIdToken();
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
