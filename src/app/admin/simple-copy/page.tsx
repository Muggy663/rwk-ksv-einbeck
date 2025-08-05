"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SimpleCopyPage() {
  const [status, setStatus] = useState('Bereit');
  const [copying, setCopying] = useState(false);

  const copyData = async () => {
    setCopying(true);
    setStatus('🚀 Kopiere alle Schützen...');

    try {
      const { collection, getDocs, writeBatch, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');

      const shootersSnap = await getDocs(collection(db, 'rwk_shooters'));
      setStatus(`📊 ${shootersSnap.docs.length} Schützen gefunden`);

      const batch = writeBatch(db);
      let count = 0;

      shootersSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const kmRef = doc(db, 'km_shooters', docSnap.id);
        batch.set(kmRef, {
          ...data,
          migratedAt: new Date(),
          migratedFrom: 'rwk_shooters'
        });
        count++;
      });

      await batch.commit();
      setStatus(`✅ ${count} Schützen nach km_shooters kopiert!`);
    } catch (error) {
      setStatus(`❌ Fehler: ${error}`);
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">🔄 Schützen-Migration</h1>
      <Button onClick={copyData} disabled={copying}>
        {copying ? 'Kopiere...' : 'rwk_shooters → km_shooters kopieren'}
      </Button>
      <p className="mt-4 whitespace-pre-wrap">{status}</p>
    </div>
  );
}