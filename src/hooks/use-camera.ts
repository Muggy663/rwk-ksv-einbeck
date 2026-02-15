"use client";

import { useState, useRef, useCallback } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

interface CameraCapabilities {
  hasCamera: boolean;
  hasTorch: boolean;
  hasMultipleCameras: boolean;
  supportedConstraints: MediaTrackSupportedConstraints;
}

interface UseCameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  aspectRatio?: number;
}

export function useCamera(options: UseCameraOptions = {}) {
  const {
    facingMode = 'environment',
    width = 1920,
    height = 1080,
    aspectRatio = 16/9
  } = options;

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<CameraCapabilities | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);
  const [flashEnabled, setFlashEnabled] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check camera capabilities
  const checkCapabilities = useCallback(async (): Promise<CameraCapabilities> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        hasCamera: false,
        hasTorch: false,
        hasMultipleCameras: false,
        supportedConstraints: {}
      };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();

      return {
        hasCamera: videoDevices.length > 0,
        hasTorch: 'torch' in supportedConstraints,
        hasMultipleCameras: videoDevices.length > 1,
        supportedConstraints
      };
    } catch (err) {
      logError('Error checking camera capabilities:', err);
      return {
        hasCamera: false,
        hasTorch: false,
        hasMultipleCameras: false,
        supportedConstraints: {}
      };
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError(null);

      // Check capabilities first
      const caps = await checkCapabilities();
      setCapabilities(caps);

      if (!caps.hasCamera) {
        throw new Error('Keine Kamera verfügbar');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: width, max: 4096 },
          height: { ideal: height, max: 4096 },
          aspectRatio: { ideal: aspectRatio }
        }
      };

      // Add torch constraint if supported and enabled
      if (flashEnabled && caps.hasTorch) {
        (constraints.video as any).torch = true;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }

      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kamera-Zugriff fehlgeschlagen';
      setError(errorMessage);
      setIsStreaming(false);
      throw err;
    }
  }, [currentFacingMode, width, height, aspectRatio, flashEnabled, checkCapabilities]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setError(null);
  }, []);

  // Toggle flash/torch
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current || !capabilities?.hasTorch) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: !flashEnabled } as any]
      });
      setFlashEnabled(!flashEnabled);
    } catch (err) {
      logError('Error toggling flash:', err);
      setError('Flash konnte nicht umgeschaltet werden');
    }
  }, [flashEnabled, capabilities]);

  // Switch camera (front/back)
  const switchCamera = useCallback(() => {
    if (!capabilities?.hasMultipleCameras) return;

    setCurrentFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    
    // Restart camera with new facing mode
    if (isStreaming) {
      stopCamera();
      // Small delay to ensure cleanup
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, [capabilities, isStreaming, stopCamera, startCamera]);

  // Capture photo with optimization
  const capturePhoto = useCallback((canvas?: HTMLCanvasElement): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current) {
        reject(new Error('Video element not available'));
        return;
      }

      const video = videoRef.current;
      const captureCanvas = canvas || document.createElement('canvas');
      const ctx = captureCanvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Set canvas size to video dimensions
      captureCanvas.width = video.videoWidth;
      captureCanvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);

      // Image optimization for OCR
      const imageData = ctx.getImageData(0, 0, captureCanvas.width, captureCanvas.height);
      const data = imageData.data;

      // Enhance contrast and brightness for better OCR
      for (let i = 0; i < data.length; i += 4) {
        const contrast = 1.2;
        const brightness = 10;
        
        data[i] = Math.min(255, Math.max(0, contrast * (data[i] - 128) + 128 + brightness));     // Red
        data[i + 1] = Math.min(255, Math.max(0, contrast * (data[i + 1] - 128) + 128 + brightness)); // Green
        data[i + 2] = Math.min(255, Math.max(0, contrast * (data[i + 2] - 128) + 128 + brightness)); // Blue
      }

      ctx.putImageData(imageData, 0, 0);

      // Convert to blob with high quality
      captureCanvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `handzettel_${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          Object.defineProperty(file, 'name', { writable: false, configurable: false });
          resolve(file);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      }, 'image/jpeg', 0.95);
    });
  }, []);

  return {
    // State
    isStreaming,
    error,
    capabilities,
    currentFacingMode,
    flashEnabled,
    
    // Refs
    videoRef,
    streamRef,
    
    // Actions
    startCamera,
    stopCamera,
    toggleFlash,
    switchCamera,
    capturePhoto,
    checkCapabilities
  };
}
