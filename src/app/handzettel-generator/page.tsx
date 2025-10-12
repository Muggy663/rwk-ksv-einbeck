// src/app/handzettel-generator/page.tsx
"use client";
import { HandzettelGenerator } from '@/components/handzettel/HandzettelGenerator';

export default function HandzettelGeneratorPage() {
  return (
    <HandzettelGenerator 
      showContactData={false}
      backButtonHref="/dokumente"
    />
  );
}

