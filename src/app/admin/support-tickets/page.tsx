"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessagesSquare, Loader2, ExternalLink, Image as ImageIcon, Trash2, Reply } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const SUPPORT_TICKETS_COLLECTION = "support_tickets";

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  reportedByUserId: string | null;
  timestamp: Timestamp;
  status: 'neu' | 'in_bearbeitung' | 'gelesen' | 'geschlossen';
  screenshot?: {
    name: string;
    type: string;
    data: string;
  };
  screenshots?: Array<{
    name: string;
    type: string;
    data?: string;
    url?: string;
    size?: number;
  }>;
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const ticketsQuery = query(
          collection(db, SUPPORT_TICKETS_COLLECTION),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(ticketsQuery);
        const fetchedTickets: SupportTicket[] = [];
        querySnapshot.forEach((doc) => {
          fetchedTickets.push({ id: doc.id, ...doc.data() } as SupportTicket);
        });
        setTickets(fetchedTickets);
      } catch (error) {
        console.error("Error fetching support tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const ticketRef = doc(db, SUPPORT_TICKETS_COLLECTION, ticketId);
      await updateDoc(ticketRef, {
        status: newStatus
      });
      
      // Update local state
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus as SupportTicket['status'] } : ticket
      ));
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus as SupportTicket['status'] });
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Ticket wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    setDeletingTicket(ticketId);
    try {
      const ticketRef = doc(db, SUPPORT_TICKETS_COLLECTION, ticketId);
      await deleteDoc(ticketRef);
      
      // Update local state
      setTickets(tickets.filter(ticket => ticket.id !== ticketId));
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        setIsDialogOpen(false);
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert('Fehler beim Löschen des Tickets.');
    } finally {
      setDeletingTicket(null);
    }
  };

  const generateReplyTemplate = (ticket: SupportTicket) => {
    const templates = {
      bug: `Hallo ${ticket.name},

vielen Dank für Ihren Hinweis zu "${ticket.subject}".

Wir haben das Problem reproduziert und werden es in der nächsten Version beheben. Sie erhalten eine Benachrichtigung, sobald das Update verfügbar ist.

Vielen Dank für Ihr Feedback!

Beste Grüße
Marcel Bünger
RWK Einbeck`,
      
      feature: `Hallo ${ticket.name},

vielen Dank für Ihren Vorschlag zu "${ticket.subject}".

Wir haben Ihre Anregung in unsere Entwicklungsplanung aufgenommen und prüfen die Umsetzung für zukünftige Versionen.

Beste Grüße
Marcel Bünger
RWK Einbeck`,
      
      resolved: `Hallo ${ticket.name},

das Problem "${ticket.subject}" wurde in Version 0.9.9.1 behoben.

Bitte aktualisieren Sie die App und prüfen Sie, ob das Problem weiterhin besteht. Falls ja, melden Sie sich gerne erneut.

Vielen Dank!

Beste Grüße
Marcel Bünger
RWK Einbeck`
    };
    
    // Einfache Heuristik für Template-Auswahl
    const subject = ticket.subject.toLowerCase();
    const message = ticket.message.toLowerCase();
    
    if (subject.includes('fehler') || subject.includes('problem') || message.includes('fehler') || message.includes('bug')) {
      return templates.resolved;
    } else if (subject.includes('vorschlag') || subject.includes('feature') || message.includes('wünsche') || message.includes('könnte')) {
      return templates.feature;
    } else {
      return templates.bug;
    }
  };

  const openTicketDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsDialogOpen(true);
  };

  const filteredTickets = activeTab === 'all' 
    ? tickets 
    : tickets.filter(ticket => ticket.status === activeTab);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'neu':
        return <Badge variant="destructive">Neu</Badge>;
      case 'in_bearbeitung':
        return <Badge variant="default">In Bearbeitung</Badge>;
      case 'gelesen':
        return <Badge variant="secondary">Gelesen</Badge>;
      case 'geschlossen':
        return <Badge variant="outline">Geschlossen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Support-Tickets</h1>
          <p className="text-muted-foreground">
            Übersicht aller eingegangenen Support-Anfragen.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="neu">Neu</TabsTrigger>
          <TabsTrigger value="in_bearbeitung">In Bearbeitung</TabsTrigger>
          <TabsTrigger value="gelesen">Gelesen</TabsTrigger>
          <TabsTrigger value="geschlossen">Geschlossen</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessagesSquare className="mr-2 h-5 w-5" />
            Support-Anfragen
          </CardTitle>
          <CardDescription>
            Alle eingegangenen Support-Anfragen von Benutzern.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <p>Lade Support-Tickets...</p>
            </div>
          ) : filteredTickets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Betreff</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Anhang</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      {ticket.timestamp ? format(ticket.timestamp.toDate(), 'dd.MM.yyyy HH:mm', { locale: de }) : '-'}
                    </TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell>{ticket.name}</TableCell>
                    <TableCell>
                      <a href={`mailto:${ticket.email}`} className="text-primary hover:underline">
                        {ticket.email}
                      </a>
                    </TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>
                      {(ticket.screenshot || (ticket.screenshots && ticket.screenshots.length > 0)) ? (
                        <Badge variant="outline" className="flex items-center">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {ticket.screenshots ? ticket.screenshots.length : 1}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openTicketDetails(ticket)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteTicket(ticket.id)}
                          disabled={deletingTicket === ticket.id}
                        >
                          {deletingTicket === ticket.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessagesSquare className="mx-auto h-10 w-10 mb-3 text-primary/70" />
              <p>Keine Support-Tickets gefunden.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedTicket && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>{selectedTicket.subject}</span>
                {getStatusBadge(selectedTicket.status)}
              </DialogTitle>
              <DialogDescription>
                Von {selectedTicket.name} ({selectedTicket.email}) am {
                  selectedTicket.timestamp ? format(selectedTicket.timestamp.toDate(), 'dd.MM.yyyy HH:mm', { locale: de }) : '-'
                } Uhr
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 my-4">
              <div>
                <h3 className="font-semibold mb-1">Nachricht:</h3>
                <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                  {selectedTicket.message}
                </div>
              </div>
              
              {(selectedTicket.screenshot || (selectedTicket.screenshots && selectedTicket.screenshots.length > 0)) && (
                <div>
                  <h3 className="font-semibold mb-1">
                    {selectedTicket.screenshots && selectedTicket.screenshots.length > 1 
                      ? `Screenshots (${selectedTicket.screenshots.length}):` 
                      : 'Screenshot:'}
                  </h3>
                  <div className="bg-muted p-4 rounded-md space-y-4">
                    {/* Legacy single screenshot */}
                    {selectedTicket.screenshot && (
                      <div>
                        <img 
                          src={selectedTicket.screenshot.data} 
                          alt="Benutzer-Screenshot" 
                          className="max-w-full max-h-[400px] object-contain mx-auto border rounded-md"
                        />
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          {selectedTicket.screenshot.name} ({selectedTicket.screenshot.type})
                        </p>
                      </div>
                    )}
                    
                    {/* Multiple screenshots */}
                    {selectedTicket.screenshots && selectedTicket.screenshots.map((screenshot, index) => (
                      <div key={index}>
                        <img 
                          src={screenshot.data || screenshot.url} 
                          alt={`Screenshot ${index + 1}`} 
                          className="max-w-full max-h-[400px] object-contain mx-auto border rounded-md"
                        />
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          {screenshot.name} ({screenshot.type})
                          {screenshot.size && ` - ${(screenshot.size / 1024).toFixed(1)} KB`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedTicket.reportedByUserId && (
                <div>
                  <h3 className="font-semibold mb-1">Benutzer-ID:</h3>
                  <code className="bg-muted p-2 rounded-md text-xs block overflow-x-auto">
                    {selectedTicket.reportedByUserId}
                  </code>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Status:</span>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neu">Neu</SelectItem>
                      <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                      <SelectItem value="gelesen">Gelesen</SelectItem>
                      <SelectItem value="geschlossen">Geschlossen</SelectItem>
                    </SelectContent>
                  </Select>
                  {updatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                
                <div className="flex gap-2 ml-auto">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                    disabled={deletingTicket === selectedTicket.id}
                  >
                    {deletingTicket === selectedTicket.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    Löschen
                  </Button>
                  
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Schließen
                  </Button>
                  
                  <Button asChild>
                    <a href={`mailto:${selectedTicket.email}?subject=Re: ${selectedTicket.subject}&body=${encodeURIComponent(generateReplyTemplate(selectedTicket))}`}>
                      <Reply className="h-4 w-4 mr-1" />
                      Antworten
                    </a>
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}