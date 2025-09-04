// src/hooks/use-pull-to-refresh.ts
"use client";

import { useEffect, useRef, useState } from 'react';
import { useMobileDetection } from './use-mobile-detection';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true
}: PullToRefreshOptions) {
  const { isMobile } = useMobileDetection();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !isMobile) return;

    const container = containerRef.current || document.body;
    let isAtTop = true;

    const checkScrollPosition = () => {
      isAtTop = container.scrollTop <= 0;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!isAtTop || isRefreshing) return;
      
      startY.current = e.touches[0].clientY;
      setIsPulling(false);
      setPullDistance(0);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop || isRefreshing) return;
      
      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;
      
      if (deltaY > 0) {
        e.preventDefault();
        const distance = Math.min(deltaY / resistance, threshold * 1.5);
        setPullDistance(distance);
        setIsPulling(distance > 10);
      }
    };

    const handleTouchEnd = async () => {
      if (!isAtTop || isRefreshing) return;
      
      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      
      setIsPulling(false);
      setPullDistance(0);
    };

    container.addEventListener('scroll', checkScrollPosition);
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, isMobile, onRefresh, threshold, resistance, pullDistance, isRefreshing]);

  return {
    isRefreshing,
    isPulling,
    pullDistance,
    containerRef,
    shouldShowIndicator: isPulling || isRefreshing
  };
}