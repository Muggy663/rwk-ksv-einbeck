// src/app/verein/handtabellen/page.tsx
"use client";
import { HandzettelGenerator } from '@/components/handzettel/HandzettelGenerator';

export default function VereinHandtabellenPage() {
  return (
    <HandzettelGenerator 
      showContactData={true}
      showGesamtTab={true}
      backButtonHref="/verein/dashboard"
    />
  );
}
