"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, History, Search, Filter, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AuditEntry {
  id: string;
  timestamp: Timestamp;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: {
    before?: any;
    after?: any;
    description?: string;
  };
  leagueId?: string;
  leagueName?: string;
  teamId?: string;
  teamName?: string;
  shooterId?: string;
  shooterName?: string;
}

interface AuditTrailProps {
  entityType?: string;
  entityId?: string;
  limit?: number;
  showFilters?: boolean;
}

export function AuditTrail({ 
  entityType, 
  entityId, 
  limit: entryLimit = 50, 
  showFilters = true 
}: AuditTrailProps) {
  const { toast } = useToast();
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Lade Audit-Einträge
  useEffect(() => {
    const fetchAuditEntries = async () => {
      setIsLoading(true);
      try {
        let auditQuery = collection(db, 'audit_logs');
        let queryConstraints = [];
        
        // Filter nach Entitätstyp und ID, falls angegeben
        if (entityType) {
          queryConstraints.push(where('entityType', '==', entityType));
        }
        if (entityId) {
          queryConstraints.push(where('entityId', '==', entityId));
        }
        
        // Sortierung und Limit
        queryConstraints.push(orderBy('timestamp', 'desc'));
        queryConstraints.push(limit(entryLimit));
        
        const q = query(auditQuery, ...queryConstraints);
        const snapshot = await getDocs(q);
        
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AuditEntry));
        
        setAuditEntries(entries);
        setFilteredEntries(entries);
      } catch (error) {
        console.error('Fehler beim Laden der Audit-Einträge:', error);
        toast({
          title: 'Fehler',
          description: 'Die Audit-Einträge konnten nicht geladen werden.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAuditEntries();
  }, [entityType, entityId, entryLimit, toast]);

  // Filtern der Einträge basierend auf Suchbegriff und Filtern
  useEffect(() => {
    let filtered = [...auditEntries];
    
    // Textsuche
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        (entry.userName?.toLowerCase().includes(lowerSearchTerm)) ||
        (entry.details?.description?.toLowerCase().includes(lowerSearchTerm)) ||
        (entry.teamName?.toLowerCase().includes(lowerSearchTerm)) ||
        (entry.shooterName?.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // Aktionsfilter
    if (actionFilter) {
      filtered = filtered.filter(entry => entry.action === actionFilter);
    }
    
    // Datumsfilter
    if (dateFilter) {
      const today = new Date();
      let filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          // Bereits auf heute gesetzt
          break;
        case 'yesterday':
          filterDate.setDate(today.getDate() - 1);
          break;
        case 'last7days':
          filterDate.setDate(today.getDate() - 7);
          break;
        case 'last30days':
          filterDate.setDate(today.getDate() - 30);
          break;
        default:
          // Kein Filter
          filterDate = new Date(0); // 1970-01-01
      }
      
      filtered = filtered.filter(entry => {
        const entryDate = entry.timestamp.toDate();
        return entryDate >= filterDate;
      });
    }
    
    setFilteredEntries(filtered);
  }, [searchTerm, actionFilter, dateFilter, auditEntries]);

  // Formatiere Zeitstempel für die Anzeige
  const formatTimestamp = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return format(date, 'dd.MM.yyyy HH:mm:ss', { locale: de });
  };

  // Generiere eine lesbare Beschreibung der Änderung
  const getChangeDescription = (entry: AuditEntry) => {
    if (entry.details?.description) {
      return entry.details.description;
    }
    
    switch (entry.action) {
      case 'create':
        return `Neuer Eintrag erstellt`;
      case 'update':
        return `Eintrag aktualisiert`;
      case 'delete':
        return `Eintrag gelöscht`;
      default:
        return `${entry.action} durchgeführt`;
    }
  };

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="search">Suche</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nach Benutzer, Team oder Beschreibung suchen"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="action-filter">Aktion</Label>
            <Select
              value={actionFilter}
              onValueChange={setActionFilter}
            >
              <SelectTrigger id="action-filter">
                <SelectValue placeholder="Alle Aktionen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-actions">Alle Aktionen</SelectItem>
                <SelectItem value="create">Erstellen</SelectItem>
                <SelectItem value="update">Aktualisieren</SelectItem>
                <SelectItem value="delete">Löschen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="date-filter">Zeitraum</Label>
            <Select
              value={dateFilter}
              onValueChange={setDateFilter}
            >
              <SelectTrigger id="date-filter">
                <SelectValue placeholder="Alle Zeiträume" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-dates">Alle Zeiträume</SelectItem>
                <SelectItem value="today">Heute</SelectItem>
                <SelectItem value="yesterday">Gestern</SelectItem>
                <SelectItem value="last7days">Letzte 7 Tage</SelectItem>
                <SelectItem value="last30days">Letzte 30 Tage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Lade Audit-Einträge...</p>
        </div>
      ) : filteredEntries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Änderungsprotokoll
            </CardTitle>
            <CardDescription>
              {filteredEntries.length} Einträge gefunden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Zeitpunkt</TableHead>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Aktion</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs">
                      {formatTimestamp(entry.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        {entry.userName || entry.userId || 'Unbekannter Benutzer'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entry.action === 'create' ? 'bg-green-100 text-green-800' :
                        entry.action === 'update' ? 'bg-blue-100 text-blue-800' :
                        entry.action === 'delete' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.action === 'create' ? 'Erstellt' :
                         entry.action === 'update' ? 'Aktualisiert' :
                         entry.action === 'delete' ? 'Gelöscht' :
                         entry.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{getChangeDescription(entry)}</p>
                        {entry.entityType && (
                          <p className="text-xs text-muted-foreground">
                            {entry.entityType === 'score' ? 'Ergebnis' :
                             entry.entityType === 'team' ? 'Mannschaft' :
                             entry.entityType === 'shooter' ? 'Schütze' :
                             entry.entityType}
                            {entry.teamName && `: ${entry.teamName}`}
                            {entry.shooterName && `: ${entry.shooterName}`}
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Keine Einträge gefunden</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Es wurden keine Audit-Einträge gefunden, die den Filterkriterien entsprechen.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}