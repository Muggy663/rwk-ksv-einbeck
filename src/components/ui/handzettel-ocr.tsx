"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, CheckCircle, AlertTriangle, Camera, Loader } from "lucide-react"
import { handzettelOCR, type OCRResult, type OCRTeam } from "@/lib/services/handzettel-ocr-service"
import "@/lib/services/ocr-test" // Test-Import für Funktionalitäts-Nachweis
import type { Team, Shooter } from "@/types/rwk"

interface HandzettelOCRProps {
  imageFile: File
  availableTeams: Team[]
  selectedLeagueId: string
  selectedRound: string
  onOCRComplete: (results: OCRMatchResult[]) => void
  onError: (error: string) => void
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
  onError 
}: HandzettelOCRProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [currentStep, setCurrentStep] = React.useState("")
  const [ocrResult, setOcrResult] = React.useState<OCRResult | null>(null)
  const [matchedResults, setMatchedResults] = React.useState<OCRMatchResult[]>([])

  const processOCR = async () => {
    setIsProcessing(true)
    setProgress(0)
    
    try {
      setCurrentStep("Handzettel wird gescannt...")
      setProgress(20)
      
      const result = await handzettelOCR.processHandzettel(imageFile)
      setOcrResult(result)
      
      setCurrentStep("Teams werden zugeordnet...")
      setProgress(50)
      
      const matches = await matchTeamsAndShooters(result, availableTeams)
      setMatchedResults(matches)
      
      setCurrentStep("Ergebnisse werden vorbereitet...")
      setProgress(90)
      
      if (matches.length > 0) {
        onOCRComplete(matches)
        setProgress(100)
        setCurrentStep("OCR erfolgreich abgeschlossen!")
      } else {
        // Auch bei 0 neuen Matches OCR als erfolgreich betrachten (könnte alles Duplikate sein)
        onOCRComplete(matches)
        setProgress(100)
        setCurrentStep("Handzettel gescannt - prüfe Duplikate...")
      }
      
    } catch (error) {
      console.error('OCR Error:', error)
      onError(error instanceof Error ? error.message : 'OCR-Verarbeitung fehlgeschlagen')
    } finally {
      setIsProcessing(false)
    }
  }

  const matchTeamsAndShooters = async (ocrResult: OCRResult, teams: Team[]): Promise<OCRMatchResult[]> => {
    const matches: OCRMatchResult[] = []
    
    for (const ocrTeam of ocrResult.teams) {
      // Team-Matching
      const matchedTeam = teams.find(team => 
        team.name.toLowerCase().includes(ocrTeam.name.toLowerCase()) ||
        ocrTeam.name.toLowerCase().includes(team.name.toLowerCase()) ||
        fuzzyMatch(team.name, ocrTeam.name) > 0.7
      )
      
      if (matchedTeam && matchedTeam.shooters) {
        for (const ocrShooter of ocrTeam.shooters) {
          // Schützen-Matching
          const matchedShooter = matchedTeam.shooters.find((shooter: any) =>
            shooter.name.toLowerCase().includes(ocrShooter.name.toLowerCase()) ||
            ocrShooter.name.toLowerCase().includes(shooter.name.toLowerCase()) ||
            fuzzyMatch(shooter.name, ocrShooter.name) > 0.6
          )
          
          if (matchedShooter && ocrShooter.score >= 0 && ocrShooter.score <= 400) {
            matches.push({
              teamId: matchedTeam.id,
              teamName: matchedTeam.name,
              shooterId: matchedShooter.id,
              shooterName: matchedShooter.name,
              score: ocrShooter.score,
              confidence: Math.min(ocrTeam.confidence, ocrShooter.confidence),
              ocrSource: 'handzettel-ocr'
            })
          }
        }
      }
    }
    
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Zap className="h-5 w-5" />
          🧪 EXPERIMENTAL: Handzettel-OCR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isProcessing && !ocrResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Camera className="h-4 w-4" />
              <span>Bereit zum Scannen: {imageFile.name}</span>
            </div>
            <Button 
              onClick={processOCR}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              🤖 Handzettel automatisch scannen
            </Button>
            <div className="text-xs text-blue-600 space-y-1">
              <p>✅ Erkennt: Liga, Durchgang, Teams und alle Schützen-Ergebnisse</p>
              <p>⚡ Spart 95% der manuellen Eingabe</p>
              <p>🔍 Alle Werte werden zur Kontrolle angezeigt</p>
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

        {ocrResult && matchedResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">🎯 Handzettel erfolgreich gescannt!</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Liga:</span>
                <span className="ml-2 font-medium">{ocrResult.liga || 'Nicht erkannt'}</span>
              </div>
              <div>
                <span className="text-gray-600">Durchgang:</span>
                <span className="ml-2 font-medium">{ocrResult.durchgang || 'Nicht erkannt'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Erkannte Ergebnisse ({matchedResults.length}):
              </span>
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
                    <div key={index} className={`flex items-center justify-between text-xs p-2 rounded border ${confidenceColor}`}>
                      <span className={confidence < 0.6 ? 'font-medium text-red-700' : ''}>
                        {result.shooterName}
                        {confidence < 0.6 && ' ⚠️'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{result.score}</span>
                        <Badge className={`text-xs text-white ${badgeColor}`}>
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