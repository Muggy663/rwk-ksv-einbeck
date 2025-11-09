import { SchießEintrag, SchießStatistik } from '@/types/schiessnachweis';

const STORAGE_KEY = 'rwk_schiessnachweis';

export class SchießnachweisService {
  static getEinträge(): SchießEintrag[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const einträge = JSON.parse(data);
      return einträge.map((eintrag: any) => ({
        ...eintrag,
        datum: new Date(eintrag.datum),
        createdAt: new Date(eintrag.createdAt)
      }));
    } catch (error) {
      console.error('Fehler beim Laden der Einträge:', error);
      return [];
    }
  }

  static saveEintrag(eintrag: Omit<SchießEintrag, 'id' | 'createdAt'>): SchießEintrag {
    const neuerEintrag: SchießEintrag = {
      ...eintrag,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    const einträge = this.getEinträge();
    einträge.push(neuerEintrag);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(einträge));
    return neuerEintrag;
  }

  static deleteEintrag(id: string): void {
    const einträge = this.getEinträge().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(einträge));
  }

  static getStatistik(): SchießStatistik {
    const einträge = this.getEinträge();
    
    if (einträge.length === 0) {
      return {
        totalSchüsse: 0,
        totalTrainings: 0,
        totalWettkämpfe: 0,
        durchschnittErgebnis: 0,
        bestesErgebnis: 0,
        letzteAktivität: null
      };
    }

    const totalSchüsse = einträge.reduce((sum, e) => sum + e.schussAnzahl, 0);
    const totalTrainings = einträge.filter(e => e.typ === 'training').length;
    const totalWettkämpfe = einträge.filter(e => e.typ === 'wettkampf').length;
    const ergebnisse = einträge.map(e => e.ergebnis);
    const durchschnittErgebnis = ergebnisse.reduce((sum, e) => sum + e, 0) / ergebnisse.length;
    const bestesErgebnis = Math.max(...ergebnisse);
    const letzteAktivität = new Date(Math.max(...einträge.map(e => e.datum.getTime())));

    return {
      totalSchüsse,
      totalTrainings,
      totalWettkämpfe,
      durchschnittErgebnis: Math.round(durchschnittErgebnis * 10) / 10,
      bestesErgebnis,
      letzteAktivität
    };
  }

  static exportData(): string {
    const einträge = this.getEinträge();
    return JSON.stringify(einträge, null, 2);
  }

  static importData(jsonData: string): number {
    try {
      const importedEinträge = JSON.parse(jsonData);
      const existingEinträge = this.getEinträge();
      
      // Merge und Duplikate vermeiden
      const allEinträge = [...existingEinträge];
      let importCount = 0;
      
      importedEinträge.forEach((imported: any) => {
        const exists = allEinträge.some(existing => 
          existing.datum.getTime() === new Date(imported.datum).getTime() &&
          existing.disziplin === imported.disziplin &&
          existing.ergebnis === imported.ergebnis
        );
        
        if (!exists) {
          allEinträge.push({
            ...imported,
            id: Date.now().toString() + Math.random(),
            datum: new Date(imported.datum),
            createdAt: new Date(imported.createdAt || imported.datum)
          });
          importCount++;
        }
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allEinträge));
      return importCount;
    } catch (error) {
      throw new Error('Ungültiges Datenformat');
    }
  }
}