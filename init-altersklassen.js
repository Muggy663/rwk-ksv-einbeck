// Führe das in der Browser-Konsole aus auf http://localhost:3000/km-orga/altersklassen

const initDB = async () => {
  const altersklassen = [
    { klassenId: 10, name: 'Herren I', minAlter: 21, maxAlter: 40, geschlecht: 1 },
    { klassenId: 11, name: 'Damen I', minAlter: 21, maxAlter: 40, geschlecht: 0 },
    { klassenId: 18, name: 'Herren V', minAlter: 71, maxAlter: 255, geschlecht: 1 },
    { klassenId: 19, name: 'Damen V', minAlter: 71, maxAlter: 255, geschlecht: 0 },
    { klassenId: 50, name: 'Senioren 0', minAlter: 41, maxAlter: 50, geschlecht: 1 },
    { klassenId: 51, name: 'Seniorinnen 0', minAlter: 41, maxAlter: 50, geschlecht: 0 }
  ];

  for (const klasse of altersklassen) {
    try {
      const response = await fetch('/api/km/altersklassen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(klasse)
      });
      const result = await response.json();
      console.log(`${klasse.name}:`, response.ok ? '✅' : '❌', result);
    } catch (error) {
      console.error(`${klasse.name}: ❌`, error);
    }
  }
};

initDB();