import { SchießnachweisService } from './schiessnachweis-service';
import { SocialTrainingService } from './social-training-service';
import { SchießEintrag } from '@/types/schiessnachweis';
import { TrainingResult } from '@/types/social-training';

/**
 * Unified Training Service - Zentrale Verwaltung für alle Trainingsdaten
 * Verbindet Schießnachweis und Social Training nahtlos
 */
export class UnifiedTrainingService {
  
  /**
   * Speichere Ergebnis in beiden Systemen
   */
  static async saveTrainingResult(data: {
    // Schießnachweis-Daten
    datum: Date;
    typ: 'training' | 'wettkampf';
    disziplin: string;
    schussAnzahl: number;
    ergebnis: number; // Zehntel-Ergebnis (Hauptfeld)
    ergebnisGanzeRinge?: number; // Ganze Ringe
    standort: string;
    schiessstand?: string;
    wetter?: string;
    munition?: string;
    waffe?: string;
    notizen?: string;
    serien?: any[];
    
    // Social Training Optionen
    socialTraining: boolean;
    groupId?: string;
    competitionId?: string;
    proofType?: 'photo' | 'trust' | 'verified';
    photo?: File;
  }): Promise<{ schiessnachweis: SchießEintrag; socialTraining?: TrainingResult }> {
    
    // 1. Speichere in Schießnachweis
    const schiessEintrag = await SchießnachweisService.saveEintrag({
      datum: data.datum,
      typ: data.typ,
      disziplin: data.disziplin,
      schussAnzahl: data.schussAnzahl,
      ergebnis: data.ergebnis, // Zehntel-Ergebnis
      ergebnisGanzeRinge: data.ergebnisGanzeRinge, // Ganze Ringe
      standort: data.standort,
      schiessstand: data.schiessstand || '',
      wetter: data.wetter || '',
      munition: data.munition || '',
      waffe: data.waffe || '',
      notizen: data.notizen || '',
      serien: data.serien || []
    });
    
    let socialResult: TrainingResult | undefined;
    
    // 2. Optional: Speichere in Social Training
    if (data.socialTraining) {
      try {
        const { auth } = await import('@/lib/firebase/config');
        const userId = auth.currentUser?.uid || 'anonymous';
        
        console.log('🔍 UnifiedTrainingService - groupId:', data.groupId);
        console.log('🔍 UnifiedTrainingService - competitionId:', data.competitionId);
        
        // Konvertiere Serien-Format
        const convertedSeries = schiessEintrag.serien?.map(serie => ({
          id: serie.id,
          seriesNumber: serie.serienNummer,
          shots: serie.schuesse.map(schuss => ({
            number: schuss.nummer,
            value: schuss.wert,
            ring: schuss.ring
          })),
          total: serie.summe
        }));
        
        const socialResultId = await SocialTrainingService.saveResult({
          userId,
          discipline: data.disziplin,
          shots: data.schussAnzahl,
          rings: data.ergebnis,
          ringsWithDecimals: schiessEintrag.ergebnisZehntel || null,
          average: data.ergebnis / data.schussAnzahl,
          date: data.datum,
          typ: data.typ,
          location: data.standort,
          shootingRange: data.schiessstand || null,
          weather: schiessEintrag.wetter || null,
          ammunition: schiessEintrag.munition || null,
          weapon: schiessEintrag.waffe || null,
          series: convertedSeries || null,
          notes: data.notizen || null,
          proofType: data.proofType || 'verified',
          verified: true,
          sourceType: 'schiessnachweis',
          schiessnachweis_id: schiessEintrag.id,
          groupId: data.groupId,
          competitionId: data.competitionId
        }, data.photo);
        
        // Falls Wettkampf ausgewählt, füge Ergebnis auch zum Wettkampf hinzu
        if (data.competitionId) {
          try {
            const { CompetitionsService } = await import('./competitions-service');
            
            // Ermittle nächste freie Runde für den User
            const competitions = await CompetitionsService.getGroupCompetitions(data.groupId!);
            const competition = competitions.find(c => c.id === data.competitionId);
            
            if (competition) {
              const userResults = competition.results[userId] || [];
              const nextRound = userResults.length + 1;
              
              console.log('🔍 Wettkampf gefunden:', competition.name);
              console.log('🔍 User Results:', userResults);
              console.log('🔍 Nächste Runde:', nextRound);
              console.log('🔍 Max Runden:', competition.rounds);
              
              if (nextRound <= competition.rounds) {
                await CompetitionsService.submitResult(
                  data.competitionId, 
                  userId, 
                  nextRound,
                  data.ergebnis
                );
                console.log(`✅ Ergebnis in Wettkampf eingetragen - Runde ${nextRound} mit ${data.ergebnis} Ringen`);
              } else {
                console.log('⚠️ Alle Runden bereits abgeschlossen');
              }
            } else {
              console.log('❌ Wettkampf nicht gefunden:', data.competitionId);
            }
          } catch (error) {
            console.error('❌ Wettkampf-Eintragung fehlgeschlagen:', error);
          }
        }
        
        // Lade das gespeicherte Ergebnis
        const results = await SocialTrainingService.getUserResults(userId);
        socialResult = results.find(r => r.id === socialResultId);
        
      } catch (error) {
        console.error('Social Training Speicherung fehlgeschlagen:', error);
      }
    }
    
    return {
      schiessnachweis: schiessEintrag,
      socialTraining: socialResult
    };
  }
  
  /**
   * Lade alle Trainingsdaten (kombiniert)
   */
  static async getAllTrainingData(userId: string): Promise<{
    schiessnachweis: SchießEintrag[];
    socialTraining: TrainingResult[];
    combined: Array<{
      date: Date;
      discipline: string;
      shots: number;
      rings: number;
      source: 'schiessnachweis' | 'social' | 'both';
      schiessnachweis?: SchießEintrag;
      socialTraining?: TrainingResult;
    }>;
  }> {
    
    const schiessEinträge = await SchießnachweisService.getEinträge();
    const socialResults = await SocialTrainingService.getUserResults(userId);
    
    // Kombiniere und verknüpfe Daten
    const combined: any[] = [];
    
    // Füge Schießnachweis-Einträge hinzu
    schiessEinträge.forEach(eintrag => {
      const linkedSocial = socialResults.find(s => s.schiessnachweis_id === eintrag.id);
      
      combined.push({
        date: eintrag.datum,
        discipline: eintrag.disziplin,
        shots: eintrag.schussAnzahl,
        rings: eintrag.ergebnis,
        source: linkedSocial ? 'both' : 'schiessnachweis',
        schiessnachweis: eintrag,
        socialTraining: linkedSocial
      });
    });
    
    // Füge reine Social Training Einträge hinzu
    socialResults.forEach(result => {
      if (!result.schiessnachweis_id) {
        combined.push({
          date: result.date,
          discipline: result.discipline,
          shots: result.shots,
          rings: result.rings,
          source: 'social',
          socialTraining: result
        });
      }
    });
    
    // Sortiere nach Datum
    combined.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return {
      schiessnachweis: schiessEinträge,
      socialTraining: socialResults,
      combined
    };
  }
  
  /**
   * Synchronisiere alle Daten
   */
  static async syncAllData(): Promise<void> {
    try {
      // 1. Schießnachweis Daten aktualisieren
      await SchießnachweisService.refreshData();
      
      // 2. Lade aktuelle Daten
      const { auth } = await import('@/lib/firebase/config');
      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        await this.getAllTrainingData(userId);
      }
      
      console.log('✅ Alle Trainingsdaten synchronisiert');
    } catch (error) {
      console.error('❌ Synchronisation fehlgeschlagen:', error);
      throw error;
    }
  }
}