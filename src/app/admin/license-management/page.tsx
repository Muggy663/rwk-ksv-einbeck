"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface UserLicense {
  email: string;
  displayName?: string;
  vereinssoftwareLicense: boolean;
  licenseType?: 'TRIAL' | 'FULL' | 'NONE';
  licenseStartDate?: Date;
  licenseEndDate?: Date;
  clubRoles?: Record<string, string>;
}

export default function LicenseManagementPage() {
  const [users, setUsers] = useState<UserLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'user_permissions'));
      const usersList = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          email: doc.id,
          displayName: data.displayName,
          vereinssoftwareLicense: data.vereinssoftwareLicense || false,
          licenseType: data.licenseType || 'NONE',
          licenseStartDate: data.licenseStartDate?.toDate(),
          licenseEndDate: data.licenseEndDate?.toDate(),
          clubRoles: data.clubRoles || {}
        };
      });
      
      setUsers(usersList.sort((a, b) => a.email.localeCompare(b.email)));
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseAction = async (userEmail: string, action: string, duration?: number) => {
    try {
      const response = await fetch('/api/license-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          userEmail,
          duration 
        })
      });

      if (response.ok) {
        alert(`Lizenz-Aktion erfolgreich für ${userEmail}`);
        loadUsers(); // Reload data
      } else {
        alert('Fehler bei Lizenz-Aktion');
      }
    } catch (error) {
      console.error('License action error:', error);
      alert('Fehler bei Lizenz-Aktion');
    }
  };

  const getLicenseStatus = (user: UserLicense) => {
    if (!user.vereinssoftwareLicense) return { text: 'Keine Lizenz', color: 'bg-gray-500' };
    
    if (user.licenseType === 'FULL') return { text: 'Vollversion', color: 'bg-green-500' };
    
    if (user.licenseType === 'TRIAL') {
      const now = new Date();
      const endDate = user.licenseEndDate;
      
      if (endDate && endDate > now) {
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { text: `Test (${daysLeft} Tage)`, color: 'bg-orange-500' };
      } else {
        return { text: 'Test abgelaufen', color: 'bg-red-500' };
      }
    }
    
    return { text: 'Aktiv', color: 'bg-blue-500' };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Lade Benutzer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Lizenz-Management</h1>
        <p className="text-muted-foreground">Vereinssoftware-Lizenzen verwalten</p>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-sm text-gray-600">Benutzer gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.licenseType === 'FULL').length}
            </div>
            <p className="text-sm text-gray-600">Volllizenzen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {users.filter(u => u.licenseType === 'TRIAL').length}
            </div>
            <p className="text-sm text-gray-600">Testlizenzen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {users.filter(u => !u.vereinssoftwareLicense).length}
            </div>
            <p className="text-sm text-gray-600">Ohne Lizenz</p>
          </CardContent>
        </Card>
      </div>

      {/* Benutzer-Liste */}
      <Card>
        <CardHeader>
          <CardTitle>Benutzer & Lizenzen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Benutzer</th>
                  <th className="text-left p-3">Club-Rollen</th>
                  <th className="text-left p-3">Lizenz-Status</th>
                  <th className="text-left p-3">Gültig bis</th>
                  <th className="text-left p-3">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const status = getLicenseStatus(user);
                  const clubRolesList = Object.values(user.clubRoles || {});
                  
                  return (
                    <tr key={user.email} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{user.displayName || user.email}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {clubRolesList.map((role, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                          {clubRolesList.length === 0 && (
                            <span className="text-gray-400 text-sm">Keine Rollen</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={`${status.color} text-white`}>
                          {status.text}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {user.licenseEndDate ? (
                          <span className="text-sm">
                            {user.licenseEndDate.toLocaleDateString('de-DE')}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            {user.licenseType === 'FULL' ? 'Unbegrenzt' : '-'}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {!user.vereinssoftwareLicense && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleLicenseAction(user.email, 'activate_trial')}
                              >
                                3M Test
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleLicenseAction(user.email, 'activate_full')}
                              >
                                Vollversion
                              </Button>
                            </>
                          )}
                          
                          {user.vereinssoftwareLicense && user.licenseType === 'TRIAL' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleLicenseAction(user.email, 'extend_trial', 1)}
                              >
                                +1M
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleLicenseAction(user.email, 'activate_full')}
                              >
                                Vollversion
                              </Button>
                            </>
                          )}
                          
                          {user.vereinssoftwareLicense && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleLicenseAction(user.email, 'deactivate')}
                            >
                              Deaktivieren
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}