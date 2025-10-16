"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  enableCardMode?: boolean; // Schalter für Card-Modus
}

interface ResponsiveTableCellProps {
  children: React.ReactNode;
  label: string; // Das Label für die Card-Ansicht
  className?: string;
}

// Haupt-Tabellen-Komponente
export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ 
  children, 
  className, 
  enableCardMode = true 
}) => {
  return (
    <Table 
      className={cn(
        enableCardMode && "responsive-card-table",
        className
      )}
    >
      {children}
    </Table>
  );
};

// Spezielle Zelle mit automatischem data-label
export const ResponsiveTableCell: React.FC<ResponsiveTableCellProps> = ({ 
  children, 
  label, 
  className 
}) => {
  return (
    <TableCell 
      className={className}
      data-label={label}
    >
      {children}
    </TableCell>
  );
};

// Export der Standard-Komponenten für Kompatibilität
export { Table, TableBody, TableHead, TableHeader, TableRow, TableCell };