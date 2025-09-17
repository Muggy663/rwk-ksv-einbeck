"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Key, Clock, AlertTriangle, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useAuthContext } from '@/components/auth/AuthContext';
import { useClubId } from '@/hooks/useClubId';

interface SupportSession {
  id: string;
  clubId: string;
  supportCode: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  isActive: boolean;
}

export default function SupportPage() {
  const { user } = useAuthContext();
  const { clubId } = useClubId();
  const { toast } = useToast();
  const [activeSession, setActiveSession] = useState<SupportSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [clubName, setClubName] = useState('');

  useEffect(() => {
    if (clubId) {
      loadActiveSession();
      loadClubName();
    }
  }, [clubId]);

  const loadClubName = async () => {
    if (!clubId) return;
    
    try {
      const clubDoc = await getDoc(doc(db, 'clubs', clubId));
      if (clubDoc.exists()) {
        setClubName(clubDoc.data().name || 'Unbekannter Verein');
      }
    } catch (error) {
      console.error('Fehler beim Laden des Vereinsnamens:', error);
    }
  };

  const loadActiveSession = async () => {
    if (!clubId) return;

    try {
      const sessionsQuery = query(
        collection(db, 'support_sessions'),
        where('clubId', '==', clubId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(sessionsQuery);
      
      if (!snapshot.empty) {
        const sessionData = snapshot.docs[0].data() as SupportSession;
        const session = {
          id: snapshot.docs[0].id,
          ...sessionData
        };

        // Prüfe ob noch gültig
        const now = new Date();
        const expiresAt = session.expiresAt.toDate();
        
        if (expiresAt > now) {
          setActiveSession(session);
        } else {
          // Session abgelaufen, deaktiviere sie
          await updateDoc(doc(db, 'support_sessions', session.id), {
            isActive: false,
            endedAt: Timestamp.now(),
            endReason: 'expired'
          });
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Support-Session:', error);
    }
  };

  const generateSupportCode = async () => {
    if (!clubId || !user) return;

    setLoading(true);

    try {
      // Deaktiviere alte Sessions
      const oldSessionsQuery = query(
        collection(db, 'support_sessions'),
        where('clubId', '==', clubId),
        where('isActive', '==', true)
      );
      
      const oldSessions = await getDocs(oldSessionsQuery);
      for (const sessionDoc of oldSessions.docs) {
        await updateDoc(doc(db, 'support_sessions', sessionDoc.id), {
          isActive: false,
          endedAt: Timestamp.now(),
          endReason: 'new_session_created'
        });
      }

      // Generiere neuen 6-stelligen Code
      const supportCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Erstelle neue Session (24h gültig)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const sessionData = {
        clubId,
        clubName,
        supportCode,
        adminUid: 'nr4qSNvqUoZvtD9tUSPhhiQmMWj2', // Super-Admin UID
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: Timestamp.now(),
        createdBy: user.uid,
        createdByName: user.displayName || user.email || 'Unbekannt',
        isActive: true,
        accessLog: [{
          timestamp: Timestamp.now(),
          action: 'session_created',
          details: `Support-Code generiert von ${user.email}`
        }]
      };

      const docRef = await addDoc(collection(db, 'support_sessions'), sessionData);
      
      setActiveSession({
        id: docRef.id,
        ...sessionData
      });

      toast({
        title: 'Support-Code generiert',
        description: `Code ${supportCode} ist 24 Stunden gültig.`
      });

    } catch (error) {
      console.error('Fehler beim Generieren des Support-Codes:', error);
      toast({
        title: 'Fehler',
        description: 'Support-Code konnte nicht generiert werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = async () => {
    if (!activeSession) return;

    try {
      await navigator.clipboard.writeText(activeSession.supportCode);
      toast({
        title: 'Code kopiert',
        description: 'Support-Code wurde in die Zwischenablage kopiert.'
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Code konnte nicht kopiert werden.',
        variant: 'destructive'
      });
    }
  };

  const deactivateSession = async () => {
    if (!activeSession) return;

    try {
      await updateDoc(doc(db, 'support_sessions', activeSession.id), {
        isActive: false,
        endedAt: Timestamp.now(),
        endReason: 'user_deactivated'
      });

      setActiveSession(null);
      
      toast({
        title: 'Support-Code deaktiviert',
        description: 'Der Support-Code wurde erfolgreich deaktiviert.'
      });
    } catch (error) {
      console.error('Fehler beim Deaktivieren:', error);
      toast({
        title: 'Fehler',
        description: 'Support-Code konnte nicht deaktiviert werden.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Support anfordern
        </h1>
        <p className="text-muted-foreground mt-2">
          Temporären Zugang für das Support-Team generieren
        </p>
      </div>

      {/* DSGVO-Hinweis */}
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Datenschutz-Hinweis:</strong> Der Support-Code gewährt dem Support-Team 24 Stunden lang 
          Zugang zu Ihren Vereinsdaten. Alle Zugriffe werden protokolliert. 
          Der Code kann jederzeit deaktiviert werden.
        </AlertDescription>
      </Alert>

      {activeSession ? (
        /* Aktiver Support-Code */
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Support-Code aktiv
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-green-800 bg-white p-4 rounded-lg border-2 border-green-300">
                {activeSession.supportCode}
              </div>
              <p className="text-sm text-green-700 mt-2">
                Teilen Sie diesen Code mit dem Support-Team
              </p>
            </div>
            
            <div className="flex justify-center gap-2">
              <Button onClick={copyCodeToClipboard} variant="outline">
                <Copy className="mr-2 h-4 w-4" />
                Code kopieren
              </Button>
              <Button onClick={deactivateSession} variant="destructive">
                Code deaktivieren
              </Button>
            </div>

            <div className="text-center text-sm text-green-700">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                Läuft ab: {activeSession.expiresAt.toDate().toLocaleString('de-DE')}
              </div>
              <p className="mt-1">
                Erstellt: {activeSession.createdAt.toDate().toLocaleString('de-DE')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Support-Code generieren */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Support-Code generieren
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Benötigen Sie Hilfe?</h3>
              <p className="text-muted-foreground mb-6">
                Generieren Sie einen temporären Support-Code für das Support-Team.
                Der Code ist 24 Stunden gültig und kann jederzeit deaktiviert werden.
              </p>
              
              <Button 
                onClick={generateSupportCode} 
                disabled={loading}
                size="lg"
              >
                <Key className="mr-2 h-5 w-5" />
                {loading ? 'Generiere Code...' : 'Support-Code generieren'}
              </Button>
            </div>

            <div className="bg-muted p-4 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">So funktioniert's:</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Support-Code generieren (24h gültig)</li>
                <li>Code an Support-Team senden (rwk-leiter-ksve@gmx.de)</li>
                <li>Support-Team kann temporär auf Ihre Daten zugreifen</li>
                <li>Code läuft automatisch ab oder kann deaktiviert werden</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}