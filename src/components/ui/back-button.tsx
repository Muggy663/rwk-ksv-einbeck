"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  className?: string
  fallbackHref?: string
  variant?: "ghost" | "outline" | "default"
  size?: "default" | "sm" | "lg" | "icon"
}

export function BackButton({ 
  className, 
  fallbackHref = "/", 
  variant = "ghost", 
  size = "icon" 
}: BackButtonProps) {
  const router = useRouter()
  const { isMobile } = useMobileDetection()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn(
        isMobile ? "flex" : "hidden md:flex",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {size !== "icon" && <span className="ml-2">Zurück</span>}
    </Button>
  )
}