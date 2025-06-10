import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

const STORAGE_THRESHOLD_KB = 450 * 1024; // 450 MB in KB

async function checkFirestoreUsage() {
  try {
    // Firebase Admin initialisieren, falls noch nicht geschehen
    if (getApps().length === 0) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
      );
      
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    
    const db = getFirestore();
    
    // Sammle Statistiken über alle Sammlungen
    const collections = [
      'seasons', 'leagues', 'clubs', 'teams', 
      'shooters', 'results', 'users', 'documents'
    ];
    
    let totalSizeInKB = 0;
    let collectionStats = [];
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      
      // Schätze die Größe basierend auf der Dokumentenanzahl und durchschnittlicher Größe
      const docCount = snapshot.size;
      const sampleDocs = snapshot.docs.slice(0, Math.min(10, docCount));
      
      let totalSampleSize = 0;
      for (const doc of sampleDocs) {
        const data = doc.data();
        // Grobe Schätzung der JSON-Größe
        totalSampleSize += JSON.stringify(data).length;
      }
      
      const avgDocSize = sampleDocs.length > 0 ? totalSampleSize / sampleDocs.length : 0;
      const estimatedSizeInKB = (docCount * avgDocSize) / 1024;
      
      totalSizeInKB += estimatedSizeInKB;
      
      collectionStats.push({
        collection: collectionName,
        documentCount: docCount,
        estimatedSizeInKB: Math.round(estimatedSizeInKB)
      });
    }
    
    // Runde auf 2 Dezimalstellen
    totalSizeInKB = Math.round(totalSizeInKB * 100) / 100;
    const totalSizeInMB = totalSizeInKB / 1024;
    
    // Prüfe, ob der Schwellenwert überschritten wurde
    const isNearLimit = totalSizeInKB >= STORAGE_THRESHOLD_KB;
    
    return {
      totalSizeInKB,
      totalSizeInMB,
      isNearLimit,
      limitInMB: 1024, // 1 GB
      thresholdInMB: STORAGE_THRESHOLD_KB / 1024,
      percentUsed: Math.round((totalSizeInKB / (1024 * 1024)) * 100),
      collectionStats
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Firestore-Statistiken:', error);
    return {
      error: 'Fehler beim Abrufen der Firestore-Statistiken',
      totalSizeInKB: 0,
      totalSizeInMB: 0,
      isNearLimit: false,
      limitInMB: 1024,
      thresholdInMB: STORAGE_THRESHOLD_KB / 1024,
      percentUsed: 0,
      collectionStats: []
    };
  }
}

export async function GET() {
  try {
    const storageInfo = await checkFirestoreUsage();
    return NextResponse.json(storageInfo);
  } catch (error) {
    console.error('Fehler beim Prüfen des Firestore-Speicherplatzes:', error);
    return NextResponse.json(
      { error: 'Fehler beim Prüfen des Firestore-Speicherplatzes' },
      { status: 500 }
    );
  }
}