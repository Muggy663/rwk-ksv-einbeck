/**
 * Virtualisierte Tabelle für große Datensätze
 * Vercel-kompatible Implementierung ohne externe Abhängigkeiten
 */
"use client";

import React, { useRef, useState, useEffect, UIEvent } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody } from './table';

interface TableColumn {
  header: React.ReactNode;
  className?: string;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: TableColumn[];
  renderRow: (item: T, index: number) => React.ReactNode;
  rowHeight?: number;
  visibleRows?: number;
  className?: string;
}

/**
 * Virtualisierte Tabelle für große Datensätze
 */
export function VirtualizedTable<T>({
  data = [] as T[],
  columns = [],
  renderRow,
  rowHeight = 40,
  visibleRows = 10,
  className = '',
}: VirtualizedTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(visibleRows * rowHeight);
  
  // Gesamthöhe der Tabelle
  const totalHeight = data.length * rowHeight;
  
  // Berechnung der sichtbaren Zeilen
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight));
  const endIndex = Math.min(
    data.length - 1,
    Math.floor((scrollTop + containerHeight) / rowHeight)
  );
  
  // Sichtbare Daten
  const visibleData = data.slice(startIndex, endIndex + 1);
  
  // Scroll-Handler
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };
  
  // Container-Höhe aktualisieren
  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: visibleRows * rowHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ 
          position: 'absolute', 
          top: startIndex * rowHeight, 
          width: '100%' 
        }}>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index} className={column.className || ''}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleData.map((item, index) => renderRow(item, startIndex + index))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
