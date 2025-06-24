"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, User, Settings } from 'lucide-react';
import type { Team, Club, League, Season, Shooter } from '@/types/rwk';

interface MobileTeamFormProps {
  currentTeam: Partial<Team> & { id?: string };
  formMode: 'new' | 'edit';
  allClubs: Club[];
  allSeasons: Season[];
  availableLeagues: League[];
  availableShooters: Shooter[];
  selectedShooterIds: string[];
  isLoading: boolean;
  onTeamChange: (field: string, value: any) => void;
  onShooterToggle: (shooterId: string, checked: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function MobileTeamForm({
  currentTeam,
  formMode,
  allClubs,
  allSeasons,
  availableLeagues,
  availableShooters,
  selectedShooterIds,
  isLoading,
  onTeamChange,
  onShooterToggle,
  onSubmit,
  onCancel
}: MobileTeamFormProps) {
  const [activeTab, setActiveTab] = useState('basic');

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex-shrink-0 p-4 border-b">
        <h2 className="text-lg font-semibold">
          {formMode === 'new' ? 'Neue Mannschaft' : 'Mannschaft bearbeiten'}
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
          <TabsTrigger value="basic" className="text-xs">
            <Settings className="h-4 w-4 mr-1" />
            Basis
          </TabsTrigger>
          <TabsTrigger value="shooters" className="text-xs">
            <Users className="h-4 w-4 mr-1" />
            Schützen
          </TabsTrigger>
          <TabsTrigger value="contact" className="text-xs">
            <User className="h-4 w-4 mr-1" />
            Kontakt
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="basic" className="h-full m-0">
            <ScrollArea className="h-full px-4">
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Mannschaftsname</Label>
                  <Input
                    id="name"
                    value={currentTeam.name || ''}
                    onChange={(e) => onTeamChange('name', e.target.value)}
                    placeholder="z.B. Mannschaft I"
                  />
                </div>

                <div>
                  <Label htmlFor="club">Verein</Label>
                  <Select
                    value={currentTeam.clubId || ''}
                    onValueChange={(value) => onTeamChange('clubId', value)}
                    disabled={formMode === 'edit'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Verein wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {allClubs.map(club => (
                        <SelectItem key={club.id} value={club.id}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="discipline">Disziplin</Label>
                  <Select
                    value={currentTeam.leagueType || ''}
                    onValueChange={(value) => onTeamChange('leagueType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Disziplin wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KKG">Kleinkaliber Gewehr</SelectItem>
                      <SelectItem value="KKP">Kleinkaliber Pistole</SelectItem>
                      <SelectItem value="LGA">Luftgewehr Auflage</SelectItem>
                      <SelectItem value="LGS">Luftgewehr Freihand</SelectItem>
                      <SelectItem value="LP">Luftpistole</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="league">Liga</Label>
                  <Select
                    value={currentTeam.leagueId || ''}
                    onValueChange={(value) => onTeamChange('leagueId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Liga wählen (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nicht zugewiesen</SelectItem>
                      {availableLeagues.map(league => (
                        <SelectItem key={league.id} value={league.id}>
                          {league.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-amber-50 rounded-md">
                  <Checkbox
                    id="outOfCompetition"
                    checked={currentTeam.outOfCompetition || false}
                    onCheckedChange={(checked) => onTeamChange('outOfCompetition', checked)}
                  />
                  <Label htmlFor="outOfCompetition" className="text-sm">
                    Außer Konkurrenz
                  </Label>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="shooters" className="h-full m-0">
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0 p-4 border-b">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Schützen auswählen</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedShooterIds.length} / 8 ausgewählt
                  </span>
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Lade Schützen...</span>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {availableShooters.map(shooter => (
                      <Card key={shooter.id} className="p-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedShooterIds.includes(shooter.id)}
                            onCheckedChange={(checked) => onShooterToggle(shooter.id, !!checked)}
                            disabled={!selectedShooterIds.includes(shooter.id) && selectedShooterIds.length >= 8}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{shooter.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Schnitt Vorjahr: folgt
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="h-full m-0">
            <ScrollArea className="h-full px-4">
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="captainName">Name Mannschaftsführer</Label>
                  <Input
                    id="captainName"
                    value={currentTeam.captainName || ''}
                    onChange={(e) => onTeamChange('captainName', e.target.value)}
                    placeholder="Max Mustermann"
                  />
                </div>

                <div>
                  <Label htmlFor="captainEmail">E-Mail</Label>
                  <Input
                    id="captainEmail"
                    type="email"
                    value={currentTeam.captainEmail || ''}
                    onChange={(e) => onTeamChange('captainEmail', e.target.value)}
                    placeholder="max@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="captainPhone">Telefon</Label>
                  <Input
                    id="captainPhone"
                    type="tel"
                    value={currentTeam.captainPhone || ''}
                    onChange={(e) => onTeamChange('captainPhone', e.target.value)}
                    placeholder="0123 456789"
                  />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex-shrink-0 p-4 border-t bg-background">
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Abbrechen
          </Button>
          <Button onClick={onSubmit} className="flex-1" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </div>
      </div>
    </div>
  );
}