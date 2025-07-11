"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Clock, CheckCircle, XCircle, MessageSquare, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { protestService, Protest } from '@/lib/services/protest-service';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ProtestListProps {
  showAll?: boolean; // true für Admin-Ansicht, false für Benutzer-Ansicht
}

export function ProtestList({ showAll = false }: ProtestListProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [protests, setProtests] = useState<Protest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProtest, setSelectedProtest] = useState<Protest | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState<Protest['status']>('eingereicht');
  const [decision, setDecision] = useState('');
  const [decisionReason, setDecisionReason] = useState('');

  const isAdmin = user?.email === 'admin@rwk-einbeck.de';
  const isRundenwettkampfleiter = isAdmin; // Erweitern für spezifische Rundenwettkampfleiter

  useEffect(() => {
    loadProtests();
  }, [showAll, user]);

  const loadProtests = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let protestsData: Protest[];
      
      if (showAll && isRundenwettkampfleiter) {
        protestsData = await protestService.getAllProtests();
      } else {
        protestsData = await protestService.getUserProtests(user.email || '');
      }
      
      setProtests(protestsData);
    } catch (error) {
      console.error('Fehler beim Laden der Proteste:', error);
      toast({
        title: 'Fehler',
        description: 'Die Proteste konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (protestId: string) => {
    if (!isRundenwettkampfleiter) return;

    try {
      await protestService.updateProtestStatus(
        protestId,
        newStatus,
        user?.email,
        decision,
        decisionReason,
        user?.email
      );

      toast({
        title: 'Status aktualisiert',
        description: 'Der Protest-Status wurde erfolgreich aktualisiert.',
      });

      await loadProtests();
      setSelectedProtest(null);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Status:', error);
      toast({
        title: 'Fehler',
        description: 'Der Status konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    }
  };

  const handleAddComment = async (protestId: string) => {
    if (!newComment.trim()) return;

    try {
      await protestService.addComment(protestId, {
        authorEmail: user?.email || '',
        authorName: user?.displayName || user?.email || 'Unbekannt',
        content: newComment,
        isInternal: isRundenwettkampfleiter
      });

      toast({
        title: 'Kommentar hinzugefügt',
        description: 'Ihr Kommentar wurde erfolgreich hinzugefügt.',
      });

      setNewComment('');
      await loadProtests();
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Kommentars:', error);
      toast({
        title: 'Fehler',
        description: 'Der Kommentar konnte nicht hinzugefügt werden.',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: Protest['status']) => {
    switch (status) {
      case 'eingereicht':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Eingereicht</Badge>;
      case 'in_bearbeitung':
        return <Badge variant="default"><AlertTriangle className="w-3 h-3 mr-1" />In Bearbeitung</Badge>;
      case 'entschieden':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Entschieden</Badge>;
      case 'abgelehnt':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Abgelehnt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: Protest['priority']) => {
    switch (priority) {
      case 'hoch':
        return <Badge variant="destructive">Hoch</Badge>;
      case 'mittel':
        return <Badge variant="default">Mittel</Badge>;
      case 'niedrig':
        return <Badge variant="outline">Niedrig</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getCategoryLabel = (category: Protest['category']) => {
    switch (category) {
      case 'ergebnis': return 'Ergebnis-Einspruch';
      case 'verhalten': return 'Verhalten';
      case 'regelverstoß': return 'Regelverstoß';
      case 'sonstiges': return 'Sonstiges';
      default: return category;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Lade Proteste...</div>;
  }

  if (protests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {showAll ? 'Keine Proteste vorhanden.' : 'Sie haben noch keine Proteste eingereicht.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {protests.map((protest) => (
        <Card key={protest.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{protest.title}</CardTitle>
                <CardDescription>
                  {getCategoryLabel(protest.category)} • {protest.leagueName}
                  {protest.teamName && ` • ${protest.teamName}`}
                  {protest.shooterName && ` • ${protest.shooterName}`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {getPriorityBadge(protest.priority)}
                {getStatusBadge(protest.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Eingereicht von {protest.submittedByName} am {format(protest.submittedAt, 'dd.MM.yyyy HH:mm', { locale: de })}
              </p>
              <p>{protest.description}</p>
            </div>

            {protest.matchDate && (
              <p className="text-sm text-muted-foreground">
                Wettkampfdatum: {format(protest.matchDate, 'dd.MM.yyyy', { locale: de })}
              </p>
            )}

            {protest.decision && (
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-medium mb-2">Entscheidung:</h4>
                <p>{protest.decision}</p>
                {protest.decisionReason && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Begründung: {protest.decisionReason}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Entschieden von {protest.decidedBy} am {protest.decidedAt && format(protest.decidedAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                </p>
              </div>
            )}

            {/* Kommentare */}
            {protest.comments && protest.comments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Kommentare
                </h4>
                {protest.comments
                  .filter(comment => !comment.isInternal || isRundenwettkampfleiter)
                  .map((comment) => (
                    <div key={comment.id} className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3 h-3" />
                        <span className="text-sm font-medium">{comment.authorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(comment.createdAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                        </span>
                        {comment.isInternal && (
                          <Badge variant="outline" className="text-xs">Intern</Badge>
                        )}
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
              </div>
            )}

            {/* Rundenwettkampfleiter-Aktionen */}
            {isRundenwettkampfleiter && showAll && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Status ändern</Label>
                    <Select value={newStatus} onValueChange={(value: Protest['status']) => setNewStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eingereicht">Eingereicht</SelectItem>
                        <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                        <SelectItem value="entschieden">Entschieden</SelectItem>
                        <SelectItem value="abgelehnt">Abgelehnt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {(newStatus === 'entschieden' || newStatus === 'abgelehnt') && (
                    <>
                      <div>
                        <Label>Entscheidung</Label>
                        <Textarea
                          value={decision}
                          onChange={(e) => setDecision(e.target.value)}
                          placeholder="Entscheidung des Rundenwettkampfleiters..."
                          rows={2}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Begründung</Label>
                        <Textarea
                          value={decisionReason}
                          onChange={(e) => setDecisionReason(e.target.value)}
                          placeholder="Begründung der Entscheidung..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <Button onClick={() => handleStatusUpdate(protest.id!)}>
                  Status aktualisieren
                </Button>
              </div>
            )}

            {/* Kommentar hinzufügen */}
            <div className="border-t pt-4">
              <Label>Kommentar hinzufügen</Label>
              <div className="flex gap-2 mt-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ihr Kommentar..."
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={() => handleAddComment(protest.id!)}>
                  Senden
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}