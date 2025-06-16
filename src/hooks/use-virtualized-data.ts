/**
 * Hook für virtualisierte Datenlisten
 */
"use client";

import { useState, useEffect, useRef, UIEvent } from 'react';

interface VirtualizedDataOptions {
  itemHeight?: number;
  overscan?: number;
}

interface VirtualizedDataResult<T> {
  containerRef: React.RefObject<HTMLDivElement>;
  visibleData: T[];
  visibleStartIndex: number;
  visibleEndIndex: number;
  totalHeight: number;
  handleScroll: (e: UIEvent<HTMLDivElement>) => void;
  startOffset: number;
}

/**
 * Hook für virtualisierte Datenlisten
 * @param data - Vollständige Datenliste
 * @param options - Konfigurationsoptionen
 * @returns Virtualisierte Daten und Hilfsfunktionen
 */
export function useVirtualizedData<T>(
  data: T[] = [], 
  options: VirtualizedDataOptions = {}
): VirtualizedDataResult<T> {
  const {
    itemHeight = 40,
    overscan = 3
  } = options;
  
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Aktualisiere die Container-Höhe, wenn sich die Referenz ändert
  useEffect(() => {
    const currentContainer = containerRef.current;
    if (currentContainer) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height);
        }
      });
      
      resizeObserver.observe(currentContainer);
      setContainerHeight(currentContainer.clientHeight);
      
      return () => {
        resizeObserver.unobserve(currentContainer);
      };
    }
    return undefined;
  }, []);
  
  // Berechne die sichtbaren Elemente
  const totalHeight = data.length * itemHeight;
  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleEndIndex = Math.min(
    data.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  // Sichtbare Daten
  const visibleData = data.slice(visibleStartIndex, visibleEndIndex + 1);
  
  // Scroll-Handler
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  };
  
  return {
    containerRef,
    visibleData,
    visibleStartIndex,
    visibleEndIndex,
    totalHeight,
    handleScroll,
    startOffset: visibleStartIndex * itemHeight
  };
}