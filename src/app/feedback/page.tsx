"use client";
import { useState, useEffect } from 'react';
import { BackButton } from '@/components/ui/back-button';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Star, User } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';

export default function FeedbackPage() {
  const [publicFeedbacks, setPublicFeedbacks] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadPublicFeedbacks();
  }, []);

  const loadPublicFeedbacks = async () => {
    try {
      const q = query(
        collection(db, 'feedback'),
        where('showPublicly', '==', true),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPublicFeedbacks(data);

      // Berechne Durchschnittsbewertung
      const allQ = query(collection(db, 'feedback'));
      const allSnapshot = await getDocs(allQ);
      const ratings = allSnapshot.docs
        .map(doc => doc.data().rating)
        .filter(r => r > 0);
      
      if (ratings.length > 0) {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        setAvgRating(Math.round(avg * 10) / 10);
        setTotalCount(ratings.length);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Feedbacks:', error);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div className="flex items-center space-x-3">
        <BackButton className="mr-2" fallbackHref="/" />
        <MessageSquare className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold text-primary">Feedback</h1>
          <p className="text-lg text-muted-foreground">
            Teile uns deine Meinung mit
          </p>
        </div>
      </div>

      {/* Durchschnittsbewertung */}
      {totalCount > 0 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-4">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-8 w-8 ${
                      i < Math.round(avgRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{avgRating}</div>
                <div className="text-sm text-muted-foreground">
                  aus {totalCount} Bewertung{totalCount !== 1 ? 'en' : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <FeedbackWidget />

      {/* Öffentliche Feedbacks */}
      {publicFeedbacks.length > 0 && (
        <div className="space-y-4">
          <Separator />
          <h2 className="text-2xl font-bold text-primary">Was andere sagen</h2>
          <div className="space-y-4">
            {publicFeedbacks.map((fb) => (
              <Card key={fb.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {fb.rating > 0 && (
                        <div className="flex">
                          {Array.from({ length: fb.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      )}
                      {(fb.name || fb.club) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            {fb.name}
                            {fb.name && fb.club && ' • '}
                            {fb.club}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {fb.timestamp?.toDate?.()?.toLocaleDateString('de-DE') || ''}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{fb.feedback}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
