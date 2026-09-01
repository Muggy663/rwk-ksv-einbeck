// src/components/ui/mobile-enhancements.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Pull-to-Refresh Hook
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    let touchStartY = 0;
    let touchMoveY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY;
        setStartY(touchStartY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && touchStartY > 0) {
        touchMoveY = e.touches[0].clientY;
        const distance = Math.max(0, touchMoveY - touchStartY);
        setPullDistance(Math.min(distance, 100));
        
        if (distance > 80) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > 80 && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      setPullDistance(0);
      setStartY(0);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, isRefreshing, pullDistance]);

  return { isRefreshing, pullDistance };
}

// Scroll-to-Top Button
export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      size="sm"
      className="fixed bottom-20 right-4 z-50 rounded-full shadow-lg"
      aria-label="Nach oben scrollen"
    >
      <ChevronUp className="h-4 w-4" />
    </Button>
  );
}

// Touch-optimierte Tabelle
interface TouchTableProps {
  children: React.ReactNode;
  className?: string;
}

export function TouchTable({ children, className }: TouchTableProps) {
  return (
    <div className={cn(
      "overflow-x-auto -mx-4 px-4",
      "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
      className
    )}>
      <div className="min-w-full">
        {children}
      </div>
    </div>
  );
}

// Swipe-to-Action Row
interface SwipeRowProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export function SwipeRow({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  leftAction, 
  rightAction,
  className 
}: SwipeRowProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setSwipeX(Math.max(-100, Math.min(100, diff)));
  };

  const handleTouchEnd = () => {
    if (Math.abs(swipeX) > 50) {
      if (swipeX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (swipeX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    setSwipeX(0);
    setIsDragging(false);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left Action */}
      {leftAction && (
        <div className="absolute left-0 top-0 h-full flex items-center px-4 bg-green-500 text-white">
          {leftAction}
        </div>
      )}
      
      {/* Right Action */}
      {rightAction && (
        <div className="absolute right-0 top-0 h-full flex items-center px-4 bg-red-500 text-white">
          {rightAction}
        </div>
      )}
      
      {/* Main Content */}
      <div
        className={cn(
          "transition-transform duration-200 bg-background",
          className
        )}
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

// Network Status Indicator
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-sm z-50">
      <WifiOff className="inline h-4 w-4 mr-2" />
      Keine Internetverbindung
    </div>
  );
}

// Haptic Feedback (für native Apps)
export function useHapticFeedback() {
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window !== 'undefined' && 'Capacitor' in window) {
      // @ts-ignore
      window.Capacitor?.Plugins?.Haptics?.impact({ style: type });
    }
  };

  return { triggerHaptic };
}