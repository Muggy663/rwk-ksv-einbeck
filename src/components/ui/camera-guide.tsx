"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface CameraGuideProps {
  videoRef: React.RefObject<HTMLVideoElement>
  onQualityChange: (quality: 'good' | 'bad' | 'unknown') => void
}

export function CameraGuide({ videoRef, onQualityChange }: CameraGuideProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [quality, setQuality] = React.useState<'good' | 'bad' | 'unknown'>('unknown')

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        analyzeFrame()
      }
    }, 500) // Alle 500ms prüfen

    return () => clearInterval(interval)
  }, [])

  const analyzeFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Video-Frame auf Canvas zeichnen
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    // Einfache Qualitätsprüfung
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const quality = analyzeImageQuality(imageData)
    
    setQuality(quality)
    onQualityChange(quality)
  }

  const analyzeImageQuality = (imageData: ImageData): 'good' | 'bad' | 'unknown' => {
    const { data, width, height } = imageData
    
    // 1. Auflösungsprüfung
    if (width < 1200 || height < 900) {
      return 'bad' // Zu niedrige Auflösung
    }

    // 2. Schärfe-Analyse (vereinfacht)
    let sharpness = 0
    for (let i = 0; i < data.length - 4; i += 4) {
      const diff = Math.abs(data[i] - data[i + 4]) // Helligkeitsunterschied
      sharpness += diff
    }
    sharpness = sharpness / (data.length / 4)

    // 3. Kontrast-Analyse
    let brightness = 0
    for (let i = 0; i < data.length; i += 4) {
      brightness += (data[i] + data[i + 1] + data[i + 2]) / 3
    }
    brightness = brightness / (data.length / 4)

    // Bewertung
    if (sharpness > 15 && brightness > 50 && brightness < 200) {
      return 'good'
    } else {
      return 'bad'
    }
  }

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Overlay für Kamera-Feedback */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="bg-black/70 text-white border-none">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                quality === 'good' ? 'bg-green-500' : 
                quality === 'bad' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              <span className="text-sm">
                {quality === 'good' && '✅ Perfekte Qualität'}
                {quality === 'bad' && '❌ Zu unscharf/dunkel'}
                {quality === 'unknown' && '🔍 Analysiere...'}
              </span>
            </div>
            
            {quality === 'bad' && (
              <div className="mt-2 text-xs text-gray-300">
                💡 Tipps: Näher ran, besseres Licht, ruhig halten
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DIN A4 Rahmen-Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full flex items-center justify-center">
          <div className={`border-2 border-dashed rounded-lg ${
            quality === 'good' ? 'border-green-500' : 'border-white'
          }`} style={{
            width: '80%',
            height: '60%',
            aspectRatio: '1.414' // DIN A4 Verhältnis
          }}>
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white bg-black/50 px-2 py-1 rounded text-sm">
                📄 Handzettel hier positionieren
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
