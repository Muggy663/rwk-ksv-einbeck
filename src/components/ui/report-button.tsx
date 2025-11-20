// src/components/ui/report-button.tsx
"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Flag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/use-auth';

interface ReportButtonProps {
  targetType: 'user' | 'group' | 'competition' | 'profile';
  targetId: string;
  targetName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'destructive';
}

const reportReasons = {
  inappropriate_name: 'Unangemessener Name/Inhalt',
  spam: 'Spam oder wiederholte Nachrichten',
  harassment: 'Belästigung oder Mobbing',
  fake_profile: 'Gefälschtes Profil',
  cheating: 'Betrug bei Wettkämpfen',
  other: 'Sonstiges'
};

export function ReportButton({ 
  targetType, 
  targetId, 
  targetName, 
  size = 'sm',
  variant = 'ghost' 
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!reason || !user) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        targetType,
        targetId,
        targetName: targetName || 'Unbekannt',
        reason,
        description: description.trim(),
        reportedBy: user.uid,
        reporterEmail: user.email,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast({
        title: "Meldung eingereicht",
        description: "Vielen Dank für Ihre Meldung. Wir werden sie prüfen."
      });

      setOpen(false);
      setReason('');
      setDescription('');
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Meldung konnte nicht eingereicht werden.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Flag className="h-4 w-4 mr-1" />
          Melden
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Inhalt melden
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Grund der Meldung</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Grund auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reportReasons).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Zusätzliche Beschreibung (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Weitere Details zur Meldung..."
              rows={3}
            />
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Hinweis:</strong> Falsche Meldungen können zu Konsequenzen führen. 
              Melden Sie nur echte Verstöße gegen die Community-Richtlinien.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!reason || submitting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {submitting ? 'Wird gesendet...' : 'Melden'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}