"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, History, Search, Filter, Calendar, User, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auditLogService, AuditLogEntry } from '@/lib/services/audit-service';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';



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
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [uniqueUsers, setUniqueUsers] = useState<{id: string, name: string}[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Lade Audit-Einträge
  useEffect(() => {
    const fetchAuditEntries = async () => {
      setIsLoading(true);
      try {
        let entries: AuditLogEntry[];
        
        if (entityType && entityId) {
          // Spezifische Entität
          entries = await auditLogService.getLogsForEntity(entityType, entityId);
        } else if (entityType) {
          // Nach Entitätstyp filtern
          entries = await auditLogService.getLogsByEntityType(entityType, entryLimit);
        } else {
          // Alle Einträge
          entries = await auditLogService.getAllLogs(entryLimit);
        }
        
        setAuditEntries(entries);
        setFilteredEntries(entries);
        
        // Extrahiere eindeutige Benutzer für den Filter
        const users = entries.reduce((acc, entry) => {
          if (entry.userId && entry.userName && !acc.some(u => u.id === entry.userId)) {
            acc.push({ id: entry.userId, name: entry.userName });
          }
          return acc;
        }, [] as {id: string, name: string}[]);
        
        setUniqueUsers(users);
        
        // Zeige Meldung, wenn keine Einträge gefunden wurden
        if (entries.length === 0) {
          toast({
            title: 'Keine Einträge gefunden',
            description: 'Es wurden keine Audit-Einträge in der Datenbank gefunden.',
            variant: 'default'
          });
        }
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
  }, [entityType, entityId, entryLimit, toast, refreshTrigger]);

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
    if (actionFilter && actionFilter !== 'all-actions') {
      filtered = filtered.filter(entry => entry.action === actionFilter);
    }
    
    // Benutzerfilter
    if (userFilter && userFilter !== 'all-users') {
      filtered = filtered.filter(entry => entry.userId === userFilter);
    }
    
    // Datumsfilter
    if (dateFilter && dateFilter !== 'all-dates') {
      const today = new Date();
      let filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0); // Beginn des heutigen Tages
          break;
        case 'yesterday':
          filterDate.setDate(today.getDate() - 1);
          filterDate.setHours(0, 0, 0, 0); // Beginn des gestrigen Tages
          break;
        case 'last7days':
          filterDate.setDate(today.getDate() - 7);
          filterDate.setHours(0, 0, 0, 0); // Beginn des Tages vor 7 Tagen
          break;
        case 'last30days':
          filterDate.setDate(today.getDate() - 30);
          filterDate.setHours(0, 0, 0, 0); // Beginn des Tages vor 30 Tagen
          break;
      }
      
      filtered = filtered.filter(entry => {
        if (!entry.timestamp) return false;
        const entryDate = entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp);
        return entryDate >= filterDate;
      });
    }
    
    setFilteredEntries(filtered);
  }, [searchTerm, actionFilter, dateFilter, userFilter, auditEntries]);

  // Formatiere Zeitstempel für die Anzeige
  const formatTimestamp = (timestamp: Date) => {
    if (!timestamp) return '-';
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return format(date, 'dd.MM.yyyy HH:mm:ss', { locale: de });
    } catch (error) {
      console.error('Fehler beim Formatieren des Zeitstempels:', error);
      return '-';
    }
  };

  // Generiere eine lesbare Beschreibung der Änderung
  const getChangeDescription = (entry: AuditLogEntry) => {
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

  // Manuelles Aktualisieren der Audit-Einträge
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Filter</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-4">
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
              <Label htmlFor="user-filter">Benutzer</Label>
              <Select
                value={userFilter}
                onValueChange={setUserFilter}
              >
                <SelectTrigger id="user-filter">
                  <SelectValue placeholder="Alle Benutzer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-users">Alle Benutzer</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
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
            <div className="overflow-x-auto">
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
                          entry.action === 'create' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                          entry.action === 'update' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' :
                          entry.action === 'delete' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
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
            </div>
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
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
