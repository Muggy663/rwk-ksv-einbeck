"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useKMAuth } from '@/hooks/useKMAuth';

export default function DebugAuthPage() {
  const auth = useAuth();
  const kmAuth = useKMAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-primary mb-8">🔐 Auth Debug Tool</h1>
      
      <div className="grid gap-6">
        {/* Basis Auth */}
        <Card>
          <CardHeader>
            <CardTitle>🔑 Basis Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div><strong>User Email:</strong> {auth.user?.email || 'Nicht eingeloggt'}</div>
              <div><strong>User UID:</strong> {auth.user?.uid || '-'}</div>
              <div><strong>Loading:</strong> {auth.loading ? 'Ja' : 'Nein'}</div>
              <div><strong>Error:</strong> {auth.error?.message || 'Kein Fehler'}</div>
            </div>
          </CardContent>
        </Card>

        {/* App Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>🏢 App Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div><strong>Role:</strong> {auth.userAppPermissions?.role || 'Keine Rolle'}</div>
              <div><strong>Roles Array:</strong> {JSON.stringify(auth.userAppPermissions?.roles) || 'Nicht gesetzt'}</div>
              <div><strong>Club ID:</strong> {auth.userAppPermissions?.clubId || 'Kein Club'}</div>
              <div><strong>Club IDs:</strong> {JSON.stringify(auth.userAppPermissions?.clubIds) || 'Keine Clubs'}</div>
              <div><strong>Represented Clubs:</strong> {JSON.stringify(auth.userAppPermissions?.representedClubs) || 'Keine'}</div>
              <div><strong>Loading Permissions:</strong> {auth.loadingAppPermissions ? 'Ja' : 'Nein'}</div>
              <div><strong>Permissions Error:</strong> {auth.appPermissionsError || 'Kein Fehler'}</div>
            </div>
          </CardContent>
        </Card>

        {/* KM Auth */}
        <Card>
          <CardHeader>
            <CardTitle>🏆 KM Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div><strong>Has KM Access:</strong> <span className={kmAuth.hasKMAccess ? 'text-green-600' : 'text-red-600'}>{kmAuth.hasKMAccess ? '✅ JA' : '❌ NEIN'}</span></div>
              <div><strong>Is Active:</strong> {kmAuth.isActive ? 'Ja' : 'Nein'}</div>
              <div><strong>Loading:</strong> {kmAuth.loading ? 'Ja' : 'Nein'}</div>
              <div><strong>User Role:</strong> {kmAuth.userRole || 'Keine Rolle'}</div>
              <div><strong>User Club IDs:</strong> {JSON.stringify(kmAuth.userClubIds) || 'Keine Clubs'}</div>
              <div><strong>Is KM Admin:</strong> {kmAuth.isKMAdmin ? 'Ja' : 'Nein'}</div>
              <div><strong>Is KM Organisator:</strong> {kmAuth.isKMOrganisator ? 'Ja' : 'Nein'}</div>
              <div><strong>Has Full Access:</strong> {kmAuth.hasFullAccess ? 'Ja' : 'Nein'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Diagnose */}
        <Card>
          <CardHeader>
            <CardTitle>🩺 Diagnose</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!auth.user && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <strong className="text-red-800">❌ Problem:</strong>
                  <p className="text-red-700">Nicht eingeloggt</p>
                </div>
              )}
              
              {auth.user && !auth.userAppPermissions && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <strong className="text-yellow-800">⚠️ Problem:</strong>
                  <p className="text-yellow-700">Keine App-Berechtigungen gefunden</p>
                </div>
              )}
              
              {auth.user && auth.userAppPermissions && !kmAuth.hasKMAccess && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <strong className="text-red-800">❌ Problem:</strong>
                  <p className="text-red-700">KM-Zugang verweigert</p>
                  <p className="text-red-600 text-sm mt-1">
                    Rolle: {auth.userAppPermissions.role} | 
                    Roles: {JSON.stringify(auth.userAppPermissions.roles)}
                  </p>
                </div>
              )}
              
              {kmAuth.hasKMAccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <strong className="text-green-800">✅ Status:</strong>
                  <p className="text-green-700">KM-Zugang erfolgreich</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lösungsvorschläge */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Lösungsvorschläge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-semibold text-blue-800">🔧 Multi-Role-System implementieren:</h4>
                <p className="text-blue-700 text-sm">Erweitere User-Dokument um 'roles' Array: ['vereinsvertreter', 'km_access', 'vereinssoftware']</p>
              </div>
              
              <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                <h4 className="font-semibold text-purple-800">🔄 Role-Switching Interface:</h4>
                <p className="text-purple-700 text-sm">Benutzer können zwischen Rollen wechseln: "RWK-Modus", "KM-Modus", "Vereinssoftware-Modus"</p>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <h4 className="font-semibold text-green-800">🛠️ Sofort-Fix:</h4>
                <p className="text-green-700 text-sm">Füge 'km_access' zur roles-Array hinzu oder setze representedClubs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}