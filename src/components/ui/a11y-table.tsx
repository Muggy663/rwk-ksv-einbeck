/**
 * Barrierefreie Tabelle mit erweiterten ARIA-Attributen
 */
"use client";

import React, { CSSProperties } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './table';
import { useA11yKeyboard } from '@/hooks/use-a11y-keyboard';

interface TableColumn<T> {
  key?: string;
  header: React.ReactNode;
  accessor?: (row: T, rowIndex: number) => React.ReactNode;
  className?: string;
  cellClassName?: string;
  style?: CSSProperties;
  cellStyle?: CSSProperties;
  sorted?: boolean;
  sortDirection?: 'asc' | 'desc';
}

interface A11yTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T, rowIndex: number) => void;
  getRowId?: (row: T) => string | number;
  caption?: string;
  className?: string;
}

/**
 * Barrierefreie Tabelle mit erweiterten ARIA-Attributen
 */
export function A11yTable<T extends Record<string, any>>({
  data = [] as T[],
  columns = [] as TableColumn<T>[],
  onRowClick,
  getRowId = (row: T) => row.id,
  caption,
  className = '',
}: A11yTableProps<T>) {
  // Tastaturnavigation für die Tabelle
  const handleKeyDown = useA11yKeyboard({
    onEnter: (event) => {
      const row = (event.target as HTMLElement).closest('tr');
      if (row && onRowClick) {
        const rowIndex = parseInt(row.dataset.index || '0', 10);
        onRowClick(data[rowIndex], rowIndex);
      }
    },
    onSpace: (event) => {
      const row = (event.target as HTMLElement).closest('tr');
      if (row && onRowClick) {
        const rowIndex = parseInt(row.dataset.index || '0', 10);
        onRowClick(data[rowIndex], rowIndex);
      }
    }
  });
  
  return (
    <div className="relative">
      {caption && (
        <div id="table-caption" className="sr-only">
          {caption}
        </div>
      )}
      
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead 
                key={index}
                className={column.className}
                style={column.style}
                scope="col"
                aria-sort={column.sorted ? (column.sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={getRowId(row)}
              data-index={rowIndex}
              onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
              onKeyDown={onRowClick ? handleKeyDown : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
              aria-rowindex={rowIndex + 2} // +2 wegen Header und 1-basiertem Index
              className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
            >
              {columns.map((column, colIndex) => (
                <TableCell 
                  key={colIndex}
                  className={column.cellClassName}
                  style={column.cellStyle}
                >
                  {column.accessor ? column.accessor(row, rowIndex) : column.key ? row[column.key] : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
          
          {data.length === 0 && (
            <TableRow>
              <TableCell 
                colSpan={columns.length} 
                className="text-center py-6 text-muted-foreground"
              >
                Keine Daten verfügbar
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {caption && (
        <div 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          Tabelle mit {data.length} Einträgen geladen
        </div>
      )}
    </div>
  );
}