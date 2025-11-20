"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Search, Settings, Trash2, Eye } from "lucide-react";
import Link from "next/link";

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Lade alle Trainingsgruppen
    setIsLoading(false);
    setGroups([
      {
        id: "1",
        name: "Luftgewehr Training Einbeck",
        members: 8,
        admins: ["admin1"],
        createdBy: "user1",
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      }
    ]);
  }, []);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Admin-Dashboard
          </Link>
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Trainingsgruppen verwalten</h1>
        </div>
        <p className="text-muted-foreground">
          Übersicht und Verwaltung aller Trainingsgruppen in der Community
        </p>
      </div>

      {/* Suchleiste */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Gruppen durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Badge variant="secondary">
              {filteredGroups.length} Gruppen
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground">Gesamt Gruppen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{groups.filter(g => g.isActive).length}</div>
            <p className="text-xs text-muted-foreground">Aktive Gruppen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{groups.reduce((sum, g) => sum + g.members, 0)}</div>
            <p className="text-xs text-muted-foreground">Gesamt Mitglieder</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{Math.round(groups.reduce((sum, g) => sum + g.members, 0) / groups.length || 0)}</div>
            <p className="text-xs text-muted-foreground">Ø Mitglieder/Gruppe</p>
          </CardContent>
        </Card>
      </div>

      {/* Gruppen-Liste */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p>Lade Trainingsgruppen...</p>
            </CardContent>
          </Card>
        ) : filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Keine Gruppen gefunden</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Keine Gruppen entsprechen Ihrer Suche.' : 'Noch keine Trainingsgruppen erstellt.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map((group) => (
            <Card key={group.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{group.name}</h3>
                      <Badge variant={group.isActive ? "default" : "secondary"}>
                        {group.isActive ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Mitglieder:</span> {group.members}
                      </div>
                      <div>
                        <span className="font-medium">Erstellt:</span> {group.createdAt.toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Letzte Aktivität:</span> {group.lastActivity.toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">ID:</span> {group.id}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Bearbeiten
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Löschen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
