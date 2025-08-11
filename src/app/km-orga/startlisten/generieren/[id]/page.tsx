"use client";

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function GenerierenPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Sofortige Weiterleitung ohne Router
    const configId = params.id;
    const startlisteId = searchParams.get('startlisteId');
    
    if (configId) {
      let newUrl = `/startlisten-tool?id=${configId}`;
      if (startlisteId) {
        newUrl += `&startlisteId=${startlisteId}`;
      }
      window.location.replace(newUrl);
    }
  }, [params.id, searchParams]);

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
        <p>Weiterleitung...</p>
      </div>
    </div>
  );
}