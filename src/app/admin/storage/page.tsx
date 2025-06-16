"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Database, HardDrive, Server } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MongoDBStorageInfo {
  rwkEinbeckSizeInMB: number;
  isNearLimit: boolean;
  limit: number;
  threshold: number;
  percentUsed: number;
  error?: string;
}

interface FirestoreStorageInfo {
  totalSizeInMB: number;
  isNearLimit: boolean;
  limitInMB: number;
  thresholdInMB: number;
  percentUsed: number;
  collectionStats: {
    collection: string;
    documentCount: number;
    estimatedSizeInKB: number;
  }[];
  error?: string;
}

export default function StoragePage() {
  const [mongoDBInfo, setMongoDBInfo] = useState<MongoDBStorageInfo | null>(null);
  const [firestoreInfo, setFirestoreInfo] = useState<FirestoreStorageInfo | null>(null);
  const [loadingMongoDB, setLoadingMongoDB] = useState(true);
  const [loadingFirestore, setLoadingFirestore] = useState(true);
  const [mongoDBError, setMongoDBError] = useState<string | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  useEffect(() => {
    async function checkMongoDBStorage() {
      try {
        setLoadingMongoDB(true);
        setMongoDBError(null);
        
        const response = await fetch('/api/admin/storage-check');
        
        if (!response.ok) {
          throw new Error('Fehler beim Abrufen der MongoDB-Speicherinformationen');
        }
        
        const data = await response.json();
        setMongoDBInfo(data);
      } catch (err: any) {
        console.error('Fehler beim Prüfen des MongoDB-Speicherplatzes:', err);
        setMongoDBError(err.message || 'Ein unbekannter Fehler ist aufgetreten');
      } finally {
        setLoadingMongoDB(false);
      }
    }
    
    async function checkFirestoreStorage() {
      try {
        setLoadingFirestore(true);
        setFirestoreError(null);
        
        const response = await fetch('/api/admin/firebase-storage-check');
        
        if (!response.ok) {
          throw new Error('Fehler beim Abrufen der Firestore-Speicherinformationen');
        }
        
        const data = await response.json();
        setFirestoreInfo(data);
      } catch (err: any) {
        console.error('Fehler beim Prüfen des Firestore-Speicherplatzes:', err);
        setFirestoreError(err.message || 'Ein unbekannter Fehler ist aufgetreten');
      } finally {
        setLoadingFirestore(false);
      }
    }
    
    checkMongoDBStorage();
    checkFirestoreStorage();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Speichernutzung</h1>
          <p className="text-muted-foreground">Überwachen Sie die Nutzung Ihres Datenbank-Speicherplatzes</p>
        </div>
      </div>

      <Tabs defaultValue="mongodb" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="mongodb">MongoDB</TabsTrigger>
          <TabsTrigger value="firestore">Firestore</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mongodb">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                MongoDB-Speichernutzung
              </CardTitle>
              <CardDescription>
                Ihr MongoDB Atlas-Konto hat ein Limit von 512 MB im kostenlosen Tier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingMongoDB ? (
                <div className="flex justify-center items-center h-32">
                  <p>Lade MongoDB-Speicherinformationen...</p>
                </div>
              ) : mongoDBError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Fehler</AlertTitle>
                  <AlertDescription>{mongoDBError}</AlertDescription>
                </Alert>
              ) : mongoDBInfo ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">RWK Einbeck Datenbank</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {mongoDBInfo.rwkEinbeckSizeInMB.toFixed(2)} MB / {mongoDBInfo.limit} MB
                        </span>
                        <span className="text-sm font-medium">
                          {Math.round((mongoDBInfo.rwkEinbeckSizeInMB / mongoDBInfo.limit) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.round((mongoDBInfo.rwkEinbeckSizeInMB / mongoDBInfo.limit) * 100)} 
                        className="h-2 mt-1" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted p-4 rounded-md flex flex-col items-center">
                      <HardDrive className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-lg font-bold">{mongoDBInfo.rwkEinbeckSizeInMB.toFixed(2)} MB</span>
                      <span className="text-xs text-muted-foreground">Genutzt</span>
                    </div>
                    <div className="bg-muted p-4 rounded-md flex flex-col items-center">
                      <Database className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-lg font-bold">{(mongoDBInfo.limit - mongoDBInfo.rwkEinbeckSizeInMB).toFixed(2)} MB</span>
                      <span className="text-xs text-muted-foreground">Verfügbar</span>
                    </div>
                  </div>
                  
                  {mongoDBInfo.isNearLimit && (
                    <Alert variant="warning" className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800">Warnung: Speicherplatz fast aufgebraucht</AlertTitle>
                      <AlertDescription className="text-amber-700">
                        Sie haben {Math.round((mongoDBInfo.rwkEinbeckSizeInMB / mongoDBInfo.limit) * 100)}% Ihres MongoDB-Speicherplatzes verwendet. 
                        Bitte löschen Sie nicht benötigte Daten, um Platz freizugeben.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {mongoDBInfo.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Fehler bei der Speicherberechnung</AlertTitle>
                      <AlertDescription>{mongoDBInfo.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <p>Keine MongoDB-Speicherinformationen verfügbar.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="firestore">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Firestore-Speichernutzung
              </CardTitle>
              <CardDescription>
                Ihr Firebase-Konto hat ein Limit von 1 GB im kostenlosen Spark-Plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingFirestore ? (
                <div className="flex justify-center items-center h-32">
                  <p>Lade Firestore-Speicherinformationen...</p>
                </div>
              ) : firestoreError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Fehler</AlertTitle>
                  <AlertDescription>{firestoreError}</AlertDescription>
                </Alert>
              ) : firestoreInfo ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Firestore-Datenbank</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {firestoreInfo.totalSizeInMB.toFixed(2)} MB / {firestoreInfo.limitInMB} MB
                        </span>
                        <span className="text-sm font-medium">
                          {firestoreInfo.percentUsed}%
                        </span>
                      </div>
                      <Progress 
                        value={firestoreInfo.percentUsed} 
                        className="h-2 mt-1" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted p-4 rounded-md flex flex-col items-center">
                      <HardDrive className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-lg font-bold">{firestoreInfo.totalSizeInMB.toFixed(2)} MB</span>
                      <span className="text-xs text-muted-foreground">Genutzt</span>
                    </div>
                    <div className="bg-muted p-4 rounded-md flex flex-col items-center">
                      <Server className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-lg font-bold">{(firestoreInfo.limitInMB - firestoreInfo.totalSizeInMB).toFixed(2)} MB</span>
                      <span className="text-xs text-muted-foreground">Verfügbar</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">Sammlungsstatistiken</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Sammlung</th>
                            <th className="text-right py-2 px-2">Dokumente</th>
                            <th className="text-right py-2 px-2">Größe (KB)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {firestoreInfo.collectionStats.map((stat) => (
                            <tr key={stat.collection} className="border-b">
                              <td className="py-2 px-2">{stat.collection}</td>
                              <td className="text-right py-2 px-2">{stat.documentCount}</td>
                              <td className="text-right py-2 px-2">{stat.estimatedSizeInKB}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {firestoreInfo.isNearLimit && (
                    <Alert variant="warning" className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800">Warnung: Speicherplatz fast aufgebraucht</AlertTitle>
                      <AlertDescription className="text-amber-700">
                        Sie haben {firestoreInfo.percentUsed}% Ihres Firestore-Speicherplatzes verwendet. 
                        Bitte löschen Sie nicht benötigte Daten, um Platz freizugeben.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {firestoreInfo.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Fehler bei der Speicherberechnung</AlertTitle>
                      <AlertDescription>{firestoreInfo.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <p>Keine Firestore-Speicherinformationen verfügbar.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}