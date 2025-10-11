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

  // Auto-start OCR wenn autoStart=true
  React.useEffect(() => {
    if (autoStart && !isProcessing && !ocrResult) {
      processOCR()
    }
  }, [autoStart])

  const processOCR = async () => {
    console.log('🤖 OCR gestartet mit Datei:', imageFile.name, imageFile.type)
    setIsProcessing(true)
    setProgress(0)
    
    try {
      setCurrentStep("Handzettel wird gescannt...")
      setProgress(20)
      
      console.log('📄 Starte Google Vision OCR...')
      let result: OCRResult
      try {
        result = await googleVisionOCR.processHandzettel(imageFile)
        console.log('✅ Google Vision Ergebnis:', result)
      } catch (error) {
        console.warn('⚠️ Google Vision fehlgeschlagen, verwende Tesseract Fallback:', error)
        setCurrentStep("Google Vision Limit erreicht - verwende Tesseract...")
        result = await handzettelOCR.processHandzettel(imageFile)
        console.log('✅ Tesseract Fallback Ergebnis:', result)
      }
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
    
    // Verwende die gleiche Logik wie in /verein/ergebnisse
    const loadShootersForTeam = async (team: Team) => {
      if (!team.shooterIds?.length) return []
      
      const validShooterIds = team.shooterIds.filter(id => id && typeof id === 'string' && id.trim() !== "")
      const shooters = []
      
      for (const shooterId of validShooterIds) {
        try {
          const shooterDoc = await getDoc(doc(db, "shooters", shooterId))
          if (shooterDoc.exists()) {
            const data = shooterDoc.data()
            shooters.push({
              id: shooterId,
              name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unbekannt'
            })
          }
        } catch (error) {
          console.error(`Fehler beim Laden von Schütze ${shooterId}:`, error)
        }
      }
      
      return shooters
    }
    
    const teamsWithShooters = await Promise.all(
      teams.map(async (team) => ({
        ...team,
        shooters: await loadShootersForTeam(team)
      }))
    )
    
    // Wenn keine OCR-Teams, zeige alle Schützen
    if (ocrResult.teams.length === 0) {
      console.log('Keine OCR-Teams - zeige alle Schützen')
      for (const team of teamsWithShooters) {
        if (team.shooters?.length) {
          for (const shooter of team.shooters) {
            matches.push({
              teamId: team.id,
              teamName: team.name,
              shooterId: shooter.id,
              shooterName: shooter.name,
              score: 0,
              confidence: 0.5,
              ocrSource: 'handzettel-ocr'
            })
          }
        }
      }
    } else {
      for (const ocrTeam of ocrResult.teams) {
        const matchedTeam = teamsWithShooters.find(team => {
          const teamName = team.name.toLowerCase().trim()
          const ocrName = ocrTeam.name.toLowerCase().trim()
          
          // Exakte Übereinstimmung
          if (teamName === ocrName) return true
          
          // Enthält-Prüfung
          if (teamName.includes(ocrName) || ocrName.includes(teamName)) return true
          
          // Römische Endungen isolieren
          const teamRoman = teamName.match(/\b(i{1,3})\b$/i)?.[1]?.toLowerCase() || ''
          const ocrRoman = ocrName.match(/\b(i{1,3})\b$/i)?.[1]?.toLowerCase() || ''
          
          // Basisnamen ohne römische Endung
          const teamBase = teamName.replace(/\b(i{1,3})\b$/i, '').trim().toLowerCase()
          const ocrBase = ocrName.replace(/\b(i{1,3})\b$/i, '').trim().toLowerCase()
          
          let similarity = fuzzyMatch(teamBase, ocrBase)
          
          // Harter Block: Wenn Basis gleich, aber römische Zahl verschieden
          if (similarity > 0.8 && teamRoman && ocrRoman && teamRoman !== ocrRoman) {
            console.log(`🚫 Römischer Konflikt: "${teamName}" vs "${team.name}" - BLOCKIERT`);
            return false
          }
          
          // Vereinsschutz: Wenn Verein zu unterschiedlich, aber römische Zahl gleich
          if (similarity < 0.7 && teamRoman && ocrRoman && teamRoman === ocrRoman) {
            console.log(`🚫 Verein zu unterschiedlich trotz gleicher römischer Endung: "${ocrName}" vs "${teamName}"`);
            return false
          }
          
          // Bonus für exakt gleiche römische Zahl
          if (teamRoman && ocrRoman && teamRoman === ocrRoman) {
            similarity = Math.min(1.0, similarity + 0.3)
            console.log(`✅ Römische Zahlen-Bonus: "${teamRoman}" = "${ocrRoman}" (${similarity.toFixed(2)})`);
          }
          
          // Akzeptiere Match wenn Similarity > 0.7
          if (similarity > 0.7) return true
          
          console.log(`❌ Team nicht gefunden: "${ocrTeam.name}" vs "${team.name}" (fuzzy: ${fuzzyMatch(teamName, ocrName).toFixed(2)})`);
          return false
        })
        
        if (matchedTeam?.shooters) {
          console.log(`✅ Team Match: "${ocrTeam.name}" → "${matchedTeam.name}" (${matchedTeam.shooters.length} Schützen)`);
          for (const ocrShooter of ocrTeam.shooters) {
            const matchedShooter = matchedTeam.shooters.find((shooter: any) =>
              shooter.name.toLowerCase().includes(ocrShooter.name.toLowerCase()) ||
              ocrShooter.name.toLowerCase().includes(shooter.name.toLowerCase()) ||
              fuzzyMatch(shooter.name, ocrShooter.name) > 0.6
            )
            
            if (matchedShooter && ocrShooter.score >= 0 && ocrShooter.score <= 400) {
              console.log(`  ✅ Schütze Match: "${ocrShooter.name}" → "${matchedShooter.name}" (${ocrShooter.score} Ringe)`);
              matches.push({
                teamId: matchedTeam.id,
                teamName: matchedTeam.name,
                shooterId: matchedShooter.id,
                shooterName: matchedShooter.name,
                score: ocrShooter.score,
                confidence: Math.min(ocrTeam.confidence, ocrShooter.confidence),
                ocrSource: 'handzettel-ocr'
              })
            } else if (!matchedShooter) {
              console.log(`  ❌ Schütze nicht gefunden: "${ocrShooter.name}" in Team "${matchedTeam.name}"`);
            }
          }
        } else {
          console.log(`❌ Team nicht gefunden: "${ocrTeam.name}"`);
        }
      }
    }
    
    return matches
  }

  const extractTeamsFromRawText = (rawText: string, availableTeams: Team[]) => {
    return []
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
            <div className="flex items-center gap-2 text-sm text-blue-700 min-w-0">
              <Camera className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Bereit: {imageFile.name}</span>
            </div>
            <Button 
              onClick={processOCR}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              🤖 Google Vision OCR (Handschrift)
            </Button>
            <div className="text-xs text-blue-600 space-y-1">
              <p>✅ Erkennt: Liga, Teams, Ergebnisse</p>
              <p>⚡ Spart 95% der Eingabe</p>
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
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">🎯 Handzettel erfolgreich gescannt!</span>
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
              <div className="flex items-center gap-2 text-red-700 bg-red-50 p-2 rounded text-xs border border-red-200">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-medium">⚠️ ACHTUNG: Handzettel stimmt nicht mit Auswahl überein!</span>
              </div>
            ) : null}
            
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Erkannte Ergebnisse ({matchedResults.length}):
              </span>
              
              {/* Debug: Roher OCR-Text anzeigen - Mobile optimiert */}
              <details className="text-xs bg-gray-50 p-2 rounded border">
                <summary className="cursor-pointer font-medium text-gray-600">🔍 Debug: OCR-Text</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-700 max-h-32 overflow-y-auto overflow-x-hidden break-all">
                  {ocrResult.rawText}
                </pre>
              </details>
              
              <div className="max-h-32 overflow-y-auto space-y-1">
                {matchedResults.map((result, index) => {
                  const confidence = result.confidence;
                  const confidenceColor = confidence >= 0.8 ? 'bg-green-100 border-green-300' : 
                                         confidence >= 0.6 ? 'bg-yellow-100 border-yellow-300' : 
                                         'bg-red-100 border-red-300';
                  const badgeColor = confidence >= 0.8 ? 'bg-green-500' : 
                                    confidence >= 0.6 ? 'bg-yellow-500' : 
                                    'bg-red-500';
                  
                  return (
                    <div key={index} className={`flex items-center justify-between text-xs p-2 rounded border ${confidenceColor} min-w-0`}>
                      <span className={`${confidence < 0.6 ? 'font-medium text-red-700' : ''} truncate flex-1 mr-2`}>
                        {result.shooterName}
                        {confidence < 0.6 && ' ⚠️'}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono text-sm">{result.score}</span>
                        <Badge className={`text-xs text-white ${badgeColor} px-1`}>
                          {Math.round(confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-2 rounded text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>Bitte prüfen Sie alle erkannten Werte in der Zwischenliste!</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}