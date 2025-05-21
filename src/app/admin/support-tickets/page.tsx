// src/app/admin/support-tickets/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, MessagesSquare, AlertTriangle } from 'lucide-react';
import type { SupportTicket } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const SUPPORT_TICKETS_COLLECTION = "support_tickets";

export default function AdminSupportTicketsPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const ticketsQuery = query(collection(db, SUPPORT_TICKETS_COLLECTION), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(ticketsQuery);
        const fetchedTickets: SupportTicket[] = [];
        querySnapshot.forEach((doc) => {
          fetchedTickets.push({ id: doc.id, ...doc.data() } as SupportTicket);
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
    };
    fetchTickets();
  }, [toast]);

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
          <CardDescription>Hier sehen Sie alle von Benutzern gesendeten Anfragen.</CardDescription>
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
                    <TableHead>Datum</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Betreff</TableHead>
                    <TableHead>Status</TableHead>
                    {/* <TableHead className="text-right">Aktionen</TableHead> */}
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
                      <TableCell>{ticket.status || 'neu'}</TableCell>
                      {/* <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Details</Button>
                      </TableCell> */}
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
       <Card className="mt-6 shadow-sm border-amber-500 bg-amber-50/50">
          <CardHeader><CardTitle className="text-amber-700 text-base">Hinweis</CardTitle></CardHeader>
          <CardContent className="text-sm text-amber-800">
            <p>Dies ist eine einfache Anzeige der Support-Tickets. Funktionen wie das Ändern des Status oder das direkte Antworten auf Tickets sind in dieser Version noch nicht implementiert.</p>
          </CardContent>
        </Card>
    </div>
  );
}
