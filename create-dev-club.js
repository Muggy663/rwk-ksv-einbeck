// Development Club mit Testdaten erstellen
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBuUGk_5_Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8",
  authDomain: "rwk-einbeck.firebaseapp.com",
  projectId: "rwk-einbeck",
  storageBucket: "rwk-einbeck.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const createDevClub = async () => {
  try {
    // 1. Development Club erstellen
    const devClubId = 'dev-test-club';
    await setDoc(doc(db, 'clubs', devClubId), {
      name: 'Development Test Verein',
      shortName: 'DEV',
      address: 'Teststraße 123',
      city: 'Teststadt',
      zipCode: '12345',
      email: 'dev@test.de',
      phone: '0123456789',
      website: 'https://dev-test.de',
      founded: '2020-01-01',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Development Club erstellt:', devClubId);

    // 2. Super-Admin Development-Zugang geben
    await setDoc(doc(db, 'user_permissions', 'nr4qSNvqUoZvtD9tUSPhhiQmMWj2'), {
      email: 'admin@rwk-einbeck.de',
      platformRole: 'SUPER_ADMIN',
      devClubId: devClubId, // Development Club-ID
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }, { merge: true });

    console.log('✅ Super-Admin Development-Zugang gesetzt');

    // 3. 20 Test-Mitglieder erstellen
    const testMembers = [
      { firstName: 'Max', lastName: 'Mustermann', gender: 'male', birthYear: 1985 },
      { firstName: 'Anna', lastName: 'Schmidt', gender: 'female', birthYear: 1990 },
      { firstName: 'Peter', lastName: 'Müller', gender: 'male', birthYear: 1978 },
      { firstName: 'Lisa', lastName: 'Weber', gender: 'female', birthYear: 1995 },
      { firstName: 'Thomas', lastName: 'Wagner', gender: 'male', birthYear: 1982 },
      { firstName: 'Sarah', lastName: 'Becker', gender: 'female', birthYear: 1988 },
      { firstName: 'Michael', lastName: 'Schulz', gender: 'male', birthYear: 1975 },
      { firstName: 'Julia', lastName: 'Hoffmann', gender: 'female', birthYear: 1992 },
      { firstName: 'Andreas', lastName: 'Fischer', gender: 'male', birthYear: 1980 },
      { firstName: 'Stefanie', lastName: 'Meyer', gender: 'female', birthYear: 1987 },
      { firstName: 'Daniel', lastName: 'Koch', gender: 'male', birthYear: 1983 },
      { firstName: 'Nicole', lastName: 'Richter', gender: 'female', birthYear: 1991 },
      { firstName: 'Markus', lastName: 'Klein', gender: 'male', birthYear: 1979 },
      { firstName: 'Claudia', lastName: 'Wolf', gender: 'female', birthYear: 1986 },
      { firstName: 'Stefan', lastName: 'Schröder', gender: 'male', birthYear: 1984 },
      { firstName: 'Melanie', lastName: 'Neumann', gender: 'female', birthYear: 1993 },
      { firstName: 'Christian', lastName: 'Schwarz', gender: 'male', birthYear: 1981 },
      { firstName: 'Katrin', lastName: 'Zimmermann', gender: 'female', birthYear: 1989 },
      { firstName: 'Florian', lastName: 'Braun', gender: 'male', birthYear: 1977 },
      { firstName: 'Sabine', lastName: 'Hartmann', gender: 'female', birthYear: 1994 }
    ];

    for (let i = 0; i < testMembers.length; i++) {
      const member = testMembers[i];
      const memberData = {
        firstName: member.firstName,
        lastName: member.lastName,
        name: `${member.firstName} ${member.lastName}`,
        mitgliedsnummer: String(i + 1).padStart(3, '0'),
        strasse: `Teststraße ${i + 10}`,
        plz: '12345',
        ort: 'Teststadt',
        email: `${member.firstName.toLowerCase()}.${member.lastName.toLowerCase()}@test.de`,
        telefon: `0123${String(i + 100).padStart(6, '0')}`,
        mobil: `0171${String(i + 200).padStart(7, '0')}`,
        geburtstag: `${member.birthYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        geburtsdatum: `${member.birthYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        gender: member.gender,
        geschlecht: member.gender,
        vereinseintritt: `${2015 + Math.floor(Math.random() * 8)}-01-01`,
        eintrittsdatum: `${2015 + Math.floor(Math.random() * 8)}-01-01`,
        dsbeintritt: `${2015 + Math.floor(Math.random() * 8)}-01-01`,
        isActive: Math.random() > 0.1, // 90% aktiv
        status: Math.random() > 0.1 ? 'aktiv' : 'inaktiv',
        clubId: devClubId,
        createdAt: new Date(),
        updatedAt: new Date(),
        // SEPA-Testdaten
        sepa: {
          iban: `DE${String(Math.floor(Math.random() * 100)).padStart(2, '0')}1234567890123456${String(i).padStart(2, '0')}`,
          bic: 'TESTDE21XXX',
          kontoinhaber: `${member.firstName} ${member.lastName}`,
          mandatsdatum: '2023-01-01',
          mandatsreferenz: `DEV-${String(i + 1).padStart(3, '0')}-2025`,
          verwendungszweck: 'Mitgliedsbeitrag'
        }
      };

      await addDoc(collection(db, `clubs/${devClubId}/mitglieder`), memberData);
      console.log(`✅ Mitglied ${i + 1}/20 erstellt: ${member.firstName} ${member.lastName}`);
    }

    console.log('\n🎉 Development Club erfolgreich erstellt!');
    console.log(`📊 Club-ID: ${devClubId}`);
    console.log(`👥 20 Test-Mitglieder erstellt`);
    console.log(`🔧 Super-Admin hat automatisch Zugang`);
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen:', error);
  }
};

createDevClub();