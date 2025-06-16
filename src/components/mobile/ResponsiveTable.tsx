"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import '@/styles/mobile/responsive-tables.css';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  hiddenColumns?: number[];
  fullWidth?: boolean;
  enableHorizontalScroll?: boolean;
}

export function ResponsiveTable({ 
  children, 
  className, 
  hiddenColumns = [],
  fullWidth = true,
  enableHorizontalScroll = true,
  ...props 
}: ResponsiveTableProps & React.HTMLAttributes<HTMLDivElement>) {
  // Füge mobile-spezifische Klassen zu den Tabellenzellen hinzu
  const enhancedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    // Wenn es sich um eine Tabelle handelt
    if (child.type === 'table') {
      return React.cloneElement(child, {
        className: cn(
          child.props.className,
          'rwk-table',
          fullWidth && 'w-full'
        ),
        children: React.Children.map(child.props.children, (tableChild) => {
          if (!React.isValidElement(tableChild)) return tableChild;

          // Für thead, tbody, tfoot
          if (['thead', 'tbody', 'tfoot'].includes(tableChild.type as string)) {
            return React.cloneElement(tableChild, {
              children: React.Children.map(tableChild.props.children, (rowChild) => {
                if (!React.isValidElement(rowChild)) return rowChild;

                // Für tr
                if (rowChild.type === 'tr') {
                  return React.cloneElement(rowChild, {
                    children: React.Children.map(rowChild.props.children, (cellChild, cellIndex) => {
                      if (!React.isValidElement(cellChild)) return cellChild;

                      // Für th und td
                      if (['th', 'td'].includes(cellChild.type as string)) {
                        return React.cloneElement(cellChild, {
                          className: cn(
                            cellChild.props.className,
                            hiddenColumns.includes(cellIndex) && 'hide-on-mobile'
                          )
                        });
                      }
                      return cellChild;
                    })
                  });
                }
                return rowChild;
              })
            });
          }
          return tableChild;
        })
      });
    }
    return child;
  });

  return (
    <div 
      className={cn(
        'rwk-table-container',
        enableHorizontalScroll && 'responsive-table',
        className
      )}
      {...props}
    >
      {enhancedChildren}
    </div>
  );
}