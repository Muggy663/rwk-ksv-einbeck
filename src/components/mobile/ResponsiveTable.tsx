"use client";
import React from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
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
    type AnyProps = Record<string, unknown> & { children?: React.ReactNode; className?: string };

    if (child.type === 'table') {
      const tableEl = child as React.ReactElement<AnyProps>;
      return React.cloneElement(tableEl, {
        className: cn(tableEl.props.className, 'rwk-table', fullWidth && 'w-full'),
        children: React.Children.map(tableEl.props.children, (tableChild) => {
          if (!React.isValidElement(tableChild)) return tableChild;
          const tableChildEl = tableChild as React.ReactElement<AnyProps>;

          if (['thead', 'tbody', 'tfoot'].includes(tableChildEl.type as string)) {
            return React.cloneElement(tableChildEl, {
              children: React.Children.map(tableChildEl.props.children, (rowChild) => {
                if (!React.isValidElement(rowChild)) return rowChild;
                const rowEl = rowChild as React.ReactElement<AnyProps>;

                if (rowEl.type === 'tr') {
                  return React.cloneElement(rowEl, {
                    children: React.Children.map(rowEl.props.children, (cellChild, cellIndex) => {
                      if (!React.isValidElement(cellChild)) return cellChild;
                      const cellEl = cellChild as React.ReactElement<AnyProps>;

                      if (['th', 'td'].includes(cellEl.type as string)) {
                        return React.cloneElement(cellEl, {
                          className: cn(
                            cellEl.props.className,
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
