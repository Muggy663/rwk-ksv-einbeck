// src/app/admin/social/moderation/page.tsx
"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { Shield, AlertTriangle, Ban, CheckCircle, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ModerationItem {
  id: string;
  type: 'inappropriate_name' | 'spam' | 'harassment' | 'other';
  reportedUser: string;
  reportedBy: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
}

export default function AdminModerationPage() {
  const [reports] = useState<ModerationItem[]>([
    {
      id: '1',
      type: 'inappropriate_name',
      reportedUser: 'TestUser123',
      reportedBy: 'ReporterUser',
      description: 'Unangemessener Benutzername',
      status: 'pending',
      createdAt: new Date()
    }
  ]);

  const handleResolve = (reportId: string) => {
    toast({
      title: "Meldung bearbeitet",
      description: "Die Meldung wurde als bearbeitet markiert."
    });
  };

  const handleDismiss = (reportId: string) => {
    toast({
      title: "Meldung abgelehnt",
      description: "Die Meldung wurde abgelehnt."
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'inappropriate_name': return 'Unangemessener Name';
      case 'spam': return 'Spam';
      case 'harassment': return 'Belästigung';
      default: return 'Sonstiges';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Ausstehend</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Bearbeitet</Badge>;
      case 'dismissed':
        return <Badge className="bg-gray-100 text-gray-800">Abgelehnt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center mb-6">
        <BackButton className="mr-2" fallbackHref="/admin" />
        <div>
          <h1 className="text-2xl font-bold">Community-Moderation</h1>
          <p className="text-muted-foreground">Verwaltung von Meldungen und Community-Richtlinien</p>
        </div>
      </div>

      <div className="grid gap-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Keine Meldungen vorhanden</p>
              <p className="text-sm text-muted-foreground mt-2">
                Alle Community-Aktivitäten verlaufen regelkonform
              </p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      {getTypeLabel(report.type)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Gemeldeter Benutzer: {report.reportedUser}
                    </p>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Beschreibung:</p>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Gemeldet von:</span>
                      <div className="font-medium">{report.reportedBy}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gemeldet am:</span>
                      <div className="font-medium">{report.createdAt.toLocaleDateString()}</div>
                    </div>
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(report.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Bearbeiten
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDismiss(report.id)}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Ablehnen
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Profil ansehen
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}