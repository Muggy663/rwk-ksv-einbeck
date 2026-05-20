"use client";

import React from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { cn } from '@/lib/utils';

interface SmartTableProps {
  children: React.ReactNode;
  className?: string;
  enableCardMode?: boolean;
  style?: React.CSSProperties;
}

export const SmartTable: React.FC<SmartTableProps> = ({ 
  children, 
  className, 
  enableCardMode = true,
  style 
}) => {
  // Extrahiere Header-Texte aus dem TableHeader
  const extractHeaders = (children: React.ReactNode): string[] => {
    const headers: string[] = [];
    
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === TableHeader) {
        const headerEl = child as React.ReactElement<{ children: React.ReactNode }>;
        React.Children.forEach(headerEl.props.children, (row) => {
          if (React.isValidElement(row) && row.type === TableRow) {
            const rowEl = row as React.ReactElement<{ children: React.ReactNode }>;
            React.Children.forEach(rowEl.props.children, (head) => {
              if (React.isValidElement(head) && head.type === TableHead) {
                const headEl = head as React.ReactElement<{ children: React.ReactNode }>;
                const headerText = typeof headEl.props.children === 'string'
                  ? headEl.props.children
                  : extractTextFromElement(headEl.props.children);
                headers.push(headerText);
              }
            });
          }
        });
      }
    });
    
    return headers;
  };

  // Hilfsfunktion um Text aus verschachtelten Elementen zu extrahieren
  const extractTextFromElement = (element: any): string => {
    if (typeof element === 'string') return element;
    if (typeof element === 'number') return element.toString();
    if (React.isValidElement<{ children?: React.ReactNode }>(element)) {
      return extractTextFromElement(element.props.children);
    }
    if (Array.isArray(element)) {
      return element.map(extractTextFromElement).join(' ');
    }
    return '';
  };

  const headers = extractHeaders(children);

  // Füge data-labels zu TableBody Zellen hinzu
  const processedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === TableBody) {
      const bodyEl = child as React.ReactElement<{ children: React.ReactNode }>;
      const processedRows = React.Children.map(bodyEl.props.children, (row) => {
        if (React.isValidElement(row) && row.type === TableRow) {
          const rowEl = row as React.ReactElement<{ children: React.ReactNode }>;
          const processedCells = React.Children.map(rowEl.props.children, (cell, cellIndex) => {
            if (React.isValidElement(cell) && cell.type === TableCell) {
              const cellEl = cell as React.ReactElement<Record<string, unknown>>;
              return React.cloneElement(cellEl, {
                ...cellEl.props,
                'data-label': headers[cellIndex] || `Spalte ${cellIndex + 1}`
              });
            }
            return cell;
          });
          return React.cloneElement(rowEl, rowEl.props, processedCells);
        }
        return row;
      });
      return React.cloneElement(bodyEl, bodyEl.props, processedRows);
    }
    return child;
  });

  return (
    <Table 
      className={cn(
        enableCardMode && "responsive-card-table",
        className
      )}
      style={style}
    >
      {processedChildren}
    </Table>
  );
};
