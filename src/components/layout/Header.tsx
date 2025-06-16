// src/components/layout/Header.tsx
"use client";
import Link from 'next/link';
import Image from 'next/image';
import { MainNav } from './MainNav';
import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const { user } = useAuth();
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image 
            src="/images/logo.png" 
            alt="KSV Einbeck Logo Klein" 
            width={40} 
            height={40}
            className="rounded-md"
            style={{ width: 40, height: 40 }}
            data-ai-hint="club logo"
          />
          <span className="hidden font-bold sm:inline-block text-lg">RWK Einbeck</span>
        </Link>
        <MainNav />
      </div>
    </header>
  );
}