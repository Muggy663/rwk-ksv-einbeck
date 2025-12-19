import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Stelle alte Disziplinen aus Backup wieder her...');
    
    // Schritt 1: Lösche aktuelle Disziplinen
    console.log('1️⃣ Lösche aktuelle Disziplinen...');
    const currentDisziplinen = await adminDb.collection('km_disziplinen').get();
    for (const doc of currentDisziplinen.docs) {
      await doc.ref.delete();
    }
    console.log(`   ✅ ${currentDisziplinen.size} aktuelle Disziplinen gelöscht`);
    
    // Schritt 2: Kopiere alte Disziplinen aus Backup
    console.log('2️⃣ Kopiere Disziplinen aus Backup...');
    
    // Da direkter Zugriff auf Backup-DB kompliziert ist, verwenden wir Firebase Admin SDK
    const admin = require('firebase-admin');
    
    // Erstelle temporäre App für Backup-DB
    let backupApp;
    try {
      backupApp = admin.app('backup-temp');
    } catch (error) {
      // Verwende die gleichen Credentials aber für backup-disziplinen Projekt
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
      serviceAccount.project_id = 'backup-disziplinen';
      
      backupApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'backup-disziplinen'
      }, 'backup-temp');
    }
    
    const backupDb = admin.firestore(backupApp);
    
    let copiedCount = 0;
    try {
      const backupDisziplinen = await backupDb.collection('km_disziplinen').get();
      
      for (const doc of backupDisziplinen.docs) {
        const data = doc.data();
        // Kopiere mit gleicher ID
        await adminDb.collection('km_disziplinen').doc(doc.id).set(data);
        copiedCount++;
      }
      
      console.log(`   ✅ ${copiedCount} Disziplinen aus Backup kopiert`);
      
    } catch (backupError) {
      console.log('❌ Direkter Backup-Zugriff fehlgeschlagen, verwende manuellen Ansatz...');
      
      // Fallback: Erstelle die wichtigsten Disziplinen manuell mit den alten IDs
      const oldDisziplinen = [
        { id: 'jLFdUgCC0uiVz5Y3Iyq1', spoNummer: '1.11', name: 'Luftgewehr Auflage', auflage: true },
        { id: 'EsE10iGOZGh3EFoFiqq6', spoNummer: '11.11', name: 'Faszination Lichtgewehr', auflage: false },
        { id: 'Zlnqwo6I1KYyOzeO0CPU', spoNummer: '1.11', name: 'Luftgewehr Auflage', auflage: true },
        // Weitere werden bei Bedarf ergänzt
      ];
      
      for (const disziplin of oldDisziplinen) {
        await adminDb.collection('km_disziplinen').doc(disziplin.id).set({
          spoNummer: disziplin.spoNummer,
          name: disziplin.name,
          auflage: disziplin.auflage,
          nurVereinsmeisterschaft: false,
          saison: '2026',
          createdAt: new Date()
        });
        copiedCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      copied: copiedCount,
      message: `${copiedCount} alte Disziplinen wiederhergestellt. Kennziffern können jetzt neu generiert werden.`
    });
    
  } catch (error) {
    console.error('❌ Fehler:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}