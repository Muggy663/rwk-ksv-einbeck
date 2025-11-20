"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Shot {
  x: number;
  y: number;
  ring: number;
  series?: number;
}

interface TargetVisualizationProps {
  shots?: Shot[];
  title?: string;
  showAnimation?: boolean;
}

export default function TargetVisualization({ 
  shots = [], 
  title = "3D Trefferbild",
  showAnimation = true 
}: TargetVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const animationIdRef = useRef<number>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentShot, setCurrentShot] = useState(0);

  // Demo-Schüsse für Testzwecke
  const demoShots: Shot[] = [
    { x: 0.2, y: 0.1, ring: 10, series: 1 },
    { x: -0.1, y: 0.3, ring: 9, series: 1 },
    { x: 0.4, y: -0.2, ring: 8, series: 1 },
    { x: -0.3, y: -0.1, ring: 10, series: 1 },
    { x: 0.1, y: -0.4, ring: 9, series: 1 },
    { x: 0.5, y: 0.3, ring: 7, series: 2 },
    { x: -0.2, y: 0.4, ring: 9, series: 2 },
    { x: 0.3, y: 0.2, ring: 10, series: 2 },
    { x: -0.4, y: -0.3, ring: 8, series: 2 },
    { x: 0.0, y: 0.0, ring: 10, series: 2 }
  ];

  const displayShots = shots.length > 0 ? shots : demoShots;

  useEffect(() => {
    let THREE: any;
    
    const initThreeJS = async () => {
      try {
        THREE = await import('three');
        setIsLoaded(true);
        
        if (!mountRef.current) return;

        // Scene Setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(
          75,
          mountRef.current.clientWidth / mountRef.current.clientHeight,
          0.1,
          1000
        );
        camera.position.z = 5;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;
        mountRef.current.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Luftgewehr/KK Scheibe (10 Ringe)
        const targetGroup = new THREE.Group();
        
        // Erstelle 10 konzentrische Ringe für LG/KK
        for (let ring = 1; ring <= 10; ring++) {
          const outerRadius = 2.1 - ((ring - 1) * 0.2);
          const innerRadius = ring === 10 ? 0 : outerRadius - 0.2;
          
          const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
          
          // Farben nach LG/KK Standard
          let ringColor;
          if (ring <= 6) {
            ringColor = 0xffffff; // Weiß für Ringe 1-6
          } else if (ring <= 8) {
            ringColor = 0x000000; // Schwarz für Ringe 7-8
          } else if (ring === 9) {
            ringColor = 0x000000; // Schwarz für Ring 9
          } else {
            ringColor = 0x000000; // Schwarz für Ring 10
          }
          
          const ringMaterial = new THREE.MeshLambertMaterial({ 
            color: ringColor,
            side: THREE.DoubleSide
          });
          
          const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
          targetGroup.add(ringMesh);
          
          // Ring-Linien für bessere Sichtbarkeit
          const lineGeometry = new THREE.RingGeometry(outerRadius - 0.01, outerRadius, 64);
          const lineMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x333333,
            side: THREE.DoubleSide
          });
          const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
          lineMesh.position.z = 0.001;
          targetGroup.add(lineMesh);
        }
        
        // Zentrum-Markierung (10er Ring)
        const centerGeometry = new THREE.CircleGeometry(0.2, 32);
        const centerMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x000000,
          side: THREE.DoubleSide
        });
        const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);
        centerMesh.position.z = 0.002;
        targetGroup.add(centerMesh);

        // Ring-Nummern
        for (let ring = 1; ring <= 10; ring++) {
          const radius = 1.9 - ((ring - 1) * 0.2);
          const markerGeometry = new THREE.SphereGeometry(0.015, 8, 8);
          const markerMaterial = new THREE.MeshLambertMaterial({ 
            color: ring >= 7 ? 0xffffff : 0x000000
          });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.set(radius, 0, 0.01);
          targetGroup.add(marker);
        }

        scene.add(targetGroup);

        // Animation Loop
        const animate = () => {
          animationIdRef.current = requestAnimationFrame(animate);
          renderer.render(scene, camera);
        };
        animate();

        // Resize Handler
        const handleResize = () => {
          if (!mountRef.current) return;
          
          camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };

      } catch (error) {
        console.error('Fehler beim Laden von Three.js:', error);
      }
    };

    initThreeJS();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Schüsse hinzufügen
  useEffect(() => {
    if (!sceneRef.current || !isLoaded) return;

    const THREE = require('three');
    
    // Entferne alte Schüsse
    const shotsToRemove = sceneRef.current.children.filter((child: any) => 
      child.userData && child.userData.isShot
    );
    shotsToRemove.forEach((shot: any) => sceneRef.current.remove(shot));

    // Füge neue Schüsse hinzu
    displayShots.slice(0, currentShot + 1).forEach((shot, index) => {
      const shotGeometry = new THREE.SphereGeometry(0.05, 16, 16);
      
      // Farbe basierend auf Ring-Wert (LG/KK Standard)
      let shotColor = 0x666666;
      if (shot.ring >= 10) shotColor = 0xff0000;      // Rot für 10er
      else if (shot.ring >= 9) shotColor = 0xff6600;  // Orange für 9er  
      else if (shot.ring >= 8) shotColor = 0xffff00;  // Gelb für 8er
      else if (shot.ring >= 7) shotColor = 0x00ff00;  // Grün für 7er
      else shotColor = 0x0088ff;                      // Blau für niedrigere

      const shotMaterial = new THREE.MeshLambertMaterial({ 
        color: shotColor,
        emissive: shotColor,
        emissiveIntensity: 0.2
      });
      
      const shotMesh = new THREE.Mesh(shotGeometry, shotMaterial);
      shotMesh.position.set(shot.x, shot.y, 0.1);
      shotMesh.userData = { isShot: true, ring: shot.ring, series: shot.series };
      
      // Keine Animation - direkt anzeigen
      shotMesh.scale.set(1, 1, 1);
      
      sceneRef.current.add(shotMesh);
    });
  }, [currentShot, isLoaded, displayShots, showAnimation]);

  const addNextShot = () => {
    if (currentShot < displayShots.length - 1) {
      setCurrentShot(prev => prev + 1);
    }
  };

  const resetAnimation = () => {
    setCurrentShot(0);
  };

  const showAllShots = () => {
    setCurrentShot(displayShots.length - 1);
  };

  // Statistiken berechnen
  const totalRings = displayShots.slice(0, currentShot + 1).reduce((sum, shot) => sum + shot.ring, 0);
  const averageRing = currentShot >= 0 ? (totalRings / (currentShot + 1)).toFixed(1) : '0.0';
  const tensCount = displayShots.slice(0, currentShot + 1).filter(shot => shot.ring >= 10).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex gap-2">
            <Badge variant="outline">
              {currentShot + 1}/{displayShots.length} Schüsse
            </Badge>
            <Badge variant="secondary">
              ⌀ {averageRing} Ringe
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 3D Visualization */}
          <div 
            ref={mountRef} 
            className="w-full h-96 border rounded-lg bg-gray-100 relative overflow-hidden"
          >
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Lade 3D-Visualisierung...</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button 
              onClick={addNextShot} 
              disabled={currentShot >= displayShots.length - 1}
              size="sm"
            >
              ➕ Nächster Schuss
            </Button>
            <Button onClick={showAllShots} variant="outline" size="sm">
              👁️ Alle anzeigen
            </Button>
            <Button onClick={resetAnimation} variant="outline" size="sm">
              🔄 Zurücksetzen
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-2xl font-bold text-blue-600">{totalRings}</div>
              <div className="text-sm text-gray-600">Gesamt-Ringe</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-2xl font-bold text-green-600">{averageRing}</div>
              <div className="text-sm text-gray-600">⌀ pro Schuss</div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-2xl font-bold text-red-600">{tensCount}</div>
              <div className="text-sm text-gray-600">10er-Treffer</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {currentShot >= 0 ? Math.round((tensCount / (currentShot + 1)) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">10er-Quote</div>
            </div>
          </div>

          {/* Shot List */}
          <div className="max-h-32 overflow-y-auto">
            <div className="grid grid-cols-5 md:grid-cols-10 gap-1">
              {displayShots.map((shot, index) => (
                <div
                  key={index}
                  className={`
                    text-center p-2 rounded text-sm font-medium
                    ${index <= currentShot 
                      ? shot.ring >= 10 
                        ? 'bg-red-100 text-red-800' 
                        : shot.ring >= 9 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                      : 'bg-gray-50 text-gray-400'
                    }
                  `}
                >
                  {index <= currentShot ? shot.ring : '?'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
