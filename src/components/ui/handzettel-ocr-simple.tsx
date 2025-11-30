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
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger'

interface HandzettelOCRProps {
  imageFile: File
  availableTeams?: Team[]
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
  availableTeams = [], 
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

  // Bildkomprimierung für Mobile
  const compressImageForMobile = React.useCallback(async (file: File): Promise<File> => {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    // Nur auf Mobile komprimieren und nur wenn Bild > 1MB
    if (!isMobile || file.size <= 1024 * 1024) {
      return file
    }
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Maximale Auflösung für Mobile: 1920x1080
        const maxWidth = 1920
        const maxHeight = 1080
        
        let { width, height } = img
        
        // Skalierung berechnen
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }
        
        canvas.width = width
        canvas.height = height
        
        // Bild zeichnen mit besserer Qualität
        ctx!.imageSmoothingEnabled = true
        ctx!.imageSmoothingQuality = 'high'
        ctx!.drawImage(img, 0, 0, width, height)
        
        // Als JPEG mit 85% Qualität exportieren
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            logDebug(`📱 Bild komprimiert: ${Math.round(file.size/1024)}KB → ${Math.round(compressedFile.size/1024)}KB`)
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', 0.85)
      }
      
      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const processOCR = React.useCallback(async () => {
    if (hasProcessed) return
    
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    logDebug('🤖 Gemini Erkennung gestartet:', imageFile.name)
    setIsProcessing(true)
    setProgress(0)
    
    try {
      setCurrentStep("📱 Bereite Bild vor...")
      setProgress(10)
      
      // Bild für Mobile komprimieren
      let processedImage = imageFile
      if (isMobile) {
        setCurrentStep("📱 Komprimiere Bild...")
        processedImage = await compressImageForMobile(imageFile)
        setProgress(20)
      }
      
      setCurrentStep("🤖 Gemini AI analysiert Handzettel...")
      setProgress(30)
      
      // Mobile Debug Info
      if (isMobile) {
        logDebug('📱 Mobile Debug - Original:', Math.round(imageFile.size/1024), 'KB')
        logDebug('📱 Mobile Debug - Komprimiert:', Math.round(processedImage.size/1024), 'KB')
        logDebug('📱 Mobile Debug - Teams:', availableTeams.length)
      }
      
      // Versuche Gemini OCR mit Timeout
      let matches: OCRMatchResult[] = []
      let geminiSuccess = false
      
      try {
        const formData = new FormData()
        formData.append('image', processedImage)
        const teamNames = availableTeams.map(t => t.name).join(',')
        formData.append('teamNames', teamNames)
        
        setCurrentStep("📡 Sende an Gemini AI...")
        setProgress(50)
        
        // AbortController für Timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
        }, isMobile ? 45000 : 30000) // 45s für Mobile, 30s für Desktop
        
        const geminiResponse = await fetch('/api/gemini-ocr', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (isMobile) {
          logDebug('📱 Mobile Debug - Response Status:', geminiResponse.status)
          setCurrentStep(`📱 Response: ${geminiResponse.status}`)
        }
        
        setProgress(70)
        
        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json()
          
          if (geminiData.success && geminiData.results && geminiData.results.length > 0) {
            setCurrentStep("✨ Verarbeite Ergebnisse...")
            setProgress(80)
            
            matches = await processGeminiResults(geminiData.results)
            logDebug('✅ Gemini Erkennung erfolgreich:', matches.length, 'Matches')
            geminiSuccess = true
          } else {
            logWarn('⚠️ Gemini lieferte keine Ergebnisse')
            if (isMobile) {
              setCurrentStep(`📱 Keine Ergebnisse: ${geminiData.error || 'Unbekannt'}`)
            }
          }
        } else {
          const errorText = await geminiResponse.text().catch(() => 'Unbekannter Fehler')
          logWarn('⚠️ Gemini API Fehler:', geminiResponse.status)
          if (isMobile) {
            setCurrentStep(`📱 API Fehler: ${geminiResponse.status}`)
          }
        }
      } catch (geminiError) {
        logWarn('⚠️ Gemini Erkennung fehlgeschlagen:', geminiError)
        
        let errorMsg = 'Unbekannter Fehler'
        if (geminiError instanceof Error) {
          if (geminiError.name === 'AbortError') {
            errorMsg = 'Timeout - Verbindung zu langsam'
          } else if (geminiError.message.includes('fetch')) {
            errorMsg = 'Netzwerkfehler'
          } else {
            errorMsg = geminiError.message
          }
        }
        
        if (isMobile) {
          setCurrentStep(`📱 Fehler: ${errorMsg}`)
        }
      }
      
      // Wenn Gemini fehlschlägt, detaillierte Fehlermeldung
      if (!geminiSuccess || matches.length === 0) {
        let errorDetails = 'Gemini OCR fehlgeschlagen.'
        
        if (isMobile) {
          errorDetails += `\n\n📱 Mobile Details:\n• Bildgröße: ${Math.round(processedImage.size/1024)}KB\n• Teams: ${availableTeams.length}\n• Typ: ${processedImage.type}`
          
          // Spezifische Mobile-Tipps
          if (processedImage.size > 2 * 1024 * 1024) {
            errorDetails += '\n\n💡 Tipp: Bild ist sehr groß. Versuchen Sie ein kleineres Foto.'
          }
          if (availableTeams.length === 0) {
            errorDetails += '\n\n⚠️ Keine Teams verfügbar. Wählen Sie zuerst Liga und Durchgang.'
          }
        }
        
        errorDetails += '\n\nBitte versuchen Sie:\n• Ein anderes/besseres Foto\n• Bessere Beleuchtung\n• Handzettel gerade fotografieren'
        
        throw new Error(errorDetails)
      }
      
      setMatchedResults(matches)
      setProgress(100)
      setCurrentStep("🎯 Auslesen abgeschlossen!")
      onOCRComplete(matches)
      
    } catch (error) {
      logError('❌ Erkennungs-Fehler:', error)
      
      let errorMessage = error instanceof Error ? error.message : 'Automatisches Auslesen fehlgeschlagen'
      
      // Cleanup bei Fehlern
      if (processedImage !== imageFile) {
        URL.revokeObjectURL(URL.createObjectURL(processedImage))
      }
      
      onError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }, [hasProcessed, imageFile, availableTeams, onOCRComplete, onError, compressImageForMobile])

  // Lazy Loading: Lade Schützen nur bei Bedarf
  const getShooterInfo = React.useCallback(async (shooterId: string): Promise<{name: string, teamId: string, teamName: string} | null> => {
    // Prüfe Cache zuerst
    if (shooterCacheRef.current?.has(shooterId)) {
      return shooterCacheRef.current.get(shooterId) || null
    }
    
    // Initialisiere Cache falls nötig
    if (!shooterCacheRef.current) {
      shooterCacheRef.current = new Map()
    }
    
    try {
      const shooterDoc = await getDoc(doc(db, "shooters", shooterId))
      if (shooterDoc.exists()) {
        const data = shooterDoc.data()
        const shooterName = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim()
        const team = availableTeams.find(t => t.shooterIds?.includes(shooterId))
        
        if (team && shooterName) {
          const shooterInfo = { name: shooterName, teamId: team.id, teamName: team.name }
          shooterCacheRef.current.set(shooterId, shooterInfo)
          return shooterInfo
        }
      }
    } catch (error) {
      logError(`Fehler bei Schütze ${shooterId}:`, error)
    }
    
    return null
  }, [availableTeams])

  // Autostart nur einmal - verhindere Fast Refresh Loops
  React.useEffect(() => {
    if (autoStart && !hasProcessed && imageFile) {
      const timeoutId = setTimeout(() => {
        if (!hasProcessed) {
          setHasProcessed(true)
          processOCR()
        }
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [autoStart, imageFile.name, hasProcessed, processOCR])

  const processGeminiResults = async (geminiResults: any[]): Promise<OCRMatchResult[]> => {
    const matches: OCRMatchResult[] = []
    
    // Begrenze Gemini-Ergebnisse auf maximal 25 pro Durchgang
    const limitedResults = geminiResults.slice(0, 25)
    logDebug(`🔄 Gemini lieferte ${geminiResults.length} Ergebnisse, verwende ${limitedResults.length}`)
    
    // Sammle alle Schützen-IDs aus Teams
    const allShooterIds = new Set<string>()
    availableTeams.forEach(team => {
      team.shooterIds?.forEach(id => allShooterIds.add(id))
    })
    
    // Matche Gemini-Ergebnisse mit Datenbank-Schützen (Lazy Loading)
    for (const geminiResult of limitedResults) {
      if (!geminiResult.shooterName || !geminiResult.score || geminiResult.score <= 0) {
        continue
      }
      
      let bestMatch: {shooterId: string, shooterInfo: any, similarity: number} | null = null
      const geminiName = geminiResult.shooterName.toLowerCase().trim()
      
      // Durchsuche nur relevante Schützen-IDs (maximal 10 parallel)
      const shooterIdArray = Array.from(allShooterIds)
      const batchSize = 10 // Mobile-freundlich
      
      for (let i = 0; i < shooterIdArray.length; i += batchSize) {
        const batch = shooterIdArray.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (shooterId) => {
          const shooterInfo = await getShooterInfo(shooterId)
          if (!shooterInfo) return null
          
          const dbName = shooterInfo.name.toLowerCase().trim()
          
          let similarity = 0
          if (dbName === geminiName) similarity = 1.0
          else if (dbName.includes(geminiName) || geminiName.includes(dbName)) similarity = 0.8
          else similarity = fuzzyMatch(dbName, geminiName)
          
          return similarity > 0.6 ? { shooterId, shooterInfo, similarity } : null
        })
        
        const batchResults = await Promise.all(batchPromises)
        
        for (const result of batchResults) {
          if (result && (!bestMatch || result.similarity > bestMatch.similarity)) {
            bestMatch = result
          }
        }
        
        // Wenn perfekter Match gefunden, stoppe Suche
        if (bestMatch?.similarity === 1.0) break
      }
      
      if (bestMatch) {
        matches.push({
          teamId: bestMatch.shooterInfo.teamId,
          teamName: bestMatch.shooterInfo.teamName,
          shooterId: bestMatch.shooterId,
          shooterName: bestMatch.shooterInfo.name,
          score: geminiResult.score,
          confidence: (geminiResult.confidence || 0.8) * bestMatch.similarity,
          ocrSource: 'gemini'
        })
      }
    }
    
    return matches
  }

  // Fallback OCR wird nicht mehr verwendet - nur Gemini

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
          <Button 
            onClick={() => {
              if (!hasProcessed) {
                setHasProcessed(true)
                processOCR()
              }
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            <Zap className="mr-2 h-5 w-5" />
            🤖 Automatisch auslesen
          </Button>
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
              <span>🎯 {matchedResults.length}/25 Schützen erkannt! {matchedResults[0]?.ocrSource === 'gemini' ? '(Gemini AI)' : '(Alternative Erkennung)'}</span>
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
