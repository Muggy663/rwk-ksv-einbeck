import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Loader2, Sparkles, Link as LinkIcon } from 'lucide-react';
import { SocialTrainingService } from '@/lib/services/social-training-service';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface ResultEntryProps {
  onSubmit: (result: any) => void;
}

export function ResultEntry({ onSubmit }: ResultEntryProps) {
  const [shots, setShots] = useState('');
  const [rings, setRings] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [proofType, setProofType] = useState<'photo' | 'trust' | 'verified'>('trust');
  const [photo, setPhoto] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzePhoto = async () => {
    if (!photo) return;
    
    setIsAnalyzing(true);
    try {
      const analysis = await SocialTrainingService.analyzePhotoWithGemini(photo);
      
      if (analysis.confidence > 70) {
        setShots(analysis.shots.toString());
        setRings(analysis.rings.toString());
        toast({
          title: "🤖 KI-Analyse erfolgreich!",
          description: `${analysis.shots} Schuss, ${analysis.rings} Ringe erkannt (${analysis.confidence}% sicher)`
        });
      } else {
        toast({
          title: "⚠️ Unsichere Analyse",
          description: `Bitte Werte manuell prüfen (${analysis.confidence}% sicher)`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler bei KI-Analyse",
        description: "Bitte Werte manuell eingeben",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    const result = {
      shots: parseInt(shots),
      rings: parseInt(rings),
      average: parseInt(rings) / parseInt(shots),
      discipline,
      proofType,
      photo,
      date: new Date()
    };
    onSubmit(result);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ergebnis eingeben</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Disziplin</Label>
          <Select value={discipline} onValueChange={setDiscipline}>
            <SelectTrigger>
              <SelectValue placeholder="Disziplin wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LG">Luftgewehr</SelectItem>
              <SelectItem value="LP">Luftpistole</SelectItem>
              <SelectItem value="KK">Kleinkaliber</SelectItem>
              <SelectItem value="GK">Großkaliber</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Schuss</Label>
            <Input 
              type="number" 
              value={shots} 
              onChange={(e) => setShots(e.target.value)}
              placeholder="10"
            />
          </div>
          <div>
            <Label>Ringe</Label>
            <Input 
              type="number" 
              value={rings} 
              onChange={(e) => setRings(e.target.value)}
              placeholder="95"
            />
          </div>
        </div>

        <div>
          <Label>Nachweis-Art</Label>
          <RadioGroup value={proofType} onValueChange={(value: any) => setProofType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="trust" id="trust" />
              <Label htmlFor="trust">Vertrauen (Standard)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="photo" id="photo" />
              <Label htmlFor="photo">📸 Foto-Beweis</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="verified" id="verified" />
              <Label htmlFor="verified">🛡️ Verifiziert (Trainer/Admin)</Label>
            </div>
          </RadioGroup>
        </div>

        {proofType === 'photo' && (
          <div>
            <Label>Foto hochladen</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="hidden" 
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>Foto auswählen</span>
                </Button>
              </label>
              {photo && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-green-600">✓ {photo.name}</p>
                  <Button 
                    onClick={analyzePhoto} 
                    disabled={isAnalyzing}
                    className="w-full"
                    variant="secondary"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        KI analysiert...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        🤖 Mit KI analysieren
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Button onClick={handleSubmit} className="w-full" disabled={!shots || !rings || !discipline}>
            Ergebnis speichern
          </Button>
          
          <div className="text-center">
            <Button asChild variant="outline" className="w-full">
              <Link href="/schiessnachweis/neuer-eintrag">
                <LinkIcon className="h-4 w-4 mr-2" />
                Auch im Schießnachweis speichern
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
