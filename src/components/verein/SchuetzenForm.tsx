"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SchuetzenFormProps {
  clubId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SchuetzenForm({ clubId, onSuccess, onCancel }: SchuetzenFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthYear: '',
    gender: '',
    mitgliedsnummer: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/shooters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          clubId
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({ title: 'Erfolg', description: 'Schütze wurde angelegt' });
        onSuccess();
      } else {
        toast({ 
          title: 'Fehler', 
          description: result.error || 'Fehler beim Anlegen', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: 'Verbindungsfehler', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎯 Neuen Schützen anlegen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vorname *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nachname *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Geburtsjahr *</label>
              <input
                type="number"
                required
                min="1900"
                max="2030"
                value={formData.birthYear}
                onChange={(e) => setFormData({...formData, birthYear: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Geschlecht *</label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Bitte wählen</option>
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mitgliedsnummer</label>
            <input
              type="text"
              value={formData.mitgliedsnummer}
              onChange={(e) => setFormData({...formData, mitgliedsnummer: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Optional"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Wird angelegt...' : 'Schützen anlegen'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Abbrechen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}