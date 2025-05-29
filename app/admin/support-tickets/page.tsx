// src/app/admin/support-tickets/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, MessagesSquare, AlertTriangle, Eye } from 'lucide-react';
import type { SupportTicket } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const SUPPORT_TICKETS_COLLECTION = "support_tickets";
type TicketStatus = SupportTicket['status'];

export default function AdminSupportTicketsPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null); // Store ticket ID being updated

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const ticketsQuery = query(collection(db, SUPPORT_TICKETS_COLLECTION), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(ticketsQuery);
      const fetchedTickets: SupportTicket[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedTickets.push({ id: docSnap.id, ...docSnap.data() } as SupportTicket);
      });
      setTickets(fetchedTickets);
    } catch (error) {
      console.error("Error fetching support tickets: ", error);
      toast({
        title: "Fehler beim Laden der Tickets",
        description: (error as Error).message || "Ein unbekannter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleShowDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    if (!ticketId) return;
    setIsUpdatingStatus(ticketId);
    try {
      const ticketDocRef = doc(db, SUPPORT_TICKETS_COLLECTION, ticketId);
      await updateDoc(ticketDocRef, { status: newStatus });
      toast({
        title: "Status aktualisiert",
        description: `Der Status des Tickets wurde auf "${newStatus}" geändert.`,
      });
      // Optimistic update or refetch
      setTickets(prevTickets => 
        prevTickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t)
      );
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast({
        title: "Fehler beim Statusupdate",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <MessagesSquare className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold text-primary">Support Tickets</h1>
          <p className="text-muted-foreground">Übersicht der eingegangenen Support-Anfragen.</p>
        </div>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Eingegangene Tickets</CardTitle>
          <CardDescription>Hier sehen Sie alle von Benutzern gesendeten Anfragen und können deren Status verwalten.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-3">Lade Tickets...</p>
            </div>
          ) : tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Datum</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Betreff</TableHead>
                    <TableHead className="w-[180px]">Status</TableHead>
                    <TableHead className="text-right w-[100px]">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        {ticket.timestamp ? format((ticket.timestamp as Timestamp).toDate(), 'dd.MM.yy HH:mm', { locale: de }) : '-'}
                      </TableCell>
                      <TableCell>{ticket.name}</TableCell>
                      <TableCell>{ticket.email}</TableCell>
                      <TableCell className="max-w-xs truncate" title={ticket.subject}>{ticket.subject}</TableCell>
                      <TableCell>
                        <Select
                          value={ticket.status || 'neu'}
                          onValueChange={(newStatus) => handleStatusChange(ticket.id!, newStatus as TicketStatus)}
                          disabled={isUpdatingStatus === ticket.id}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Status wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="neu">Neu</SelectItem>
                            <SelectItem value="in Bearbeitung">In Bearbeitung</SelectItem>
                            <SelectItem value="gelesen">Gelesen</SelectItem>
                            <SelectItem value="geschlossen">Geschlossen</SelectItem>
                          </SelectContent>
                        </Select>
                        {isUpdatingStatus === ticket.id && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleShowDetails(ticket)}>
                          <Eye className="mr-1 h-4 w-4" /> Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
               <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
              <p className="text-lg">Keine Support-Tickets vorhanden.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-primary">{selectedTicket.subject}</DialogTitle>
                <DialogDescription>
                  Von: {selectedTicket.name} ({selectedTicket.email}) <br />
                  Gesendet am: {selectedTicket.timestamp ? format((selectedTicket.timestamp as Timestamp).toDate(), 'dd.MM.yyyy HH:mm', { locale: de }) : '-'}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 whitespace-pre-wrap text-sm text-muted-foreground bg-muted/50 p-4 rounded-md max-h-[60vh] overflow-y-auto">
                {selectedTicket.message}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
