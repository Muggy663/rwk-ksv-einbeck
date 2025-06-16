"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessagesSquare, Loader2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
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
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
                      {ticket.screenshot ? (
                        <Badge variant="outline" className="flex items-center">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Ja
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openTicketDetails(ticket)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Details
                      </Button>
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
              
              {selectedTicket.screenshot && (
                <div>
                  <h3 className="font-semibold mb-1">Screenshot:</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <img 
                      src={selectedTicket.screenshot.data} 
                      alt="Benutzer-Screenshot" 
                      className="max-w-full max-h-[500px] object-contain mx-auto border rounded-md"
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {selectedTicket.screenshot.name} ({selectedTicket.screenshot.type})
                    </p>
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
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center">
                <span className="mr-2 text-sm">Status ändern:</span>
                <Select
                  value={selectedTicket.status}
                  onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neu">Neu</SelectItem>
                    <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                    <SelectItem value="gelesen">Gelesen</SelectItem>
                    <SelectItem value="geschlossen">Geschlossen</SelectItem>
                  </SelectContent>
                </Select>
                {updatingStatus && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </div>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Schließen
              </Button>
              <Button asChild>
                <a href={`mailto:${selectedTicket.email}?subject=Re: ${selectedTicket.subject}`}>
                  Antworten
                </a>
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}