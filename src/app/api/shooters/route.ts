// src/app/api/shooters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeMembers = url.searchParams.get('includeMembers') === 'true';
    
    // Lade RWK-Schützen
    const rwkSnapshot = await getDocs(collection(db, 'rwk_shooters'));
    const rwkShooters = rwkSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      source: 'rwk'
    }));
    
    let allShooters = [...rwkShooters];
    
    // Für KM: Lade auch Vereinsmitglieder
    if (includeMembers) {
      try {
        const membersSnapshot = await getDocs(collection(db, 'club_members'));
        const clubMembers = membersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          source: 'club_member'
        }));
        
        // Lade Vereine für Namen-Matching
        const clubsSnapshot = await getDocs(collection(db, 'clubs'));
        const clubs = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Robustes Vereins-Matching
        const normalizeString = (str) => {
          return str
            .toLowerCase()
            .trim()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]/g, '');
        };
        
        const findClubByName = (excelName, clubs) => {
          const normalizedExcel = normalizeString(excelName);
          return clubs.find(club => 
            normalizeString(club.name).includes(normalizedExcel) ||
            normalizedExcel.includes(normalizeString(club.name))
          );
        };
        
        // Füge Mitglieder hinzu, die nicht bereits als RWK-Schützen vorhanden sind
        clubMembers.forEach(member => {
          if (!member.name) return;
          
          // Vereins-ID durch Namen-Matching finden
          if (member.clubName && !member.clubId) {
            const matchedClub = findClubByName(member.clubName, clubs);
            if (matchedClub) {
              member.clubId = matchedClub.id;
              member.clubName = matchedClub.name; // Normalisieren
            }
          }
          
          const existsInRwk = rwkShooters.some(rwk => 
            rwk.name === member.name && (rwk.clubId === member.clubId || rwk.rwkClubId === member.clubId)
          );
          
          if (!existsInRwk) {
            allShooters.push(member);
          }
        });
      } catch (memberError) {
        console.warn('club_members Collection nicht gefunden, verwende nur RWK-Schützen');
      }
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
    console.log('DELETE request received');
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    console.log('Action:', action);
    
    if (action === 'cleanup-duplicates') {
      console.log('Starting duplicate cleanup...');
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
      
      console.log('Duplicates to delete:', toDelete.length);
      
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
      console.log('Starting cleanup...');
      // Lösche rwk_shooters mit createdAt (Excel-Importe)
      const snapshot = await getDocs(collection(db, 'rwk_shooters'));
      console.log('Loaded shooters:', snapshot.docs.length);
      
      const shooters = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      
      // Lösche nur Schützen mit createdAt (= Excel-Importe)
      const toDelete = shooters.filter(s => s.createdAt);
      console.log('To delete:', toDelete.length);
      
      if (toDelete.length > 0) {
        // Verwende Batch für bessere Performance
        const batch = writeBatch(db);
        toDelete.forEach(s => {
          batch.delete(doc(db, 'rwk_shooters', s.id));
        });
        
        await batch.commit();
        console.log('Deletion completed');
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