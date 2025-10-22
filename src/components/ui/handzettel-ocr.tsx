"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, CheckCircle, AlertTriangle, Camera, Loader } from "lucide-react"
import { handzettelOCR, googleVisionOCR, type OCRResult, type OCRTeam } from "@/lib/services/handzettel-ocr-service"
import "@/lib/services/ocr-test" // Test-Import für Funktionalitäts-Nachweis
import type { Team, Shooter } from "@/types/rwk"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

interface HandzettelOCRProps {
  imageFile: File
  availableTeams: Team[]
  selectedLeagueId: string
  selectedRound: string
  availableLeagues?: { id: string; name: string; type: string }[]
  onOCRComplete: (results: OCRMatchResult[]) => void
  onError: (error: string) => void
  autoStart?: boolean
}

export interface OCRMatchResult {
  teamId: string
  teamName: string
  shooterId: string
  shooterName: string
  score: number
  confidence: number
  ocrSource: 'handzettel-ocr'
}

export function HandzettelOCR({ 
  imageFile, 
  availableTeams, 
  selectedLeagueId, 
  selectedRound, 
  onOCRComplete, 
  onError,
  autoStart = false
}: HandzettelOCRProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [currentStep, setCurrentStep] = React.useState("")
  const [ocrResult, setOcrResult] = React.useState<OCRResult | null>(null)
  const [matchedResults, setMatchedResults] = React.useState<OCRMatchResult[]>([])

  // Auto-start OCR wenn autoStart=true (nur einmal)
  const [hasStarted, setHasStarted] = React.useState(false)
  const processedFileRef = React.useRef<string | null>(null)
  
  React.useEffect(() => {
    const fileKey = `${imageFile.name}-${imageFile.size}-${imageFile.lastModified}`
    if (autoStart && !isProcessing && !ocrResult && !hasStarted && processedFileRef.current !== fileKey) {
      setHasStarted(true)
      processedFileRef.current = fileKey
      processOCR()
    }
  }, [autoStart, hasStarted, imageFile])

  const processOCR = async () => {
    console.log('🤖 OCR gestartet mit Datei:', imageFile.name, imageFile.type)
    setIsProcessing(true)
    setProgress(0)
    
    try {
      setCurrentStep("Handzettel wird gescannt...")
      setProgress(20)
      
      console.log('📄 Starte Google Vision OCR...')
      let result: OCRResult
      let ocrMethod = 'unknown'
      
      try {
        result = await googleVisionOCR.processHandzettel(imageFile)
        
        // Prüfe ob brauchbare Ergebnisse vorhanden
        if (result.teams.length > 0) {
          if (result.teams[0].confidence >= 0.95) {
            ocrMethod = 'Google Vision Premium (95%+ Genauigkeit)'
            console.log('✅ Google Vision Premium OCR erfolgreich')
          } else {
            ocrMethod = 'Google Vision Standard'
            console.log('✅ Google Vision Standard OCR verwendet')
          }
          console.log('✅ Google Vision Ergebnis:', result)
        } else {
          throw new Error('Google Vision lieferte keine brauchbaren Ergebnisse')
        }
      } catch (error) {
        console.warn('⚠️ Google Vision fehlgeschlagen, verwende Tesseract Fallback:', error)
        setCurrentStep("Google Vision nicht verfügbar - verwende Tesseract...")
        ocrMethod = 'Tesseract Fallback'
        result = await handzettelOCR.processHandzettel(imageFile)
        console.log('✅ Tesseract Fallback Ergebnis:', result)
      }
      
      // Füge OCR-Methode zu Ergebnis hinzu
      result.ocrMethod = ocrMethod
      setOcrResult(result)
      
      setCurrentStep("Teams werden zugeordnet...")
      setProgress(50)
      
      console.log('🔍 Verfügbare Teams:', availableTeams.length)
      console.log('🔍 Team-Namen aus DB:', availableTeams.map(t => `"${t.name}" (ID: ${t.id})`))
      const matches = await matchTeamsAndShooters(result, availableTeams)
      console.log('🎯 Gefundene Matches:', matches)
      setMatchedResults(matches)
      
      setCurrentStep("Ergebnisse werden vorbereitet...")
      setProgress(90)
      
      if (matches.length > 0) {
        onOCRComplete(matches)
        setProgress(100)
        setCurrentStep("OCR erfolgreich abgeschlossen!")
      } else {
        onOCRComplete(matches)
        setProgress(100)
        setCurrentStep("Handzettel gescannt - keine Matches gefunden")
      }
      
    } catch (error) {
      console.error('❌ OCR Error:', error)
      onError(error instanceof Error ? error.message : 'OCR-Verarbeitung fehlgeschlagen')
    } finally {
      setIsProcessing(false)
    }
  }

  const matchTeamsAndShooters = async (ocrResult: OCRResult, teams: Team[]): Promise<OCRMatchResult[]> => {
    const matches: OCRMatchResult[] = []
    
    // Lade alle Schützen aus allen Teams mit detailliertem Logging
    const allShooters: Array<{id: string, name: string, teamId: string, teamName: string}> = []
    
    console.log(`🔍 Durchsuche ${teams.length} Teams nach Schützen:`);
    console.log('📊 Verfügbare Teams aus availableTeams Parameter:', teams.map(t => `"${t.name}" (ID: ${t.id})`));
    
    for (const team of teams) {
      console.log(`  📋 Team: "${team.name}" (ID: ${team.id})`);
      console.log(`    🔗 Team.shooterIds:`, team.shooterIds);
      
      if (team.shooterIds?.length) {
        console.log(`    📝 Lade ${team.shooterIds.length} Schützen aus Firestore Collection "shooters"`);
        
        for (const shooterId of team.shooterIds) {
          try {
            console.log(`      🔍 Firestore Query: doc("shooters", "${shooterId}")`);
            const shooterDoc = await getDoc(doc(db, "shooters", shooterId))
            
            if (shooterDoc.exists()) {
              const data = shooterDoc.data()
              console.log(`      📄 Schütze-Daten aus Firestore:`, {
                id: shooterId,
                name: data.name,
                firstName: data.firstName,
                lastName: data.lastName,
                allFields: Object.keys(data)
              });
              
              const shooterName = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unbekannt'
              allShooters.push({
                id: shooterId,
                name: shooterName,
                teamId: team.id,
                teamName: team.name
              })
              console.log(`      ✅ Schütze zugeordnet: "${shooterName}" → Team "${team.name}" (aus availableTeams Parameter)`);
            } else {
              console.log(`      ❌ Schütze ${shooterId} existiert nicht in Firestore Collection "shooters"`);
            }
          } catch (error) {
            console.error(`      ❌ Firestore Fehler bei Schütze ${shooterId}:`, error)
          }
        }
      } else {
        console.log(`    ⚠️ Team hat keine shooterIds`);
      }
    }
    
    console.log(`📊 Gesamt geladene Schützen: ${allShooters.length}`);
    console.log('👥 Finale Schützen-Team-Zuordnung:');
    allShooters.forEach(s => {
      console.log(`  "${s.name}" → Team "${s.teamName}" (Team-ID: ${s.teamId}, Schütze-ID: ${s.id})`);
    });
    
    console.log('🔍 DATENQUELLE-ERKLÄRUNG:');
    console.log('  1. Teams kommen aus availableTeams Parameter (von Eltern-Komponente)');
    console.log('  2. Team.shooterIds enthält Array von Schützen-IDs');
    console.log('  3. Schützen-Daten kommen aus Firestore Collection "shooters"');
    console.log('  4. Team-Zugehörigkeit = Team aus availableTeams, das diese shooterId enthält');
    
    // Vereinfachte Zuordnung: Nur Schützen-Namen matchen
    if (ocrResult.teams.length > 0 && ocrResult.teams[0].name === 'OCR_DETECTED_SHOOTERS') {
      const ocrShooters = ocrResult.teams[0].shooters;
      console.log(`🎯 Starte Matching für ${ocrShooters.length} OCR-Schützen`);
      
      for (const ocrShooter of ocrShooters) {
        // Finde Schützen in Datenbank mit detailliertem Matching-Log
        console.log(`🔍 Suche OCR-Schütze: "${ocrShooter.name}" (${ocrShooter.score} Ringe)`);
        
        const matchedShooter = allShooters.find(shooter => {
          const shooterName = shooter.name.toLowerCase().trim()
          const ocrName = ocrShooter.name.toLowerCase().trim()
          
          console.log(`  🔄 Vergleiche mit DB-Schütze: "${shooter.name}" (${shooter.teamName})`);
          
          // Exakte Übereinstimmung
          if (shooterName === ocrName) {
            console.log(`    ✅ Exakte Übereinstimmung gefunden!`);
            return true
          }
          
          // Enthält-Prüfung
          if (shooterName.includes(ocrName) || ocrName.includes(shooterName)) {
            console.log(`    ✅ Enthält-Match gefunden!`);
            return true
          }
          
          // Fuzzy Match
          const similarity = fuzzyMatch(shooterName, ocrName)
          console.log(`    📊 Fuzzy-Ähnlichkeit: ${similarity.toFixed(3)}`);
          if (similarity > 0.7) {
            console.log(`    ✅ Fuzzy-Match gefunden (${similarity.toFixed(3)})!`);
            return true
          }
          
          // Name normalisieren
          const normalizedShooter = normalizeNameForOCR(shooterName)
          const normalizedOCR = normalizeNameForOCR(ocrName)
          
          if (normalizedShooter === normalizedOCR) {
            console.log(`    ✅ Normalisierter Match gefunden!`);
            return true
          }
          
          const normalizedSimilarity = fuzzyMatch(normalizedShooter, normalizedOCR)
          console.log(`    📊 Normalisierte Ähnlichkeit: ${normalizedSimilarity.toFixed(3)}`);
          if (normalizedSimilarity > 0.8) {
            console.log(`    ✅ Normalisierter Fuzzy-Match gefunden (${normalizedSimilarity.toFixed(3)})!`);
            return true
          }
          
          console.log(`    ❌ Kein Match`);
          return false
        })
        
        if (matchedShooter) {
          matches.push({
            teamId: matchedShooter.teamId,
            teamName: matchedShooter.teamName,
            shooterId: matchedShooter.id,
            shooterName: matchedShooter.name,
            score: ocrShooter.score,
            confidence: ocrShooter.confidence,
            ocrSource: 'handzettel-ocr'
          });
          console.log(`✅ ERFOLGREICHER MATCH:`);
          console.log(`  OCR: "${ocrShooter.name}" (${ocrShooter.score} Ringe)`);
          console.log(`  DB:  "${matchedShooter.name}" (ID: ${matchedShooter.id})`);
          console.log(`  →    Team "${matchedShooter.teamName}" (ID: ${matchedShooter.teamId})`);
        } else {
          // Temporärer Eintrag
          const tempShooterId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          matches.push({
            teamId: 'unknown',
            teamName: 'Unbekanntes Team',
            shooterId: tempShooterId,
            shooterName: `${ocrShooter.name} (OCR)`,
            score: ocrShooter.score,
            confidence: 0.5,
            ocrSource: 'handzettel-ocr'
          });
          console.log(`❌ KEIN MATCH GEFUNDEN:`);
          console.log(`  OCR: "${ocrShooter.name}" (${ocrShooter.score} Ringe)`);
          console.log(`  →    Erstelle temporären Eintrag`);
        }
      }
    }
    
    console.log(`🏁 FINALE ERGEBNISSE: ${matches.length} Matches erstellt`);
    matches.forEach((match, i) => {
      console.log(`  ${i+1}. "${match.shooterName}" → "${match.teamName}" (${match.score} Ringe)`);
    });
    
    return matches
  }

  const extractTeamsFromRawText = (rawText: string, availableTeams: Team[]) => {
    return []
  }

  const normalizeNameForOCR = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const fuzzyMatch = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase())
    return (longer.length - editDistance) / longer.length
  }

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 w-full max-w-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800 text-sm sm:text-base">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <span className="truncate">🧪 OCR-Erkennung</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 min-w-0">
        {!isProcessing && !ocrResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-blue-700 min-w-0 w-full max-w-full overflow-hidden">
              <Camera className="h-4 w-4 flex-shrink-0" />
              <span className="truncate flex-1 min-w-0">Bereit: {imageFile.name.length > 20 ? imageFile.name.substring(0, 20) + '...' : imageFile.name}</span>
            </div>
            <Button 
              onClick={processOCR}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-sm"
            >
              🤖 OCR starten
            </Button>
            <div className="text-xs text-blue-600">
              <p>✅ Erkennt Liga, Teams & Ergebnisse ⚡ Spart 95% Zeit</p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{currentStep}</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={progress} className="flex-1" />
              <span className="text-xs font-mono text-blue-600">{progress}%</span>
            </div>
          </div>
        )}

        {ocrResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700 min-w-0">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium truncate">🎯 Handzettel gescannt!</span>
              {ocrResult.ocrMethod && (
                <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                  {ocrResult.ocrMethod.includes('Premium') ? '🚀 Premium' : 
                   ocrResult.ocrMethod.includes('Standard') ? '🔄 Standard' : 
                   '🔄 Fallback'}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
              <div className="min-w-0">
                <span className="text-gray-600">Liga:</span>
                <span className="ml-2 font-medium truncate block sm:inline">
                  {ocrResult.liga || 'Nicht erkannt'}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-gray-600">Durchgang:</span>
                <span className={`ml-2 font-medium ${
                  ocrResult.durchgang && ocrResult.durchgang.toString() !== selectedRound 
                    ? 'text-red-600 font-bold' : ''
                }`}>
                  {ocrResult.durchgang || 'Nicht erkannt'}
                  {ocrResult.durchgang && ocrResult.durchgang.toString() !== selectedRound && ' ⚠️'}
                </span>
              </div>
            </div>
            
            {/* Warnung bei Unstimmigkeiten */}
            {(ocrResult.durchgang && ocrResult.durchgang.toString() !== selectedRound) ? (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 p-2 rounded text-xs border border-red-200 w-full max-w-full overflow-hidden">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span className="font-medium truncate">⚠️ ACHTUNG: Durchgang stimmt nicht überein!</span>
              </div>
            ) : null}
            
            <div className="space-y-2 w-full max-w-full overflow-hidden">
              <span className="text-sm font-medium text-gray-700">
                Erkannte Ergebnisse ({matchedResults.length}):
              </span>
              
              {/* Debug: Roher OCR-Text anzeigen - Mobile optimiert */}
              <details className="text-xs bg-gray-50 p-2 rounded border w-full max-w-full overflow-hidden">
                <summary className="cursor-pointer font-medium text-gray-600">🔍 Debug: OCR-Text</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-700 max-h-32 overflow-y-auto overflow-x-hidden break-all w-full">
                  {ocrResult.rawText}
                </pre>
              </details>
              
              <div className="max-h-32 overflow-y-auto space-y-1 w-full max-w-full overflow-x-hidden">
                {matchedResults.map((result, index) => {
                  const confidence = result.confidence;
                  const confidenceColor = confidence >= 0.8 ? 'bg-green-100 border-green-300' : 
                                         confidence >= 0.6 ? 'bg-yellow-100 border-yellow-300' : 
                                         'bg-red-100 border-red-300';
                  const badgeColor = confidence >= 0.8 ? 'bg-green-500' : 
                                    confidence >= 0.6 ? 'bg-yellow-500' : 
                                    'bg-red-500';
                  
                  return (
                    <div key={index} className={`flex items-center justify-between text-xs p-2 rounded border ${confidenceColor} min-w-0 w-full max-w-full overflow-hidden`}>
                      <span className={`${confidence < 0.6 ? 'font-medium text-red-700' : ''} truncate flex-1 mr-2 min-w-0`}>
                        {result.shooterName}
                        {confidence < 0.6 && ' ⚠️'}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="font-mono text-xs">{result.score}</span>
                        <Badge className={`text-xs text-white ${badgeColor} px-1 py-0`}>
                          {Math.round(confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-2 rounded text-xs w-full max-w-full overflow-hidden">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Bitte prüfen Sie alle erkannten Werte!</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}