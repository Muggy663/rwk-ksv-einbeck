"use client";

import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Zap, ZapOff, RotateCcw, Check, X, AlertCircle } from 'lucide-react';
import { useCamera } from '@/hooks/use-camera';

interface NativeCameraProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function NativeCamera({ onCapture, onClose, isOpen }: NativeCameraProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const {
    isStreaming,
    error,
    capabilities,
    flashEnabled,
    videoRef,
    startCamera,
    stopCamera,
    toggleFlash,
    switchCamera,
    capturePhoto
  } = useCamera({ facingMode: 'environment' });



  // Capture photo with optimization
  const handleCapturePhoto = async () => {
    try {
      const file = await capturePhoto();
      const dataUrl = URL.createObjectURL(file);
      setCapturedImage(dataUrl);
    } catch (err) {
      logError('Capture error:', err);
    }
  };

  // Confirm captured image
  const confirmCapture = async () => {
    try {
      const file = await capturePhoto();
      onCapture(file);
      setCapturedImage(null);
      stopCamera();
      onClose();
    } catch (err) {
      logError('Confirm capture error:', err);
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
  };

  // Start camera when component opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      if (!isOpen) {
        stopCamera();
      }
    };
  }, [isOpen, startCamera, stopCamera, capturedImage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex justify-between items-center text-white">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium">Handzettel fotografieren</span>
            <div className="w-10" />
          </div>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative overflow-hidden">
          {error ? (
            <div className="flex items-center justify-center h-full bg-gray-900 text-white p-4">
              <Card className="bg-red-900/50 border-red-500">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-200 mb-3">{error}</p>
                  <div className="space-y-2">
                    <Button 
                      onClick={startCamera} 
                      className="bg-red-600 hover:bg-red-700 w-full"
                    >
                      Erneut versuchen
                    </Button>
                    {!capabilities?.hasCamera && (
                      <p className="text-xs text-red-300">
                        Tipp: Erlauben Sie Kamera-Zugriff in den Browser-Einstellungen
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              
              {/* Handzettel Frame Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <div className="relative w-full max-w-md aspect-[3/4] border-2 border-white/70 rounded-lg">
                    {/* Corner markers */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                    
                    {/* Center text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/50 px-3 py-1 rounded text-white text-sm">
                        Handzettel hier positionieren
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          {capturedImage ? (
            <div className="flex justify-center gap-4">
              <Button
                onClick={retakePhoto}
                size="lg"
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Wiederholen
              </Button>
              <Button
                onClick={confirmCapture}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-5 w-5 mr-2" />
                Verwenden
              </Button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              {/* Flash Toggle */}
              <Button
                onClick={toggleFlash}
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/20"
                disabled={!isStreaming || !capabilities?.hasTorch}
              >
                {flashEnabled ? (
                  <Zap className="h-6 w-6" />
                ) : (
                  <ZapOff className="h-6 w-6" />
                )}
              </Button>

              {/* Capture Button */}
              <Button
                onClick={handleCapturePhoto}
                size="lg"
                className="w-16 h-16 rounded-full bg-white hover:bg-gray-200 text-black"
                disabled={!isStreaming}
              >
                <Camera className="h-8 w-8" />
              </Button>

              {/* Camera Switch */}
              <Button
                onClick={switchCamera}
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/20"
                disabled={!isStreaming || !capabilities?.hasMultipleCameras}
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>


      </div>
    </div>
  );
}
