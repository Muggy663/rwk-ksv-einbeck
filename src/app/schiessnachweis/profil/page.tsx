"use client";

import { useState, useEffect } from "react";
import { logError } from '@/lib/utils/secure-logger';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Mail, Save, Edit2 } from "lucide-react";
import Link from "next/link";
import { auth, db } from '@/lib/firebase/config';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [lastName, setLastName] = useState("");
  const [verein, setVerein] = useState("");
  const [kreisverband, setKreisverband] = useState("");
  const [strasse, setStrasse] = useState("");
  const [plz, setPlz] = useState("");
  const [wohnort, setWohnort] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  // originalData-Wert wird aktuell nicht gelesen, nur gesetzt (für spätere "Änderungen verwerfen"-Funktion vorgehalten)
  const [, setOriginalData] = useState({displayName: "", lastName: "", verein: "", kreisverband: "", strasse: "", plz: "", wohnort: ""});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || "");
        
        try {
          const userDoc = await getDoc(doc(db, 'user_permissions', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const loadedData = {
              displayName: data.displayName || "",
              lastName: data.lastName || "",
              verein: data.verein || "",
              kreisverband: data.kreisverband || "",
              strasse: data.strasse || "",
              plz: data.plz || "",
              wohnort: data.wohnort || ""
            };
            if (data.displayName) setDisplayName(data.displayName);
            if (data.lastName) setLastName(data.lastName);
            if (data.verein) setVerein(data.verein);
            if (data.kreisverband) setKreisverband(data.kreisverband);
            if (data.strasse) setStrasse(data.strasse);
            if (data.plz) setPlz(data.plz);
            if (data.wohnort) setWohnort(data.wohnort);
            setOriginalData(loadedData);
          }
        } catch (error) {
          logError('Fehler beim Laden der Profildaten:', error);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!displayName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Namen ein.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const fullName = `${displayName.trim()} ${lastName.trim()}`.trim();
      
      await updateProfile(user, {
        displayName: fullName || displayName.trim()
      });

      await setDoc(doc(db, 'user_permissions', user.uid), {
        displayName: displayName.trim(),
        lastName: lastName.trim(),
        verein: verein.trim(),
        kreisverband: kreisverband.trim(),
        strasse: strasse.trim(),
        plz: plz.trim(),
        wohnort: wohnort.trim(),
        email: user.email,
        userType: 'INDIVIDUAL',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({
        title: "✅ Profil aktualisiert",
        description: "Ihre Daten wurden erfolgreich gespeichert.",
      });

      await user.reload();
      setUser(auth.currentUser);
      setIsEditing(false);
      setHasChanges(false);
      setOriginalData({displayName: displayName.trim(), lastName: lastName.trim(), verein: verein.trim(), kreisverband: kreisverband.trim(), strasse: strasse.trim(), plz: plz.trim(), wohnort: wohnort.trim()});
    } catch (error: any) {
      logError('Profil-Update fehlgeschlagen:', error);
      toast({
        title: "Fehler",
        description: error.message || "Profil konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="py-12">Lade...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/schiessnachweis">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Schießnachweis
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Mein Profil</CardTitle>
          <CardDescription>
            Ihre persönlichen Daten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">E-Mail</p>
                  <p className="font-medium">{user?.email || "-"}</p>
                </div>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Vorname</p>
                  {editingField === 'displayName' ? (
                    <Input
                      value={displayName}
                      onChange={(e) => {setDisplayName(e.target.value); setHasChanges(true);}}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className="h-8"
                    />
                  ) : (
                    <p className="font-medium">{displayName || "-"}</p>
                  )}
                </div>
                <Edit2 
                  className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" 
                  onClick={() => setEditingField('displayName')}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Nachname</p>
                  {editingField === 'lastName' ? (
                    <Input
                      value={lastName}
                      onChange={(e) => {setLastName(e.target.value); setHasChanges(true);}}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className="h-8"
                    />
                  ) : (
                    <p className="font-medium">{lastName || "-"}</p>
                  )}
                </div>
                <Edit2 
                  className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" 
                  onClick={() => setEditingField('lastName')}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Verein</p>
                  {editingField === 'verein' ? (
                    <Input
                      value={verein}
                      onChange={(e) => {setVerein(e.target.value); setHasChanges(true);}}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className="h-8"
                    />
                  ) : (
                    <p className="font-medium">{verein || "-"}</p>
                  )}
                </div>
                <Edit2 
                  className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" 
                  onClick={() => setEditingField('verein')}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Kreisverband</p>
                  {editingField === 'kreisverband' ? (
                    <Input
                      value={kreisverband}
                      onChange={(e) => {setKreisverband(e.target.value); setHasChanges(true);}}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className="h-8"
                    />
                  ) : (
                    <p className="font-medium">{kreisverband || "-"}</p>
                  )}
                </div>
                <Edit2 
                  className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" 
                  onClick={() => setEditingField('kreisverband')}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Adresse</p>
                  {editingField === 'adresse' ? (
                    <div className="space-y-2">
                      <Input
                        value={strasse}
                        onChange={(e) => {setStrasse(e.target.value); setHasChanges(true);}}
                        placeholder="Straße"
                        className="h-8"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={plz}
                          onChange={(e) => {setPlz(e.target.value); setHasChanges(true);}}
                          placeholder="PLZ"
                          className="h-8 w-24"
                        />
                        <Input
                          value={wohnort}
                          onChange={(e) => {setWohnort(e.target.value); setHasChanges(true);}}
                          onBlur={() => setEditingField(null)}
                          placeholder="Wohnort"
                          className="h-8 flex-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="font-medium">
                      {strasse || plz || wohnort 
                        ? `${strasse}${strasse && (plz || wohnort) ? ', ' : ''}${plz} ${wohnort}`.trim()
                        : "-"
                      }
                    </p>
                  )}
                </div>
                <Edit2 
                  className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" 
                  onClick={() => setEditingField('adresse')}
                />
              </div>

              <div className="flex gap-2">
                {hasChanges && (
                  <Button 
                    onClick={handleSave}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Speichert...' : 'Änderungen speichern'}
                  </Button>
                )}
                <Button 
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className={hasChanges ? "flex-1" : "w-full"}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Alles bearbeiten
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    className="pl-10 bg-muted"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  E-Mail kann nicht geändert werden
                </p>
              </div>
              
              <div>
                <Label htmlFor="displayName">Vorname</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Vorname"
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName">Nachname</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nachname"
                />
              </div>

              <div>
                <Label htmlFor="verein">Verein</Label>
                <Input
                  id="verein"
                  type="text"
                  value={verein}
                  onChange={(e) => setVerein(e.target.value)}
                  placeholder="z.B. KSV Einbeck"
                />
              </div>

              <div>
                <Label htmlFor="kreisverband">Kreisverband</Label>
                <Input
                  id="kreisverband"
                  type="text"
                  value={kreisverband}
                  onChange={(e) => setKreisverband(e.target.value)}
                  placeholder="z.B. Kreisverband Northeim"
                />
              </div>

              <div>
                <Label htmlFor="strasse">Straße</Label>
                <Input
                  id="strasse"
                  type="text"
                  value={strasse}
                  onChange={(e) => setStrasse(e.target.value)}
                  placeholder="Straße und Hausnummer"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <Label htmlFor="plz">PLZ</Label>
                  <Input
                    id="plz"
                    type="text"
                    value={plz}
                    onChange={(e) => setPlz(e.target.value)}
                    placeholder="12345"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="wohnort">Wohnort</Label>
                  <Input
                    id="wohnort"
                    type="text"
                    value={wohnort}
                    onChange={(e) => setWohnort(e.target.value)}
                    placeholder="Stadt"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Speichert...' : 'Speichern'}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              📧 E-Mail-Bestätigung
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {user?.emailVerified ? (
                <span className="text-green-600 dark:text-green-400">✅ E-Mail bestätigt</span>
              ) : (
                <span className="text-yellow-600 dark:text-yellow-400">⚠️ E-Mail noch nicht bestätigt. Bitte prüfen Sie Ihren Posteingang.</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
