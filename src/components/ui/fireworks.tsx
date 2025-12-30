"use client";

import React, { useEffect, useRef } from 'react';

interface Firework {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const Fireworks: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireworksRef = useRef<Firework[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];

    const createFirework = (x: number, y: number) => {
      const particleCount = 8; // Weniger Partikel
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = Math.random() * 1.5 + 1; // Langsamere Geschwindigkeit
        fireworksRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 80, // Längere Lebensdauer
          maxLife: 80,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 2 + 1 // Kleinere Partikel
        });
      }
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Zufällige Feuerwerke erstellen (weniger häufig)
      if (Math.random() < 0.008) {
        createFirework(
          Math.random() * canvas.width,
          Math.random() * canvas.height * 0.6 + canvas.height * 0.2
        );
      }

      // Feuerwerk-Partikel animieren
      fireworksRef.current = fireworksRef.current.filter(firework => {
        firework.x += firework.vx;
        firework.y += firework.vy;
        firework.vy += 0.05; // Weniger Schwerkraft
        firework.life--;

        const alpha = firework.life / firework.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = firework.color;
        ctx.beginPath();
        ctx.arc(firework.x, firework.y, firework.size, 0, Math.PI * 2);
        ctx.fill();

        return firework.life > 0;
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};