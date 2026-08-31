// src/app/rwk-tabellen/print-view.tsx
"use client";
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface PrintViewProps {
  title: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
}

export function PrintView({ title, children, trigger }: PrintViewProps) {
  const [open, setOpen] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: title,
    onAfterPrint: () => setOpen(false),
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .print-header {
          position: fixed;
          top: 0;
          width: 100%;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5mm;
        }
        .print-content {
          margin-top: 20mm;
        }
      }
    `
  });
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Drucken
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Schließen</span>
            </Button>
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Drucken
            </Button>
          </div>
        </DialogHeader>
        
        <div ref={printRef} className="p-4">
          <div className="print-header">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-sm text-muted-foreground">
                  Erstellt am {new Date().toLocaleDateString('de-DE')} mit der RWK Einbeck App
                </p>
              </div>
              <img src="/images/logo2.png" alt="Logo" className="h-16 w-auto" />
            </div>
          </div>
          <div className="print-content">
            {children}
          </div>
          <div className="mt-8 text-sm text-muted-foreground text-center">
            <p>© {new Date().getFullYear()} Kreisschützenverband Einbeck</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
