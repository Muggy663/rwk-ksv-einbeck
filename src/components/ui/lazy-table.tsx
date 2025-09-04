// src/components/ui/lazy-table.tsx
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { SkeletonTable } from './skeleton';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LazyTableProps<T> {
  data: T[];
  columns: {
    key: keyof T | string;
    header: string;
    render?: (item: T, index: number) => React.ReactNode;
    className?: string;
  }[];
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function LazyTable<T extends { id?: string | number }>({
  data,
  columns,
  pageSize = 20,
  loading = false,
  emptyMessage = "Keine Daten verfügbar",
  className
}: LazyTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(0);

  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const goToPrevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  if (loading) {
    return <SkeletonTable rows={pageSize} columns={columns.length} />;
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((item, index) => (
            <TableRow key={item.id || index}>
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex} className={column.className}>
                  {column.render 
                    ? column.render(item, currentPage * pageSize + index)
                    : String(item[column.key as keyof T] || '-')
                  }
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Zeige {currentPage * pageSize + 1} bis {Math.min((currentPage + 1) * pageSize, data.length)} von {data.length} Einträgen
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
              Zurück
            </Button>
            
            <span className="text-sm">
              Seite {currentPage + 1} von {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={!hasNextPage}
            >
              Weiter
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}