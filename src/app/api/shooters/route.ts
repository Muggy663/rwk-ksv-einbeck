// src/app/api/shooters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { secureLogger } from '@/lib/utils/secure-logger';
import { sanitizeInput, InputValidator } from '@/lib/utils/input-validator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const firstName = sanitizeInput(body.firstName);
    const lastName = sanitizeInput(body.lastName);
    const birthYear = parseInt(sanitizeInput(body.birthYear));
    const gender = sanitizeInput(body.gender);
    const mitgliedsnummer = sanitizeInput(body.mitgliedsnummer);
    const clubId = sanitizeInput(body.clubId);

    // Sichere Validierung
    if (!firstName || !lastName || !birthYear || !gender || !clubId) {
      secureLogger.warn('Missing required fields in shooter creation', 'shooters-api');
      return NextResponse.json({
        success: false,
        error: 'Alle Pflichtfelder müssen ausgefüllt werden'
      }, { status: 400 });
    }

    // Validiere Geburtsjahr
    if (!InputValidator.isValidNumber(birthYear, 1900, new Date().getFullYear())) {
      secureLogger.warn('Invalid birth year in shooter creation', 'shooters-api');
      return NextResponse.json({
        success: false,
        error: 'Ungültiges Geburtsjahr'
      }, { status: 400 });
    }

    // Validiere Geschlecht
    if (!['M', 'W', 'männlich', 'weiblich'].includes(gender)) {
      secureLogger.warn('Invalid gender in shooter creation', 'shooters-api');
      return NextResponse.json({
        success: false,
        error: 'Ungültiges Geschlecht'
      }, { status: 400 });
    }

    const shooterData = {
      firstName: firstName.substring(0, 50),
      lastName: lastName.substring(0, 50),
      name: lastName.substring(0, 50), // Für Kompatibilität
      birthYear: birthYear,
      gender: gender,
      mitgliedsnummer: mitgliedsnummer ? mitgliedsnummer.substring(0, 20) : null,
      kmClubId: clubId.substring(0, 50),
      rwkClubId: null,
      isActive: true,
      genderGuessed: false,
      createdAt: FieldValue.serverTimestamp(),
      importedAt: FieldValue.serverTimestamp()
    };

    const docRef = await adminDb.collection('shooters').add(shooterData);

    return NextResponse.json({
      success: true,
      message: 'Schütze erfolgreich angelegt',
      id: docRef.id
    });

  } catch (error) {
    secureLogger.error('Shooter creation failed', 'shooters-api');
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
    const clubId = sanitizeInput(url.searchParams.get('clubId') || ''); // Vereins-Filter
    
    let allShooters = [];
    
    if (includeMembers) {
      // Für KM: Lade nur KM-Schützen
      try {
        const kmSnapshot = await adminDb.collection('km_shooters').get();
        allShooters = kmSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          source: 'km_shooter'
        }));
      } catch (kmError) {
        secureLogger.warn('km_shooters collection not found', 'shooters-api');
      }
    } else {
      // Für RWK: Lade zentrale Schützen
      const shootersSnapshot = await adminDb.collection('shooters').get();
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
    secureLogger.error('Shooters loading failed', 'shooters-api');
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
      const snapshot = await adminDb.collection('shooters').get();
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
        const batch = adminDb.batch();
        toDelete.forEach(s => {
          batch.delete(adminDb.collection('shooters').doc(s.id));
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
      const snapshot = await adminDb.collection('shooters').get();
      const shooters = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      
      // Lösche nur Schützen mit createdAt (= Excel-Importe)
      const toDelete = shooters.filter(s => s.createdAt);
      
      if (toDelete.length > 0) {
        // Verwende Batch für bessere Performance
        const batch = adminDb.batch();
        toDelete.forEach(s => {
          batch.delete(adminDb.collection('shooters').doc(s.id));
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
    secureLogger.error('Shooters cleanup failed', 'shooters-api');
    return NextResponse.json({
      success: false,
      error: 'Cleanup fehlgeschlagen'
    }, { status: 500 });
  }
}
