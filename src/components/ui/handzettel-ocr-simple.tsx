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
  const [ocrResult, setOcrResult] = React.useState<SimpleOCRResult | null>(null)
  const [matchedResults, setMatchedResults] = React.useState<OCRMatchResult[]>([])
  const hasRunRef = React.useRef(false)

  React.useEffect(() => {
    if (!hasRunRef.current) {
      hasRunRef.current = true
      processOCR()
    }
  }, [])

  const processOCR = async () => {
    console.log('🤖 Vereinfachte OCR gestartet:', imageFile.name)
    setIsProcessing(true)
    setProgress(0)
    
    try {
      setCurrentStep("Handzettel wird gescannt...")
      setProgress(20)
      
      const result = await simpleOCR.processHandzettel(imageFile)
      console.log('✅ OCR Ergebnis:', result)
      setOcrResult(result)
      
      setCurrentStep("Schützen werden zugeordnet...")
      setProgress(50)
      
      const matches = await matchShooters(result, availableTeams)
      setMatchedResults(matches)
      
      setProgress(100)
      setCurrentStep("OCR abgeschlossen!")
      onOCRComplete(matches)
      
    } catch (error) {
      console.error('❌ OCR Error:', error)
      onError(error instanceof Error ? error.message : 'OCR-Verarbeitung fehlgeschlagen')
    } finally {
      setIsProcessing(false)
    }
  }

  const matchShooters = async (ocrResult: SimpleOCRResult, teams: Team[]): Promise<OCRMatchResult[]> => {
    const matches: OCRMatchResult[] = []
    
    // Sammle alle Schützen-IDs
    const allShooterIds = new Set<string>()
    teams.forEach(team => {
      team.shooterIds?.forEach(id => allShooterIds.add(id))
    })
    
    console.log(`🔍 Lade ${allShooterIds.size} Schützen aus Datenbank...`)
    
    // Lade alle Schützen in einem Batch
    const shooterCache = new Map<string, {name: string}>()
    const loadPromises = Array.from(allShooterIds).map(async (shooterId) => {
      try {
        const shooterDoc = await getDoc(doc(db, "shooters", shooterId))
        if (shooterDoc.exists()) {
          const data = shooterDoc.data()
          const shooterName = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim()
          shooterCache.set(shooterId, { name: shooterName })
        }
      } catch (error) {
        console.error(`Fehler bei Schütze ${shooterId}:`, error)
      }
    })
    
    await Promise.all(loadPromises)
    console.log(`📊 ${shooterCache.size} Schützen geladen`)
    
    // Erstelle Schützen-Liste mit Team-Zuordnung
    const allShooters: Array<{id: string, name: string, teamId: string, teamName: string}> = []
    
    teams.forEach(team => {
      team.shooterIds?.forEach(shooterId => {
        const shooter = shooterCache.get(shooterId)
        if (shooter) {
          allShooters.push({
            id: shooterId,
            name: shooter.name,
            teamId: team.id,
            teamName: team.name
          })
        }
      })
    })
    
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
      
      if (matchedShooter) {
        matches.push({
          teamId: matchedShooter.teamId,
          teamName: matchedShooter.teamName,
          shooterId: matchedShooter.id,
          shooterName: matchedShooter.name,
          score: ocrShooter.score,
          confidence: ocrShooter.confidence,
          ocrSource: 'handzettel-ocr'
        })
        const scoreText = ocrShooter.score !== null ? `${ocrShooter.score} Ringe` : 'Nicht angetreten'
        console.log(`✅ "${ocrShooter.name}" → "${matchedShooter.name}" (${matchedShooter.teamName}) - ${scoreText}`)
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
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Zap className="h-5 w-5" />
          🎯 Vereinfachte OCR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">


        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span>{currentStep}</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {ocrResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>🎯 {matchedResults.length} Schützen erkannt!</span>
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