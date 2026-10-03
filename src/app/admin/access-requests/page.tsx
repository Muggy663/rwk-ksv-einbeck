"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { authFetch } from '@/lib/auth/authFetch';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/utils/secure-logger';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyRound, Loader2, Check, X } from 'lucide-react';

interface AccessRequest {
  id: string;
  uid: string;
  email: string;
  displayName?: string | null;
  clubId: string;
  clubName: string;
  requestedClubRole: 'SPORTLEITER' | 'MANNSCHAFTSFUEHRER';
  message?: string | null;
  status: 'neu' | 'genehmigt' | 'abgelehnt';
  createdAt?: any;
  rejectReason?: string | null;
}

const ROLLE_LABEL: Record<string, string> = {
  SPORTLEITER: 'Sportleiter',
  MANNSCHAFTSFUEHRER: 'Mannschaftsführer',
};

export default function AccessRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('neu');
  const [working, setWorking] = useState<string | null>(null);

  const laden = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'access_requests'), orderBy('createdAt', 'desc')));
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AccessRequest)));
    } catch (error) {
      logError('Fehler beim Laden der Zugangs-Anträge:', error);
      toast({ title: 'Fehler', description: 'Anträge konnten nicht geladen werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    laden();
  }, [laden]);

  const bearbeiten = async (req: AccessRequest, action: 'approve' | 'reject') => {
    if (action === 'reject' && !confirm(`Antrag von ${req.displayName || req.email} wirklich ablehnen?`)) return;
    setWorking(req.id);
    try {
      const res = await authFetch('/api/admin/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: req.id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Aktion fehlgeschlagen.');
      toast({
        title: action === 'approve' ? '✅ Genehmigt' : 'Abgelehnt',
        description: action === 'approve'
          ? `${req.displayName || req.email} hat jetzt die Rolle „${ROLLE_LABEL[req.requestedClubRole]}" für ${req.clubName}.`
          : 'Der Antrag wurde abgelehnt.',
      });
      await laden();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message || 'Aktion fehlgeschlagen.', variant: 'destructive' });
    } finally {
      setWorking(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'neu': return <Badge className="bg-blue-100 text-blue-800">Neu</Badge>;
      case 'genehmigt': return <Badge className="bg-green-100 text-green-800">Genehmigt</Badge>;
      case 'abgelehnt': return <Badge variant="outline" className="text-muted-foreground">Abgelehnt</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const gefiltert = activeTab === 'alle' ? requests : requests.filter((r) => r.status === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <KeyRound className="mr-2 h-7 w-7" /> Vereinszugang-Anträge
        </h1>
        <p className="text-muted-foreground">
          Anträge auf eine RWK/KM-Vereinsrolle prüfen und freischalten.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="neu">Neu</TabsTrigger>
          <TabsTrigger value="genehmigt">Genehmigt</TabsTrigger>
          <TabsTrigger value="abgelehnt">Abgelehnt</TabsTrigger>
          <TabsTrigger value="alle">Alle</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Anträge</CardTitle>
          <CardDescription>
            Beim Genehmigen wird die Rolle automatisch in der Benutzerverwaltung gesetzt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <p>Lade Anträge …</p>
            </div>
          ) : gefiltert.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Verein</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Begründung</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gefiltert.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="whitespace-nowrap">
                      {req.createdAt?.toDate ? format(req.createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: de }) : '-'}
                    </TableCell>
                    <TableCell>{req.displayName || '—'}</TableCell>
                    <TableCell>
                      <a href={`mailto:${req.email}`} className="text-primary hover:underline">{req.email}</a>
                    </TableCell>
                    <TableCell>{req.clubName}</TableCell>
                    <TableCell>{ROLLE_LABEL[req.requestedClubRole] || req.requestedClubRole}</TableCell>
                    <TableCell className="max-w-[220px] text-sm text-muted-foreground truncate" title={req.message || ''}>
                      {req.message || '—'}
                    </TableCell>
                    <TableCell>{statusBadge(req.status)}</TableCell>
                    <TableCell>
                      {req.status === 'neu' ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => bearbeiten(req, 'approve')}
                            disabled={working === req.id}
                          >
                            {working === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Genehmigen</>}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => bearbeiten(req, 'reject')}
                            disabled={working === req.id}
                          >
                            <X className="h-4 w-4 mr-1" /> Ablehnen
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {req.status === 'genehmigt' ? 'erledigt' : (req.rejectReason || 'abgelehnt')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <KeyRound className="mx-auto h-10 w-10 mb-3 text-primary/70" />
              <p>Keine Anträge in dieser Ansicht.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
