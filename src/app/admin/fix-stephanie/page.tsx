"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

export default function FixStephanie() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const fixStephanie = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'user_permissions', '9Hq5Jjcf1YPjIXUV1eXXoTS1s8D3'), {
        kvRoles: { einbeck: 'KV_WETTKAMPFLEITER' }
      });
      setResult('✅ Stephanie ist jetzt KV_WETTKAMPFLEITER');
    } catch (error) {
      setResult(`❌ Fehler: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Stephanie Fix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={fixStephanie} disabled={loading}>
            {loading ? 'Fixe...' : 'Stephanie zu KV_WETTKAMPFLEITER'}
          </Button>
          {result && <div className="text-sm font-mono">{result}</div>}
        </CardContent>
      </Card>
    </div>
  );
}