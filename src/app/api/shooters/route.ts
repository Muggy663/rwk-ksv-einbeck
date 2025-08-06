// src/app/api/shooters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeMembers = url.searchParams.get('includeMembers') === 'true';
    
    let allShooters = [];
    
    if (includeMembers) {
      // Für KM: Lade nur KM-Schützen
      try {
        const kmSnapshot = await getDocs(collection(db, 'km_shooters'));
        allShooters = kmSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          source: 'km_shooter'
        }));
      } catch (kmError) {
        console.warn('km_shooters Collection nicht gefunden');
      }
    } else {
      // Für RWK: Lade RWK-Schützen
      const rwkSnapshot = await getDocs(collection(db, 'rwk_shooters'));
      allShooters = rwkSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'rwk'
      }));
    }

    return NextResponse.json({
      success: true,
      data: allShooters
    });

  } catch (error) {
    console.error('Fehler beim Laden der Schützen:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Schützen'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    
    if (action === 'cleanup-duplicates') {

      const snapshot = await getDocs(collection(db, 'rwk_shooters'));
      const shooters = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      
      // Finde Duplikate (gleicher Name)
      const nameGroups = shooters.reduce((acc, s) => {
        if (!acc[s.name]) acc[s.name] = [];
        acc[s.name].push(s);
        return acc;
      }, {});
      
      const toDelete = [];
      Object.values(nameGroups).forEach((group: any) => {
        if (group.length > 1) {
          // Behalte RWK-Teilnehmer (mit rwkClubId), lösche Excel-Importe
          const rwkShooter = group.find(s => s.rwkClubId);
          const duplicates = group.filter(s => !s.rwkClubId && s.id !== rwkShooter?.id);
          toDelete.push(...duplicates);
        }
      });
      

      
      if (toDelete.length > 0) {
        const batch = writeBatch(db);
        toDelete.forEach(s => {
          batch.delete(doc(db, 'rwk_shooters', s.id));
        });
        
        await batch.commit();
      }
      
      return NextResponse.json({
        success: true,
        message: `${toDelete.length} Duplikate entfernt`
      });
    }
    
    if (action === 'cleanup-imports') {

      // Lösche rwk_shooters mit createdAt (Excel-Importe)
      const snapshot = await getDocs(collection(db, 'rwk_shooters'));

      
      const shooters = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      
      // Lösche nur Schützen mit createdAt (= Excel-Importe)
      const toDelete = shooters.filter(s => s.createdAt);

      
      if (toDelete.length > 0) {
        // Verwende Batch für bessere Performance
        const batch = writeBatch(db);
        toDelete.forEach(s => {
          batch.delete(doc(db, 'rwk_shooters', s.id));
        });
        
        await batch.commit();

      }
      
      return NextResponse.json({
        success: true,
        message: `${toDelete.length} Excel-Importe gelöscht, ${shooters.length - toDelete.length} RWK-Teilnehmer erhalten`
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Ungültiger action Parameter'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Cleanup Fehler Details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json({
      success: false,
      error: `Cleanup fehlgeschlagen: ${error.message}`,
      code: error.code
    }, { status: 500 });
  }
}
