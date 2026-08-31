import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Club } from '@/types/rwk';

interface MultiClubSelectorProps {
  clubs: Club[];
  selectedClubIds: string[];
  onSelectionChange: (clubIds: string[]) => void;
  disabled?: boolean;
}

export function MultiClubSelector({ 
  clubs, 
  selectedClubIds, 
  onSelectionChange, 
  disabled = false 
}: MultiClubSelectorProps) {
  const handleClubToggle = (clubId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedClubIds, clubId]);
    } else {
      onSelectionChange(selectedClubIds.filter(id => id !== clubId));
    }
  };

  const clearAll = () => onSelectionChange([]);
  const selectAll = () => onSelectionChange(clubs.map(c => c.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Vereine zuweisen ({selectedClubIds.length} ausgewählt)
        </Label>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={selectAll}
            disabled={disabled}
          >
            Alle
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={clearAll}
            disabled={disabled}
          >
            Keine
          </Button>
        </div>
      </div>
      
      {selectedClubIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedClubIds.map(clubId => {
            const club = clubs.find(c => c.id === clubId);
            return club ? (
              <Badge key={clubId} variant="secondary" className="text-xs">
                {club.name}
              </Badge>
            ) : null;
          })}
        </div>
      )}
      
      <ScrollArea className="h-32 border rounded-md p-2">
        <div className="space-y-2">
          {clubs.map(club => (
            <div key={club.id} className="flex items-center space-x-2">
              <Checkbox
                id={`club-${club.id}`}
                checked={selectedClubIds.includes(club.id)}
                onCheckedChange={(checked) => handleClubToggle(club.id, !!checked)}
                disabled={disabled}
              />
              <Label 
                htmlFor={`club-${club.id}`} 
                className="text-sm cursor-pointer flex-1"
              >
                {club.name}
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
