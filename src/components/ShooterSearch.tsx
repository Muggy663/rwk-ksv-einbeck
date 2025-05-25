import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import type { Shooter } from '@/types/rwk';

interface ShooterSearchProps {
  shooters: Shooter[];
  selectedShooterIds: string[];
  onShooterSelect: (shooterId: string, isChecked: boolean) => void;
  isLoading: boolean;
  maxShooters: number;
  disabledShooters?: {
    [key: string]: { disabled: boolean; reason: string }
  };
  activeClubName?: string | null;
}

export function ShooterSearch({
  shooters,
  selectedShooterIds,
  onShooterSelect,
  isLoading,
  maxShooters,
  disabledShooters = {},
  activeClubName
}: ShooterSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredShooters = shooters.filter(shooter => {
    if (!shooter || !shooter.name) return false;
    if (!searchQuery.trim()) return true;
    return shooter.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 h-40 border rounded-md bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="ml-2">Lade Schützen...</p>
      </div>
    );
  }

  if (shooters.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 h-40 border rounded-md flex items-center justify-center bg-muted/30">
        <p>
          {activeClubName 
            ? `Keine Schützen für '${activeClubName}' verfügbar.` 
            : 'Keine Schützen verfügbar.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-2">
        <Input
          type="search"
          placeholder="Schützen suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      
      <ScrollArea className="h-40 rounded-md border p-3 bg-background">
        <div className="space-y-1">
          {filteredShooters.length > 0 ? (
            filteredShooters.map(shooter => {
              if (!shooter || !shooter.id) return null;
              const isSelected = selectedShooterIds.includes(shooter.id);
              const shooterInfo = disabledShooters[shooter.id] || { disabled: false, reason: '' };
              const isDisabled = shooterInfo.disabled || (!isSelected && selectedShooterIds.length >= maxShooters);
              
              return (
                <div key={shooter.id} className="flex items-center space-x-3 p-1.5 hover:bg-muted/50 rounded-md">
                  <Checkbox
                    id={`shooter-select-${shooter.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => onShooterSelect(shooter.id, !!checked)}
                    disabled={isDisabled}
                  />
                  <Label 
                    htmlFor={`shooter-select-${shooter.id}`} 
                    className={`font-normal cursor-pointer flex-grow ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {shooter.name}
                    <span className="text-xs text-muted-foreground block">(Schnitt Vorjahr: folgt)</span>
                    {isDisabled && shooterInfo.reason && (
                      <span className="text-xs text-destructive ml-1">{shooterInfo.reason}</span>
                    )}
                    {isDisabled && !shooterInfo.reason && (
                      <span className="text-xs text-destructive ml-1">(Max. Schützen erreicht)</span>
                    )}
                  </Label>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Keine Schützen gefunden, die "{searchQuery}" enthalten.
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}