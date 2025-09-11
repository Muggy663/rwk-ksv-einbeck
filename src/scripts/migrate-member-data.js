// Migration Script: Übertrage fehlende Daten von shooters zu clubs/{clubId}/mitglieder
// Führe dieses Script in der Browser-Konsole aus

const migrateMemberData = async () => {
  const clubId = '1icqJ91FFStTBn6ORukx';
  
  try {
    console.log('Starte Migration der Mitgliederdaten...');
    
    // Lade alle Shooters für diesen Club
    const shootersQuery = query(
      collection(db, 'shooters'),
      where('clubId', '==', clubId)
    );
    const shootersSnapshot = await getDocs(shootersQuery);
    console.log(`Gefunden: ${shootersSnapshot.docs.length} Shooters`);
    
    // Lade alle Mitglieder aus neuer Collection
    const membersSnapshot = await getDocs(collection(db, `clubs/${clubId}/mitglieder`));
    console.log(`Gefunden: ${membersSnapshot.docs.length} Mitglieder in neuer Collection`);
    
    let updated = 0;
    
    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      const originalShooterId = memberData.originalShooterId;
      
      if (originalShooterId) {
        // Finde den entsprechenden Shooter
        const shooterDoc = shootersSnapshot.docs.find(doc => doc.id === originalShooterId);
        
        if (shooterDoc) {
          const shooterData = shooterDoc.data();
          
          // Erstelle Update-Objekt mit fehlenden Daten
          const updates = {};
          
          // Vorname/Nachname aus name extrahieren falls leer
          if (!memberData.vorname && shooterData.name) {
            const nameParts = shooterData.name.split(' ');
            updates.vorname = nameParts[0] || '';
            updates.firstName = nameParts[0] || '';
            updates.lastName = nameParts.slice(1).join(' ') || '';
          }
          
          // Adressdaten
          if (shooterData.address && !memberData.strasse) {
            updates.strasse = shooterData.address;
          }
          if (shooterData.zipCode && !memberData.plz) {
            updates.plz = shooterData.zipCode;
          }
          if (shooterData.city && !memberData.ort) {
            updates.ort = shooterData.city;
          }
          
          // Kontaktdaten
          if (shooterData.email && !memberData.email) {
            updates.email = shooterData.email;
          }
          if (shooterData.phone && !memberData.telefon) {
            updates.telefon = shooterData.phone;
          }
          if (shooterData.mobile && !memberData.mobil) {
            updates.mobil = shooterData.mobile;
          }
          
          // Geburtstag
          if (shooterData.geburtstag && !memberData.geburtsdatum) {
            updates.geburtsdatum = shooterData.geburtstag;
            updates.geburtstag = shooterData.geburtstag;
          }
          
          // Vereinseintritt
          if (shooterData.vereinseintritt && !memberData.eintrittsdatum) {
            updates.eintrittsdatum = shooterData.vereinseintritt;
            updates.vereinseintritt = shooterData.vereinseintritt;
          }
          
          // DSB-Eintritt
          if (shooterData.dsbeintritt && !memberData.dsbeintritt) {
            updates.dsbeintritt = shooterData.dsbeintritt;
          }
          
          // Nur updaten wenn es Änderungen gibt
          if (Object.keys(updates).length > 0) {
            updates.updatedAt = new Date();
            
            const memberRef = doc(db, `clubs/${clubId}/mitglieder`, memberDoc.id);
            await updateDoc(memberRef, updates);
            
            updated++;
            console.log(`Updated: ${memberData.name} (${Object.keys(updates).length} Felder)`);
          }
        }
      }
    }
    
    console.log(`Migration abgeschlossen! ${updated} Mitglieder aktualisiert.`);
    
  } catch (error) {
    console.error('Fehler bei Migration:', error);
  }
};

// Script ausführen
migrateMemberData();