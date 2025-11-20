"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, CheckCircle, AlertTriangle, Camera, Loader } from "lucide-react"
import { simpleOCR, type SimpleOCRResult } from "@/lib/services/simple-ocr-service"
import type { Team, Shooter } from "@/types/rwk"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

interface HandzettelOCRProps {
  imageFile: File
  availableTeams: Team[]
  selectedLeagueId: string
  selectedRound: string
  onOCRComplete: (results: OCRMatchResult[]) => void
  onError: (error: string) => void
  autoStart?: boolean
}

export interface OCRMatchResult {
  teamId: string
  teamName: string
  shooterId: string
  shooterName: string
  score: number | null
  confidence: number
  ocrSource: 'gemini' | 'fallback-ocr'
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
  const [ocrResult, setOcrResult] = React.useState<SimpleOCRResult | null>(null)
  const [matchedResults, setMatchedResults] = React.useState<OCRMatchResult[]>([])
  const [hasProcessed, setHasProcessed] = React.useState(false)
  const shooterCacheRef = React.useRef<Map<string, {name: string, teamId: string, teamName: string}> | null>(null)

  const processOCR = React.useCallback(async () => {
    if (hasProcessed) return
    
    console.log('🤖 Gemini Erkennung gestartet:', imageFile.name)
    setIsProcessing(true)
    setProgress(0)
    setHasProcessed(true) // Sofort setzen um Doppelausführung zu verhindern
    
    try {
      setCurrentStep("🤖 Gemini AI analysiert Handzettel...")
      setProgress(20)
      
      // Versuche zuerst Gemini OCR
      let matches: OCRMatchResult[] = []
      let geminiSuccess = false
      
      try {
        const formData = new FormData()
        formData.append('image', imageFile)
        formData.append('availableTeams', JSON.stringify(availableTeams))
        
        const geminiResponse = await fetch('/api/gemini-ocr', {
          method: 'POST',
          body: formData
        })
        
        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json()
          if (geminiData.success && geminiData.results && geminiData.results.length > 0) {
            setCurrentStep("✨ Gemini AI hat Ergebnisse gefunden!")
            setProgress(70)
            
            matches = await processGeminiResults(geminiData.results)
            console.log('✅ Gemini Erkennung erfolgreich:', matches.length, 'Matches')
            geminiSuccess = true
          } else {
            console.warn('⚠️ Gemini lieferte keine Ergebnisse:', geminiData.error || 'Unbekannter Fehler')
          }
        } else {
          const errorData = await geminiResponse.json().catch(() => ({}))
          console.warn('⚠️ Gemini API Fehler:', geminiResponse.status, errorData.error || 'Unbekannter Fehler')
        }
      } catch (geminiError) {
        console.warn('⚠️ Gemini Erkennung fehlgeschlagen:', geminiError instanceof Error ? geminiError.message : geminiError)
      }
      
      // Fallback auf Simple OCR wenn Gemini fehlschlägt oder keine Ergebnisse liefert
      if (!geminiSuccess || matches.length === 0) {
        setCurrentStep("📋 Alternative Erkennung wird verwendet...")
        setProgress(40)
        
        try {
          // Timeout für Fallback OCR (Mobile Browser Problem)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('OCR Timeout')), 15000)
          )
          
          const ocrPromise = simpleOCR.processHandzettel(imageFile)
          const result = await Promise.race([ocrPromise, timeoutPromise]) as SimpleOCRResult
          
          console.log('✅ Alternative Erkennung Ergebnis:', result)
          setOcrResult(result)
          
          setCurrentStep("Schützen werden zugeordnet...")
          setProgress(70)
          
          matches = await matchShooters(result, availableTeams)
        } catch (fallbackError) {
          console.error('❌ Alternative Erkennung fehlgeschlagen:', fallbackError)
          // Wenn Vision API fehlschlägt, aber Gemini erfolgreich war, verwende Gemini
          if (geminiSuccess && matches.length > 0) {
            console.log('🔄 Verwende Gemini-Ergebnisse trotz Vision API Fehler')
            // Verwende die bereits vorhandenen Gemini-Matches
          } else {
            // Mobile-spezifische Fehlermeldung
            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            const errorMsg = isMobile 
              ? 'OCR in PWA fehlgeschlagen. Versuche:\n• Bessere Internetverbindung\n• Browser-App statt PWA\n• Manuelle Eingabe'
              : 'Automatische Erkennung fehlgeschlagen. Mögliche Lösungen:\n• Bessere Bildqualität verwenden\n• Handzettel vollständig fotografieren\n• Manuelle Eingabe verwenden'
            throw new Error(errorMsg)
          }
        }
      }
      
      setMatchedResults(matches)
      setProgress(100)
      setCurrentStep("🎯 Auslesen abgeschlossen!")
      onOCRComplete(matches)
      
    } catch (error) {
      console.error('❌ Erkennungs-Fehler:', error)
      setHasProcessed(false) // Reset bei Fehler für erneuten Versuch
      onError(error instanceof Error ? error.message : 'Automatisches Auslesen fehlgeschlagen')
    } finally {
      setIsProcessing(false)
    }
  }, [hasProcessed, imageFile.name, availableTeams, onOCRComplete, onError])

  // Lade Schützen-Cache einmalig
  React.useEffect(() => {
    const loadShooterCache = async () => {
      if (shooterCacheRef.current) return
      
      const cache = new Map<string, {name: string, teamId: string, teamName: string}>()
      const allShooterIds = new Set<string>()
      availableTeams.forEach(team => {
        team.shooterIds?.forEach(id => allShooterIds.add(id))
      })
      
      const loadPromises = Array.from(allShooterIds).map(async (shooterId) => {
        try {
          const shooterDoc = await getDoc(doc(db, "shooters", shooterId))
          if (shooterDoc.exists()) {
            const data = shooterDoc.data()
            const shooterName = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim()
            const team = availableTeams.find(t => t.shooterIds?.includes(shooterId))
            if (team) {
              cache.set(shooterId, { name: shooterName, teamId: team.id, teamName: team.name })
            }
          }
        } catch (error) {
          console.error(`Fehler bei Schütze ${shooterId}:`, error)
        }
      })
      
      await Promise.all(loadPromises)
      shooterCacheRef.current = cache
    }
    
    loadShooterCache()
  }, [availableTeams])

  // Autostart nur einmal - verhindere Fast Refresh Loops
  React.useEffect(() => {
    if (autoStart && !hasProcessed && imageFile) {
      const timeoutId = setTimeout(() => {
        if (!hasProcessed) {
          processOCR() // hasProcessed wird in processOCR gesetzt
        }
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [autoStart, imageFile.name, hasProcessed, processOCR])

  const processGeminiResults = async (geminiResults: any[]): Promise<OCRMatchResult[]> => {
    const matches: OCRMatchResult[] = []
    
    // Verwende den bereits geladenen Cache
    if (!shooterCacheRef.current) {
      console.error('Schützen-Cache nicht geladen')
      return matches
    }
    
    const shooterCache = shooterCacheRef.current
    
    // Begrenze Gemini-Ergebnisse auf maximal 25 pro Durchgang
    const limitedResults = geminiResults.slice(0, 25)
    console.log(`🔄 Gemini lieferte ${geminiResults.length} Ergebnisse, verwende ${limitedResults.length}`)
    
    // Matche Gemini-Ergebnisse mit Datenbank-Schützen
    for (const geminiResult of limitedResults) {
      let bestMatch: {shooterId: string, shooter: any, similarity: number} | null = null
      
      // Suche besten Match
      for (const [shooterId, shooter] of shooterCache.entries()) {
        const dbName = shooter.name.toLowerCase().trim()
        const geminiName = geminiResult.shooterName?.toLowerCase().trim() || ''
        
        let similarity = 0
        if (dbName === geminiName) similarity = 1.0
        else if (dbName.includes(geminiName) || geminiName.includes(dbName)) similarity = 0.8
        else similarity = fuzzyMatch(dbName, geminiName)
        
        if (similarity > 0.6 && (!bestMatch || similarity > bestMatch.similarity)) {
          bestMatch = { shooterId, shooter, similarity }
        }
      }
      
      if (bestMatch) {
        // Nur hinzufügen wenn ein gültiges Ergebnis vorhanden ist
        if (geminiResult.score && geminiResult.score > 0) {
          matches.push({
            teamId: bestMatch.shooter.teamId,
            teamName: bestMatch.shooter.teamName,
            shooterId: bestMatch.shooterId,
            shooterName: bestMatch.shooter.name,
            score: geminiResult.score,
            confidence: (geminiResult.confidence || 0.8) * bestMatch.similarity,
            ocrSource: 'gemini'
          })
        }
      }
    }
    
    return matches
  }

  const matchShooters = async (ocrResult: SimpleOCRResult, teams: Team[]): Promise<OCRMatchResult[]> => {
    const matches: OCRMatchResult[] = []
    
    // Verwende den bereits geladenen Cache
    if (!shooterCacheRef.current) {
      console.error('Schützen-Cache nicht geladen')
      return matches
    }
    
    // Erstelle Schützen-Liste aus Cache
    const allShooters: Array<{id: string, name: string, teamId: string, teamName: string}> = []
    
    for (const [shooterId, shooter] of shooterCacheRef.current.entries()) {
      allShooters.push({
        id: shooterId,
        name: shooter.name,
        teamId: shooter.teamId,
        teamName: shooter.teamName
      })
    }
    
    // Matche OCR-Schützen mit Datenbank
    for (const ocrShooter of ocrResult.shooters) {
      const scoreText = ocrShooter.score !== null ? `${ocrShooter.score} Ringe` : 'Nicht angetreten'
      console.log(`🔍 Suche: "${ocrShooter.name}" (${scoreText})`)
      
      const matchedShooter = allShooters.find(shooter => {
        const dbName = shooter.name.toLowerCase().trim()
        const ocrName = ocrShooter.name.toLowerCase().trim()
        
        if (dbName === ocrName) return true
        if (dbName.includes(ocrName) || ocrName.includes(dbName)) return true
        
        const similarity = fuzzyMatch(dbName, ocrName)
        return similarity > 0.7
      })
      
      if (matchedShooter && ocrShooter.score && ocrShooter.score > 0) {
        matches.push({
          teamId: matchedShooter.teamId,
          teamName: matchedShooter.teamName,
          shooterId: matchedShooter.id,
          shooterName: matchedShooter.name,
          score: ocrShooter.score,
          confidence: ocrShooter.confidence,
          ocrSource: 'fallback-ocr'
        })
        console.log(`✅ "${ocrShooter.name}" → "${matchedShooter.name}" (${matchedShooter.teamName}) - ${ocrShooter.score} Ringe`)
      } else if (matchedShooter && (!ocrShooter.score || ocrShooter.score === 0)) {
        console.log(`⏭️ "${ocrShooter.name}" übersprungen (kein Ergebnis)`)
      } else {
        console.log(`❌ "${ocrShooter.name}" nicht gefunden`)
      }
    }
    
    console.log(`🏁 ${matches.length} Matches erstellt`)
    return matches
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
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Zap className="h-5 w-5" />
          🎯 Automatisches Auslesen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isProcessing && !ocrResult && (
          <div className="space-y-2">
            <Button 
              onClick={() => {
                if (!isProcessing) {
                  setHasProcessed(false) // Reset für manuellen Start
                  processOCR()
                }
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
              disabled={isProcessing}
            >
              <Zap className="mr-2 h-5 w-5" />
              🤖 {hasProcessed ? 'Erneut versuchen' : 'Automatisch auslesen'}
            </Button>
            {hasProcessed && (
              <p className="text-xs text-center text-muted-foreground">
                OCR abgebrochen? Klicke "Erneut versuchen" oder verwende manuelle Eingabe
              </p>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span className="text-foreground">{currentStep}</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {ocrResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-4 w-4" />
              <span>🎯 {matchedResults.length} Schützen erkannt! {matchedResults[0]?.ocrSource === 'gemini' ? '(Gemini AI)' : '(Alternative Erkennung)'}</span>
            </div>
            
            <div className="space-y-1">
              {matchedResults.map((result, index) => (
                <div key={index} className="flex justify-between text-sm p-2 bg-green-50 rounded">
                  <span>{result.shooterName}</span>
                  <span>{result.teamName}</span>
                  <span>{result.score !== null ? `${result.score} Ringe` : 'Nicht angetreten'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
