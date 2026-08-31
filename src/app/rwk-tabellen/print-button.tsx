"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface PrintButtonProps {
  contentRef: React.RefObject<HTMLDivElement>;
  leagueName: string;
  year: number;
}

export function PrintButton({ contentRef, leagueName, year }: PrintButtonProps) {
  const handlePrint = useReactToPrint({
    content: () => contentRef.current,
    documentTitle: `RWK_${leagueName.replace(/\s+/g, '_')}_${year}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 12px;
        }
        .print-header {
          text-align: center;
          margin-bottom: 15px;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .print-table th, .print-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .print-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .print-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .print-footer {
          text-align: center;
          font-size: 10px;
          margin-top: 20px;
          color: #666;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handlePrint} 
      className="hover:bg-accent/20 rounded-md mr-2"
      title="Drucken"
    >
      <Printer className="h-5 w-5" />
    </Button>
  );
}
