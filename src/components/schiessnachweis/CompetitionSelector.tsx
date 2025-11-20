'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { CompetitionsService, Competition } from '@/lib/services/competitions-service';

interface CompetitionSelectorProps {
  groupId: string;
  discipline: string;
  onCompetitionChange: (competitionId: string | null) => void;
}

export function CompetitionSelector({ groupId, discipline, onCompetitionChange }: CompetitionSelectorProps) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState('');

  useEffect(() => {
    if (groupId) {
      loadCompetitions();
    }
  }, [groupId]);

  const loadCompetitions = async () => {
    try {
      const groupCompetitions = await CompetitionsService.getGroupCompetitions(groupId);
      // Nur aktive Wettkämpfe anzeigen
      const activeCompetitions = groupCompetitions.filter(c => c.status === 'active');
      setCompetitions(activeCompetitions);
    } catch (error) {
      console.error('Error loading competitions:', error);
    }
  };

  const handleCompetitionChange = (competitionId: string) => {
    setSelectedCompetition(competitionId);
    onCompetitionChange(competitionId || null);
  };

  // Filtere Wettkämpfe nach Disziplin (falls angegeben)
  const filteredCompetitions = discipline 
    ? competitions.filter(c => c.discipline === discipline)
    : competitions;

  if (filteredCompetitions.length === 0) {
    return null; // Keine passenden Wettkämpfe
  }

  return (
    <div>
      <Label>Aktiver Wettkampf (optional)</Label>
      <NativeSelect
        value={selectedCompetition}
        onValueChange={handleCompetitionChange}
        placeholder="Keinen Wettkampf auswählen..."
        options={[
          { value: '', label: 'Kein Wettkampf' },
          ...filteredCompetitions.map(competition => ({
            value: competition.id!,
            label: `${competition.name} (${competition.discipline})`
          }))
        ]}
      />
      <p className="text-xs text-muted-foreground mt-1">
        {selectedCompetition 
          ? 'Ergebnis wird auch in den Wettkampf eingetragen'
          : 'Nur als Gruppen-Ergebnis speichern'}
      </p>
    </div>
  );
}