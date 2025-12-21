// Migrations-Script für Altersklassen
// Führe das in der Browser-Konsole aus oder als separates Script

const initAltersklassen = async () => {
  const altersklassen = [
    { klassenId: 10, name: 'Herren I', minAlter: 21, maxAlter: 40, geschlecht: 1 },
    { klassenId: 11, name: 'Damen I', minAlter: 21, maxAlter: 40, geschlecht: 0 },
    { klassenId: 12, name: 'Herren II', minAlter: 41, maxAlter: 50, geschlecht: 1 },
    { klassenId: 13, name: 'Damen II', minAlter: 41, maxAlter: 50, geschlecht: 0 },
    { klassenId: 14, name: 'Herren III', minAlter: 51, maxAlter: 60, geschlecht: 1 },
    { klassenId: 15, name: 'Damen III', minAlter: 51, maxAlter: 60, geschlecht: 0 },
    { klassenId: 16, name: 'Herren IV', minAlter: 61, maxAlter: 70, geschlecht: 1 },
    { klassenId: 17, name: 'Damen IV', minAlter: 61, maxAlter: 70, geschlecht: 0 },
    { klassenId: 18, name: 'Herren V', minAlter: 71, maxAlter: 255, geschlecht: 1 },
    { klassenId: 19, name: 'Damen V', minAlter: 71, maxAlter: 255, geschlecht: 0 },
    { klassenId: 20, name: 'Schüler männl.', minAlter: 0, maxAlter: 14, geschlecht: 1 },
    { klassenId: 21, name: 'Schüler weibl.', minAlter: 0, maxAlter: 14, geschlecht: 0 },
    { klassenId: 30, name: 'Jugend männl.', minAlter: 15, maxAlter: 16, geschlecht: 1 },
    { klassenId: 31, name: 'Jugend weibl.', minAlter: 15, maxAlter: 16, geschlecht: 0 },
    { klassenId: 40, name: 'Junioren I männl.', minAlter: 19, maxAlter: 20, geschlecht: 1 },
    { klassenId: 41, name: 'Junioren I weibl.', minAlter: 19, maxAlter: 20, geschlecht: 0 },
    { klassenId: 42, name: 'Junioren II männl.', minAlter: 17, maxAlter: 18, geschlecht: 1 },
    { klassenId: 43, name: 'Junioren II weibl.', minAlter: 17, maxAlter: 18, geschlecht: 0 },
    { klassenId: 50, name: 'Senioren 0', minAlter: 41, maxAlter: 50, geschlecht: 1 },
    { klassenId: 51, name: 'Seniorinnen 0', minAlter: 41, maxAlter: 50, geschlecht: 0 },
    { klassenId: 70, name: 'Senioren I männl.', minAlter: 51, maxAlter: 60, geschlecht: 1 },
    { klassenId: 71, name: 'Senioren I weibl.', minAlter: 51, maxAlter: 60, geschlecht: 0 },
    { klassenId: 72, name: 'Senioren II männl.', minAlter: 61, maxAlter: 65, geschlecht: 1 },
    { klassenId: 73, name: 'Senioren II weibl.', minAlter: 61, maxAlter: 65, geschlecht: 0 },
    { klassenId: 74, name: 'Senioren III männl.', minAlter: 66, maxAlter: 70, geschlecht: 1 },
    { klassenId: 75, name: 'Senioren III weibl.', minAlter: 66, maxAlter: 70, geschlecht: 0 },
    { klassenId: 76, name: 'Senioren IV männl.', minAlter: 71, maxAlter: 75, geschlecht: 1 },
    { klassenId: 77, name: 'Senioren IV weibl.', minAlter: 71, maxAlter: 75, geschlecht: 0 },
    { klassenId: 78, name: 'Senioren V männl.', minAlter: 76, maxAlter: 255, geschlecht: 1 },
    { klassenId: 79, name: 'Senioren V weibl.', minAlter: 76, maxAlter: 255, geschlecht: 0 },
    { klassenId: 80, name: 'Senioren VI männl.', minAlter: 81, maxAlter: 255, geschlecht: 1 },
    { klassenId: 81, name: 'Seniorinnen VI', minAlter: 81, maxAlter: 255, geschlecht: 0 },
    { klassenId: 99, name: 'offene Klasse', minAlter: 0, maxAlter: 255, geschlecht: 2 }
  ];

  for (const klasse of altersklassen) {
    try {
      const response = await fetch('/api/km/altersklassen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(klasse)
      });
      
      if (response.ok) {
        console.log(`✅ ${klasse.name} erstellt`);
      } else {
        console.error(`❌ Fehler bei ${klasse.name}:`, await response.text());
      }
    } catch (error) {
      console.error(`❌ Fehler bei ${klasse.name}:`, error);
    }
  }
  
  console.log('🎯 Migration abgeschlossen!');
};

// Führe Migration aus
initAltersklassen();