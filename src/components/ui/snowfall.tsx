"use client";

import { useEffect, useState } from 'react';

export function Snowfall() {
  const [snowflakes, setSnowflakes] = useState<Array<{
    id: number;
    left: number;
    animationDuration: number;
    opacity: number;
    size: number;
  }>>([]);

  useEffect(() => {
    const flakes = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: Math.random() * 8 + 6, // Viel langsamer
      opacity: Math.random() * 0.8 + 0.3,
      size: Math.random() * 6 + 8, // Größere Schneeflocken
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute text-white"
          style={{
            left: `${flake.left}%`,
            opacity: flake.opacity,
            fontSize: `${flake.size}px`,
            animation: `snowfall ${flake.animationDuration}s linear infinite ${Math.random() * 5}s`,
          }}
        >
          ❄
        </div>
      ))}
      <style jsx>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-100vh) translateX(0px) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) translateX(30px) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
}