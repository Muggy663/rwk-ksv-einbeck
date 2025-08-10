// src/app/api/shooters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, deleteDoc, doc, writeBatch, addDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, birthYear, gender, mitgliedsnummer, clubId } = body;

    // Validierung
    if (!firstName || !lastName || !birthYear || !gender || !clubId) {
      return NextResponse.json({
        success: false,
        error: 'Alle Pflichtfelder müssen ausgefüllt werden'
      }, { status: 400 });
    }

    const shooterData = {
      firstName,
      lastName,
      name: lastName, // Für Kompatibilität
      birthYear: parseInt(birthYear),
      gender,
      mitgliedsnummer: mitgliedsnummer || null,
      kmClubId: clubId,
      rwkClubId: null,
      isActive: true,
      genderGuessed: false,
      createdAt: new Date(),
      importedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'shooters'), shooterData);

    return NextResponse.json({
      success: true,
      message: 'Schütze erfolgreich angelegt',
      id: docRef.id
    });

  } catch (error) {
    console.error('Fehler beim Anlegen des Schützen:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Anlegen des Schützen'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeMembers = url.searchParams.get('includeMembers') === 'true';
    const clubId = url.searchParams.get('clubId'); // Vereins-Filter
    
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
      // Für RWK: Lade zentrale Schützen
      const shootersSnapshot = await getDocs(collection(db, 'shooters'));
      let shooters = shootersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'central'
      }));
      
      // Filtere nach Verein wenn clubId angegeben
      if (clubId) {
        shooters = shooters.filter(shooter => {
          const shooterClubId = shooter.clubId || shooter.rwkClubId || shooter.kmClubId;
          return shooterClubId === clubId;
        });
      }
      
      allShooters = shooters;
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

      const snapshot = await getDocs(collection(db, 'shooters'));
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
          batch.delete(doc(db, 'shooters', s.id));
        });
        
        await batch.commit();
      }
      
      return NextResponse.json({
        success: true,
        message: `${toDelete.length} Duplikate entfernt`
      });
    }
    
    if (action === 'cleanup-imports') {

      // Lösche shooters mit createdAt (Excel-Importe)
      const snapshot = await getDocs(collection(db, 'shooters'));

      
      const shooters = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      
      // Lösche nur Schützen mit createdAt (= Excel-Importe)
      const toDelete = shooters.filter(s => s.createdAt);

      
      if (toDelete.length > 0) {
        // Verwende Batch für bessere Performance
        const batch = writeBatch(db);
        toDelete.forEach(s => {
          batch.delete(doc(db, 'shooters', s.id));
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
