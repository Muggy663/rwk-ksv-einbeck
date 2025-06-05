"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface Shooter {
  id: string;
  name: string;
  teamName?: string;
  averageScore?: number;
}

interface ShooterComparisonSelectorProps {
  shooters: Shooter[];
  maxSelections?: number;
  onSelectionChange: (selectedShooters: Shooter[]) => void;
}

export function ShooterComparisonSelector({
  shooters,
  maxSelections = 6,
  onSelectionChange
}: ShooterComparisonSelectorProps) {
  const [selectedShooters, setSelectedShooters] = useState<Shooter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredShooters, setFilteredShooters] = useState<Shooter[]>(shooters);

  useEffect(() => {
    setFilteredShooters(
      shooters.filter(shooter => 
        shooter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (shooter.teamName && shooter.teamName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    );
  }, [shooters, searchQuery]);

  const toggleShooterSelection = (shooter: Shooter) => {
    const isSelected = selectedShooters.some(s => s.id === shooter.id);
    
    if (isSelected) {
      const newSelection = selectedShooters.filter(s => s.id !== shooter.id);
      setSelectedShooters(newSelection);
      onSelectionChange(newSelection);
    } else if (selectedShooters.length < maxSelections) {
      const newSelection = [...selectedShooters, shooter];
      setSelectedShooters(newSelection);
      onSelectionChange(newSelection);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Schützen für Vergleich auswählen (max. {maxSelections})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nach Schützen oder Teams suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Ausgewählte Schützen ({selectedShooters.length}/{maxSelections})</h4>
          <div className="flex flex-wrap gap-2">
            {selectedShooters.length > 0 ? (
              selectedShooters.map(shooter => (
                <Badge 
                  key={shooter.id} 
                  variant="default"
                  className="cursor-pointer"
                  onClick={() => toggleShooterSelection(shooter)}
                >
                  {shooter.name}
                  <span className="ml-1">✕</span>
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Keine Schützen ausgewählt</span>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[200px]">
          <div className="space-y-1">
            {filteredShooters.map(shooter => (
              <Button
                key={shooter.id}
                variant={selectedShooters.some(s => s.id === shooter.id) ? "default" : "outline"}
                size="sm"
                className="w-full justify-start mb-1"
                onClick={() => toggleShooterSelection(shooter)}
                disabled={!selectedShooters.some(s => s.id === shooter.id) && selectedShooters.length >= maxSelections}
              >
                <div className="flex justify-between w-full">
                  <span>{shooter.name}</span>
                  <div className="flex items-center">
                    {shooter.teamName && (
                      <span className="text-xs text-muted-foreground mr-2">{shooter.teamName}</span>
                    )}
                    {shooter.averageScore && (
                      <span className="text-xs font-medium">Ø {shooter.averageScore.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              </Button>
            ))}
            {filteredShooters.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                Keine Schützen gefunden
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}