"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Clock, Users, Key, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc, orderBy, Timestamp } from 'firebase/firestore';
import { useAuthContext } from '@/components/auth/AuthContext';
import Link from 'next/link';

interface SupportSession {
  id: string;
  clubId: string;
  clubName: string;
  supportCode: string;
  adminUid: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
  createdByName: string;
  isActive: boolean;
  accessLog: Array<{
    timestamp: Timestamp;
    action: string;
    details?: string;
  }>;
}

export default function SupportAccessPage() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [supportCode, setSupportCode] = useState('');
  const [activeSessions, setActiveSessions] = useState<SupportSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentClubAccess, setCurrentClubAccess] = useState<string | null>(null);

  useEffect(() => {
    loadActiveSessions();
    checkCurrentAccess();
  }, [user]);

  const loadActiveSessions = async () => {
    if (!user) return;

    try {
      const sessionsQuery = query(
        collection(db, 'support_sessions'),
        where('adminUid', '==', user.uid),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(sessionsQuery);
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportSession[];

      // Prüfe Ablaufzeiten
      const now = new Date();
      const validSessions = sessions.filter(session => {
        const expiresAt = session.expiresAt.toDate();
        return expiresAt > now;
      });

      // Deaktiviere abgelaufene Sessions
      for (const session of sessions) {
        const expiresAt = session.expiresAt.toDate();
        if (expiresAt <= now && session.isActive) {
          await updateDoc(doc(db, 'support_sessions', session.id), {
            isActive: false,
            endedAt: Timestamp.now(),
            endReason: 'expired'
          });
        }
      }

      setActiveSessions(validSessions);
    } catch (error) {
      console.error('Fehler beim Laden der Support-Sessions:', error);
    }
  };

  const checkCurrentAccess = async () => {
    if (!user) return;

    try {
      // Prüfe ob aktuell eine aktive Session existiert
      const userPermissionsDoc = await getDoc(doc(db, 'user_permissions', user.uid));
      if (userPermissionsDoc.exists()) {
        const data = userPermissionsDoc.data();
        if (data.supportClubAccess && data.supportClubAccess.expiresAt.toDate() > new Date()) {
          setCurrentClubAccess(data.supportClubAccess.clubId);
        }
      }
    } catch (error) {
      console.error('Fehler beim Prüfen des aktuellen Zugangs:', error);
    }
  };

  const activateSupport = async () => {
    if (!supportCode.trim() || !user) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen Support-Code ein.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Suche nach gültigem Support-Code
      const sessionsQuery = query(
        collection(db, 'support_sessions'),
        where('supportCode', '==', supportCode.toUpperCase()),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(sessionsQuery);
      
      if (snapshot.empty) {
        toast({
          title: 'Ungültiger Code',
          description: 'Support-Code nicht gefunden oder bereits abgelaufen.',
          variant: 'destructive'
        });
        return;
      }

      const sessionDoc = snapshot.docs[0];
      const session = sessionDoc.data() as SupportSession;

      // Prüfe Ablaufzeit
      const now = new Date();
      const expiresAt = session.expiresAt.toDate();
      
      if (expiresAt <= now) {
        toast({
          title: 'Code abgelaufen',
          description: 'Dieser Support-Code ist bereits abgelaufen.',
          variant: 'destructive'
        });
        return;
      }

      // Aktiviere Support-Zugang
      await updateDoc(doc(db, 'user_permissions', user.uid), {
        supportClubAccess: {
          clubId: session.clubId,
          sessionId: sessionDoc.id,
          expiresAt: session.expiresAt,
          activatedAt: Timestamp.now()
        }
      });

      // Protokolliere Zugriff
      const accessLog = session.accessLog || [];
      accessLog.push({
        timestamp: Timestamp.now(),
        action: 'support_activated',
        details: `Support-Zugang aktiviert von ${user.email}`
      });

      await updateDoc(doc(db, 'support_sessions', sessionDoc.id), {
        accessLog,
        lastAccessAt: Timestamp.now()
      });

      setCurrentClubAccess(session.clubId);
      setSupportCode('');
      
      toast({
        title: 'Support-Zugang aktiviert',
        description: `Sie haben jetzt Zugang zu ${session.clubName} bis ${expiresAt.toLocaleString('de-DE')}.`
      });

      await loadActiveSessions();
    } catch (error) {
      console.error('Fehler beim Aktivieren des Support-Zugangs:', error);
      toast({
        title: 'Fehler',
        description: 'Support-Zugang konnte nicht aktiviert werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deactivateSupport = async (sessionId: string) => {
    if (!user) return;

    try {
      // Entferne Support-Zugang
      await updateDoc(doc(db, 'user_permissions', user.uid), {
        supportClubAccess: null
      });

      // Protokolliere Deaktivierung
      const sessionDoc = await getDoc(doc(db, 'support_sessions', sessionId));
      if (sessionDoc.exists()) {
        const session = sessionDoc.data() as SupportSession;
        const accessLog = session.accessLog || [];
        accessLog.push({
          timestamp: Timestamp.now(),
          action: 'support_deactivated',
          details: `Support-Zugang beendet von ${user.email}`
        });

        await updateDoc(doc(db, 'support_sessions', sessionId), {
          accessLog,
          isActive: false,
          endedAt: Timestamp.now(),
          endReason: 'manual_deactivation'
        });
      }

      setCurrentClubAccess(null);
      
      toast({
        title: 'Support-Zugang beendet',
        description: 'Der Support-Zugang wurde erfolgreich beendet.'
      });

      await loadActiveSessions();
    } catch (error) {
      console.error('Fehler beim Beenden des Support-Zugangs:', error);
      toast({
        title: 'Fehler',
        description: 'Support-Zugang konnte nicht beendet werden.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Support-Zugang
          </h1>
          <p className="text-muted-foreground mt-2">
            Temporärer Zugang zu Vereinsdaten für Support-Zwecke
          </p>
        </div>
        <Link href="/dashboard-auswahl">
          <Button variant="outline">Zurück zum Dashboard</Button>
        </Link>
      </div>

      {/* Aktueller Zugang */}
      {currentClubAccess && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Aktiver Support-Zugang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Zugang zu Verein aktiv</p>
                <p className="text-sm text-green-700">
                  Sie können jetzt auf die Vereinssoftware zugreifen
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/vereinssoftware">
                  <Button>Zur Vereinssoftware</Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const activeSession = activeSessions.find(s => s.clubId === currentClubAccess);
                    if (activeSession) deactivateSupport(activeSession.id);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Zugang beenden
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Support-Code eingeben */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Support-Code eingeben
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="supportCode">6-stelliger Support-Code</Label>
              <Input
                id="supportCode"
                value={supportCode}
                onChange={(e) => setSupportCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={activateSupport} 
                disabled={loading || !supportCode.trim()}
              >
                {loading ? 'Aktiviere...' : 'Zugang aktivieren'}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Der Verein muss Ihnen einen 6-stelligen Code mitteilen, um temporären Zugang zu gewähren.
          </p>
        </CardContent>
      </Card>

      {/* Aktive Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Support-Sessions ({activeSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Keine aktiven Support-Sessions
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Verein</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead>Läuft ab</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.clubName}</TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {session.supportCode}
                      </code>
                    </TableCell>
                    <TableCell>
                      {session.createdAt.toDate().toLocaleString('de-DE')}
                    </TableCell>
                    <TableCell>
                      {session.expiresAt.toDate().toLocaleString('de-DE')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-600">
                        Aktiv
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivateSupport(session.id)}
                      >
                        Beenden
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}