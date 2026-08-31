"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Target, Users, CheckCircle, XCircle } from "lucide-react";
import { Duel } from "@/lib/services/duel-service";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface DuelCardProps {
  duel: Duel;
  currentUserId: string;
  onAccept?: (duelId: string) => void;
  onDecline?: (duelId: string) => void;
  onSubmitResult?: (duelId: string) => void;
}

export function DuelCard({ duel, currentUserId, onAccept, onDecline, onSubmitResult }: DuelCardProps) {
  const isChallenger = duel.challengerId === currentUserId;
  const hasSubmittedResult = isChallenger ? !!duel.challengerResult : !!duel.challengedResult;
  const otherHasSubmittedResult = isChallenger ? !!duel.challengedResult : !!duel.challengerResult;

  const getStatusBadge = () => {
    switch (duel.status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">Ausstehend</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="text-blue-600">Angenommen</Badge>;
      case 'active':
        return <Badge variant="outline" className="text-green-600">Aktiv</Badge>;
      case 'finished':
        return <Badge variant="outline" className="text-gray-600">Beendet</Badge>;
      case 'declined':
        return <Badge variant="outline" className="text-red-600">Abgelehnt</Badge>;
      default:
        return null;
    }
  };

  const getResultDisplay = () => {
    if (duel.status !== 'finished') return null;

    const challengerScore = duel.challengerResult?.totalScore || 0;
    const challengedScore = duel.challengedResult?.totalScore || 0;

    if (duel.winner === 'tie') {
      return (
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Trophy className="h-6 w-6 mx-auto mb-2 text-gray-600" />
          <p className="font-semibold">Unentschieden</p>
          <p className="text-sm text-muted-foreground">
            {challengerScore} : {challengedScore} Ringe
          </p>
        </div>
      );
    }

    const isWinner = duel.winner === currentUserId;
    return (
      <div className={`text-center p-3 rounded-lg ${isWinner ? 'bg-green-50' : 'bg-red-50'}`}>
        <Trophy className={`h-6 w-6 mx-auto mb-2 ${isWinner ? 'text-green-600' : 'text-red-600'}`} />
        <p className="font-semibold">
          {isWinner ? 'Gewonnen! 🏆' : 'Verloren'}
        </p>
        <p className="text-sm text-muted-foreground">
          {challengerScore} : {challengedScore} Ringe
        </p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            {duel.discipline}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Duell-Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Disziplin</p>
            <p className="font-medium">{duel.discipline}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Schusszahl</p>
            <p className="font-medium">{duel.shotCount} Schuss</p>
          </div>
        </div>

        {/* Zeitstempel */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            Erstellt {formatDistanceToNow(new Date(duel.createdAt), { addSuffix: true, locale: de })}
          </span>
        </div>

        {/* Ergebnis-Anzeige */}
        {getResultDisplay()}

        {/* Status-spezifische Aktionen */}
        {duel.status === 'pending' && !isChallenger && (
          <div className="flex gap-2">
            <Button 
              onClick={() => onAccept?.(duel.id)} 
              className="flex-1"
              variant="default"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Annehmen
            </Button>
            <Button 
              onClick={() => onDecline?.(duel.id)} 
              variant="outline"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Ablehnen
            </Button>
          </div>
        )}

        {(duel.status === 'accepted' || duel.status === 'active') && !hasSubmittedResult && (
          <Button 
            onClick={() => onSubmitResult?.(duel.id)} 
            className="w-full"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Ergebnis einreichen
          </Button>
        )}

        {(duel.status === 'accepted' || duel.status === 'active') && hasSubmittedResult && (
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="font-semibold text-blue-900">Ergebnis eingereicht</p>
            <p className="text-sm text-blue-700">
              {otherHasSubmittedResult 
                ? 'Warten auf Auswertung...' 
                : 'Warten auf Gegner-Ergebnis...'
              }
            </p>
          </div>
        )}

        {duel.status === 'pending' && isChallenger && (
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <p className="font-semibold text-yellow-900">Herausforderung gesendet</p>
            <p className="text-sm text-yellow-700">
              Warten auf Antwort des Gegners...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
