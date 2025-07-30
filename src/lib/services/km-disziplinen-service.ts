// src/lib/services/km-disziplinen-service.ts
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const DISZIPLINEN_2026 = [
  // Luftgewehr Freihand
  { spoNummer: '1.10', name: 'Luftgewehr', nurVereinsmeisterschaft: false, auflage: false },
  { spoNummer: '1.12', name: '10m Luftgewehr MixTeam', nurVereinsmeisterschaft: false, auflage: false },
  { spoNummer: '1.20', name: '10m Luftgewehr 3-Stellung', nurVereinsmeisterschaft: true, auflage: false },
  { spoNummer: '1.30', name: 'Zimmerstutzen', nurVereinsmeisterschaft: false, auflage: false },
  { spoNummer: '1.35', name: 'KK - 100m', nurVereinsmeisterschaft: true, auflage: false },
  { spoNummer: '1.40', name: 'KK - 3x20 ( 3 Pos )', nurVereinsmeisterschaft: true, auflage: false },
  { spoNummer: '1.42', name: 'KK - Gewehr 30 Schuss', nurVereinsmeisterschaft: false, auflage: false },
  { spoNummer: '1.60', name: 'KK - 3x40', nurVereinsmeisterschaft: false, auflage: false },
  { spoNummer: '1.80', name: 'KK - Liegendkampf', nurVereinsmeisterschaft: false, auflage: false },
  
  // Luftpistole Freihand
  { spoNummer: '2.10', name: '10m Luftpistole', nurVereinsmeisterschaft: false, auflage: false },
  { spoNummer: '2.12', name: '10m LP MixTeam', nurVereinsmeisterschaft: false, auflage: false },
  { spoNummer: '2.17', name: '10m LP Mehrkampf', nurVereinsmeisterschaft: false, auflage: false },
  { spoNummer: '2.18', name: '10m LP Standard', nurVereinsmeisterschaft: false, auflage: false },
  { spoNummer: '2.20', name: '50m Pistole', nurVereinsmeisterschaft: false, auflage: false },
  { spoNummer: '2.30', name: '25m Schnellfeuerpistole', nurVereinsmeisterschaft: false, auflage: false },
  { spoNummer: '2.40', name: '25m Pistole', nurVereinsmeisterschaft: false, auflage: false },
  { spoNummer: '2.45', name: '25m Zentralfeuerpistole', nurVereinsmeisterschaft: false, auflage: false },
  { spoNummer: '2.60', name: '25m Standardpistole', nurVereinsmeisterschaft: false, auflage: false },
  
  // Armbrust Freihand
  { spoNummer: '5.10', name: 'Armbrust 10m', nurVereinsmeisterschaft: false, auflage: false },
  { spoNummer: '5.20', name: 'Armbrust 30m', nurVereinsmeisterschaft: false, auflage: false },
  
  // AUFLAGE-DISZIPLINEN
  { spoNummer: '1.11', name: 'Luftgewehr Auflage', nurVereinsmeisterschaft: false, auflage: true },
  { spoNummer: '1.19', name: 'Luftgewehr Auflage sitzend', nurVereinsmeisterschaft: false, auflage: true },
  { spoNummer: '1.31', name: 'Zimmerstutzen Auflage', nurVereinsmeisterschaft: false, auflage: true },
  { spoNummer: '1.36', name: 'KK Gewehr Auflage 100m', nurVereinsmeisterschaft: false, auflage: true },
  { spoNummer: '1.39', name: 'KK Gewehr Auflage 100m sitzend', nurVereinsmeisterschaft: false, auflage: true },
  { spoNummer: '1.41', name: 'KK-Gewehr Auflage 50m', nurVereinsmeisterschaft: false, auflage: true },
  { spoNummer: '1.43', name: 'KK Gewehr 50 m Zielf. aufgelegt', nurVereinsmeisterschaft: false, auflage: true },
  { spoNummer: '1.44', name: 'KK Gewehr 100 m Zielf. aufgelegt', nurVereinsmeisterschaft: false, auflage: true },
  { spoNummer: '1.49', name: 'KK-Gewehr Auflage 50m sitzend', nurVereinsmeisterschaft: false, auflage: true },
  { spoNummer: '2.11', name: '10 m Luftpistole Auflage', nurVereinsmeisterschaft: false, auflage: true },
  { spoNummer: '2.21', name: '50 m Freie Pistole Auflage', nurVereinsmeisterschaft: false, auflage: true },
  { spoNummer: '2.42', name: '25 m Sportpistole Auflage', nurVereinsmeisterschaft: false, auflage: true },
  { spoNummer: '5.11', name: 'Armbrust 10m Auflage', nurVereinsmeisterschaft: false, auflage: true },
  
  // Lichtgewehr/Lichtpistole (nur 6-11 Jahre - Vereinsmeisterschaft)
  { spoNummer: '11.10', name: 'Lichtgewehr', nurVereinsmeisterschaft: true, auflage: false },
  { spoNummer: '11.11', name: 'Faszination Lichtgewehr', nurVereinsmeisterschaft: true, auflage: false },
  { spoNummer: '11.20', name: 'Lichtgewehr 3-stellung', nurVereinsmeisterschaft: true, auflage: false },
  { spoNummer: '11.50', name: 'Lichtpistole', nurVereinsmeisterschaft: true, auflage: false },
  { spoNummer: '11.51', name: 'Faszination Lichtpistole', nurVereinsmeisterschaft: true, auflage: false }

];

export async function generateDisziplinen2026(): Promise<void> {
  const collectionRef = collection(db, 'km_disziplinen');
  
  // Lösche ALLE bestehenden Disziplinen für komplette Neu-Erstellung
  const existingSnapshot = await getDocs(collectionRef);
  const { deleteDoc, doc } = await import('firebase/firestore');
  
  for (const docSnap of existingSnapshot.docs) {
    await deleteDoc(doc(db, 'km_disziplinen', docSnap.id));
  }
  
  // Erstelle alle Disziplinen neu mit auflage-Flag
  for (const disziplin of DISZIPLINEN_2026) {
    await addDoc(collectionRef, {
      ...disziplin,
      saison: '2026',
      createdAt: new Date()
    });
  }
}

export async function getAllDisziplinen() {
  const snapshot = await getDocs(collection(db, 'km_disziplinen'));
  const disziplinen = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Nach SpO-Nummer sortieren
  return disziplinen.sort((a, b) => {
    const aNum = parseFloat(a.spoNummer);
    const bNum = parseFloat(b.spoNummer);
    return aNum - bNum;
  });
}