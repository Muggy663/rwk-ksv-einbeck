import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const STORAGE_THRESHOLD_MB = 450;

async function checkStorageUsage(mongoUri: string) {
  let client: MongoClient | null = null;
  
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    
    // Hole nur die Statistiken für die rwk_einbeck-Datenbank
    const db = client.db('rwk_einbeck');
    const stats = await db.stats();
    
    // Konvertiere Bytes in MB (1 MB = 1024 * 1024 Bytes)
    const sizeInMB = stats.dataSize / (1024 * 1024);
    
    // Runde auf 2 Dezimalstellen
    const rwkEinbeckSizeInMB = Math.round(sizeInMB * 100) / 100;
    
    // Prüfe, ob der Schwellenwert überschritten wurde
    const isNearLimit = rwkEinbeckSizeInMB >= STORAGE_THRESHOLD_MB;
    
    // Berechne den Prozentsatz der Nutzung
    const percentUsed = Math.round((rwkEinbeckSizeInMB / 512) * 100);
    

    
    return {
      totalSizeInMB: rwkEinbeckSizeInMB,
      rwkEinbeckSizeInMB,
      isNearLimit,
      limit: 512,
      threshold: STORAGE_THRESHOLD_MB,
      percentUsed: Math.min(percentUsed, 100), // Begrenze auf maximal 100%
      stats
    };
  } catch (error) {
    // Stille Behandlung - MongoDB ist optional für File Server
    return {
      totalSizeInMB: 0,
      rwkEinbeckSizeInMB: 0,
      isNearLimit: false,
      limit: 512,
      threshold: STORAGE_THRESHOLD_MB,
      percentUsed: 0,
      error: null // Keine Fehleranzeige
    };
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (error) {
        console.error('Fehler beim Schließen der MongoDB-Verbindung:', error);
      }
    }
  }
}

export async function GET() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      return NextResponse.json({
        totalSizeInMB: 0,
        rwkEinbeckSizeInMB: 0,
        isNearLimit: false,
        limit: 512,
        threshold: STORAGE_THRESHOLD_MB,
        percentUsed: 0,
        message: 'MongoDB nicht konfiguriert - File Server deaktiviert'
      });
    }
    
    const storageInfo = await checkStorageUsage(mongoUri);
    
    return NextResponse.json(storageInfo);
  } catch (error) {
    // Stille Behandlung - MongoDB ist optional
    return NextResponse.json({
      totalSizeInMB: 0,
      rwkEinbeckSizeInMB: 0,
      isNearLimit: false,
      limit: 512,
      threshold: STORAGE_THRESHOLD_MB,
      percentUsed: 0,
      message: 'File Server nicht aktiv'
    });
  }
}
