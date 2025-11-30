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
        React.Children.forEach(child.props.children, (row) => {
          if (React.isValidElement(row) && row.type === TableRow) {
            React.Children.forEach(row.props.children, (head) => {
              if (React.isValidElement(head) && head.type === TableHead) {
                // Extrahiere Text aus dem TableHead
                const headerText = typeof head.props.children === 'string' 
                  ? head.props.children 
                  : extractTextFromElement(head.props.children);
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
    if (React.isValidElement(element)) {
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
      const processedRows = React.Children.map(child.props.children, (row) => {
        if (React.isValidElement(row) && row.type === TableRow) {
          const processedCells = React.Children.map(row.props.children, (cell, cellIndex) => {
            if (React.isValidElement(cell) && cell.type === TableCell) {
              return React.cloneElement(cell, {
                ...cell.props,
                'data-label': headers[cellIndex] || `Spalte ${cellIndex + 1}`
              });
            }
            return cell;
          });
          return React.cloneElement(row, row.props, processedCells);
        }
        return row;
      });
      return React.cloneElement(child, child.props, processedRows);
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
