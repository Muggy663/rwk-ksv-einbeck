"use client";

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
}

export const StarField: React.FC = () => {
  const { theme } = useTheme();
  const [stars, setStars] = useState<Star[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Nur im Dark Mode Sterne anzeigen
    if (theme !== 'dark') {
      setStars([]);
      return;
    }

    // Generiere Sterne
    const generateStars = () => {
      const newStars: Star[] = [];
      const starCount = 50; // Weniger Sterne für subtilen Effekt

      for (let i = 0; i < starCount; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100, // Prozent
          y: Math.random() * 100, // Prozent
          size: Math.random() * 2 + 1, // 1-3px
          opacity: Math.random() * 0.8 + 0.2, // 0.2-1.0
          twinkleSpeed: Math.random() * 3 + 1, // 1-4 Sekunden
        });
      }
      setStars(newStars);
    };

    generateStars();
  }, [theme, mounted]);

  if (!mounted || theme !== 'dark' || stars.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes twinkle {
            0% { opacity: 0.2; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1.2); }
          }
        `
      }} />
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animation: `twinkle ${star.twinkleSpeed}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
};