"use client"

import * as React from "react"
import { toast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Upload, AlertCircle } from "lucide-react"

interface ProgressToastOptions {
  title: string
  description?: string
  duration?: number
}

export function createProgressToast({ title, description, duration = 5000 }: ProgressToastOptions) {
  let progress = 0
  let toastId: string | null = null
  
  const startToast = () => {
    const { id, update } = toast({
      title,
      description: (
        <div className="space-y-2">
          {description && <p className="text-sm">{description}</p>}
          <div className="flex items-center space-x-2">
            <Upload className="h-4 w-4 animate-pulse" />
            <Progress value={progress} className="flex-1" />
            <span className="text-xs font-mono">{progress}%</span>
          </div>
        </div>
      ),
      duration: duration * 2, // Länger anzeigen
    })
    
    toastId = id
    return { id, update }
  }
  
  const updateProgress = (newProgress: number, newDescription?: string) => {
    if (!toastId) return
    
    progress = Math.min(100, Math.max(0, newProgress))
    
    const { update } = toast({
      title,
      description: (
        <div className="space-y-2">
          {newDescription && <p className="text-sm">{newDescription}</p>}
          <div className="flex items-center space-x-2">
            {progress === 100 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Upload className="h-4 w-4 animate-pulse" />
            )}
            <Progress value={progress} className="flex-1" />
            <span className="text-xs font-mono">{progress}%</span>
          </div>
        </div>
      ),
      className: progress === 100 ? "border-green-500 bg-green-50" : undefined,
    })
    
    // Auto-dismiss bei 100%
    if (progress === 100) {
      setTimeout(() => {
        if (toastId) {
          toast({ title: "✅ Upload abgeschlossen!", duration: 2000 })
        }
      }, 1000)
    }
  }
  
  const errorToast = (errorMessage: string) => {
    toast({
      title: "❌ Upload fehlgeschlagen",
      description: (
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      ),
      variant: "destructive",
      duration: 5000,
    })
  }
  
  return {
    start: startToast,
    updateProgress,
    error: errorToast,
  }
}