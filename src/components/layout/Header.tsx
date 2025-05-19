// src/components/layout/Header.tsx
"use client";
import Link from 'next/link';
import Image from 'next/image';
import { MainNav } from './MainNav';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image 
            src="https://placehold.co/120x40.png?text=KSV+Einbeck" 
            alt="KSV Einbeck Logo" 
            width={120} 
            height={40}
            className="rounded-md"
            data-ai-hint="club logo"
          />
          <span className="hidden font-bold sm:inline-block text-lg">RWK Einbeck</span>
        </Link>
        <MainNav />
      </div>
    </header>
  );
}
