// Vereinfachte Version des Auth-Hooks für die Implementierung
// In einer vollständigen Implementierung würde dies mit Firebase Auth verbunden sein

import { useState, useEffect } from 'react';

type User = {
  uid: string;
  email: string;
  displayName?: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuliere einen eingeloggten Benutzer
    const mockUser: User = {
      uid: 'mock-user-id',
      email: 'admin@rwk-einbeck.de',
      displayName: 'Admin'
    };
    
    setUser(mockUser);
    setLoading(false);
  }, []);

  return { user, loading };
}