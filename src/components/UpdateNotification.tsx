// src/components/UpdateNotification.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X } from 'lucide-react';

const CURRENT_VERSION = '0.9.4.1';
const GITHUB_API_URL = 'https://api.github.com/repos/Muggy663/rwk-einbeck/releases/latest';

interface Release {
  tag_name: string;
  name: string;
  body: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

export function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestRelease, setLatestRelease] = useState<Release | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const response = await fetch(GITHUB_API_URL);
      const release: Release = await response.json();
      
      const latestVersion = release.tag_name.replace('v', '');
      
      if (latestVersion !== CURRENT_VERSION) {
        setLatestRelease(release);
        setUpdateAvailable(true);
      }
    } catch (error) {
      console.log('Update-Check fehlgeschlagen:', error);
    }
  };

  const downloadUpdate = () => {
    // Prüfe ob App aus Play Store kommt
    const isPlayStoreApp = window.location.hostname !== 'localhost' && 
                          navigator.userAgent.includes('wv'); // WebView = Play Store App
    
    if (isPlayStoreApp) {
      // Öffne Play Store für Update
      window.open('https://play.google.com/store/apps/details?id=de.rwk.einbeck', '_blank');
    } else {
      // Direkte APK für Web/Sideload
      if (latestRelease) {
        const apkAsset = latestRelease.assets.find(asset => 
          asset.name.includes('.apk')
        );
        
        if (apkAsset) {
          window.open(apkAsset.browser_download_url, '_blank');
        }
      }
    }
  };

  if (!mounted || !updateAvailable || dismissed || !latestRelease) {
    return null;
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Download className="h-5 w-5" />
              Update verfügbar!
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Version {latestRelease.tag_name} ist verfügbar
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button 
            onClick={downloadUpdate}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {navigator.userAgent.includes('wv') ? 'Play Store öffnen' : 'APK herunterladen'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setDismissed(true)}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            Später
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}