"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Star, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/ui/back-button';

export default function AdminFeedbackPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email !== 'admin@rwk-einbeck.de') {
      router.push('/');
      return;
    }
    loadFeedbacks();
  }, [user, router]);

  const loadFeedbacks = async () => {
    try {
      const q = query(collection(db, 'feedback'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeedbacks(data);
    } catch (error) {
      toast({ title: 'Fehler', description: 'Feedbacks konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Feedback wirklich löschen?')) return;
    try {
      await deleteDoc(doc(db, 'feedback', id));
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      toast({ title: 'Gelöscht', description: 'Feedback wurde entfernt' });
    } catch (error) {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center space-x-3">
        <BackButton className="mr-2" fallbackHref="/admin" />
        <MessageSquare className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold text-primary">Feedback-Verwaltung</h1>
          <p className="text-lg text-muted-foreground">{feedbacks.length} Einträge</p>
        </div>
      </div>

      <div className="space-y-4">
        {feedbacks.map((feedback) => (
          <Card key={feedback.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {feedback.rating > 0 && (
                    <div className="flex">
                      {Array.from({ length: feedback.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {feedback.timestamp?.toDate?.()?.toLocaleString('de-DE') || 'Unbekannt'}
                  </span>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(feedback.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{feedback.feedback}</p>
            </CardContent>
          </Card>
        ))}
        {feedbacks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Noch keine Feedbacks vorhanden
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
