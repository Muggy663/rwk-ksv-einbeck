"use client";

import React, { forwardRef } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface A11yTableProps extends React.HTMLAttributes<HTMLTableElement> {
  caption?: string;
  summary?: string;
  data: Array<Record<string, any>>;
  columns: Array<{
    header: string;
    accessorKey: string;
    cell?: (info: any) => React.ReactNode;
  }>;
}

export const A11yTable = forwardRef<HTMLTableElement, A11yTableProps>(
  ({ className, caption, summary, data, columns, ...props }, ref) => {
    return (
      <div className="w-full overflow-auto">
        <Table ref={ref} className={cn('w-full', className)} {...props}>
          {caption && (
            <caption className="text-sm text-muted-foreground mb-2">{caption}</caption>
          )}
          {summary && <caption className="sr-only">{summary}</caption>}
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className="font-medium">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex}>
                    {column.cell
                      ? column.cell(row[column.accessorKey])
                      : row[column.accessorKey]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-4">
                  Keine Daten verfügbar
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  }
);
