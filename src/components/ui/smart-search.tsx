"use client";
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Mic, MicOff, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  type: 'team' | 'league' | 'shooter' | 'club';
  title: string;
  subtitle: string;
  action: () => void;
  score: number;
}

interface SmartSearchProps {
  teamData: any;
  onResult: (result: SearchResult) => void;
  onOpenAccordion: (leagueId: string) => void;
  onExpandTeam: (teamId: string) => void;
}

export function SmartSearch({ teamData, onResult, onOpenAccordion, onExpandTeam }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);

  // Fuzzy matching function
  const fuzzyMatch = (text: string, query: string): number => {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (textLower.includes(queryLower)) return 1;
    
    let score = 0;
    let queryIndex = 0;
    
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        score++;
        queryIndex++;
      }
    }
    
    return queryIndex === queryLower.length ? score / queryLower.length : 0;
  };

  // Natural language processing
  const processNaturalQuery = (query: string): SearchResult[] => {
    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];

    // Intent detection
    const intents = {
      best: /beste|führend|spitze|top|nummer 1|platz 1/,
      worst: /schlechtest|letzt|schwächst/,
      team: /mannschaft|team/,
      shooter: /schütze|schießer/,
      league: /liga|klasse|gruppe/,
      club: /verein|club/
    };

    if (!teamData?.leagues) return [];

    // Process each league and team
    teamData.leagues.forEach((league: any) => {
      // League matching
      const leagueScore = fuzzyMatch(league.name, query);
      if (leagueScore > 0.3) {
        results.push({
          type: 'league',
          title: league.name,
          subtitle: `Liga mit ${league.teams?.length || 0} Teams`,
          action: () => onOpenAccordion(league.id),
          score: leagueScore
        });
      }

      // Team matching
      league.teams?.forEach((team: any) => {
        const teamScore = Math.max(
          fuzzyMatch(team.name, query),
          fuzzyMatch(team.clubName, query)
        );

        if (teamScore > 0.3) {
          results.push({
            type: 'team',
            title: team.name,
            subtitle: `${team.clubName} - Rang ${team.rank || 'AK'}`,
            action: () => {
              onOpenAccordion(league.id);
              setTimeout(() => onExpandTeam(team.id), 100);
            },
            score: teamScore
          });
        }

        // Shooter matching (if loaded)
        team.shootersResults?.forEach((shooter: any) => {
          const shooterScore = fuzzyMatch(shooter.shooterName, query);
          if (shooterScore > 0.4) {
            results.push({
              type: 'shooter',
              title: shooter.shooterName,
              subtitle: `${team.name} - ${shooter.total || 0} Ringe`,
              action: () => {
                onOpenAccordion(league.id);
                setTimeout(() => onExpandTeam(team.id), 100);
              },
              score: shooterScore
            });
          }
        });
      });
    });

    // Handle natural language queries
    if (intents.best.test(queryLower)) {
      const bestTeam = teamData.leagues
        .flatMap((l: any) => l.teams || [])
        .filter((t: any) => !t.outOfCompetition)
        .sort((a: any, b: any) => (b.sortingScore || 0) - (a.sortingScore || 0))[0];

      if (bestTeam) {
        results.unshift({
          type: 'team',
          title: `🏆 ${bestTeam.name}`,
          subtitle: `Tabellenführer mit ${bestTeam.sortingScore || bestTeam.totalScore} Ringen`,
          action: () => {
            const league = teamData.leagues.find((l: any) => 
              l.teams?.some((t: any) => t.id === bestTeam.id)
            );
            if (league) {
              onOpenAccordion(league.id);
              setTimeout(() => onExpandTeam(bestTeam.id), 100);
            }
          },
          score: 1
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 8);
  };

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'de-DE';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Spracherkennung fehlgeschlagen",
          description: "Bitte versuchen Sie es erneut oder nutzen Sie die Texteingabe.",
          variant: "destructive"
        });
      };
    }
  }, [toast]);

  // Search when query changes
  useEffect(() => {
    if (query.length > 1) {
      const searchResults = processNaturalQuery(query);
      setResults(searchResults);
      setShowSuggestions(searchResults.length > 0);
    } else {
      setResults([]);
      setShowSuggestions(false);
    }
  }, [query, teamData]);

  const startVoiceSearch = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      toast({
        title: "Spracherkennung nicht verfügbar",
        description: "Ihr Browser unterstützt keine Spracherkennung.",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'team': return '🎯';
      case 'league': return '🏆';
      case 'shooter': return '👤';
      case 'club': return '🏢';
      default: return '🔍';
    }
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🤖 Intelligente Suche: 'beste Mannschaft', 'SV Einbeck', 'Liga 1'..."
            className="pl-10 pr-4"
            onFocus={() => setShowSuggestions(results.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={startVoiceSearch}
          disabled={isListening}
          className="whitespace-nowrap"
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4 mr-1 animate-pulse" />
              Hört zu...
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-1" />
              🎤
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            toast({
              title: "🤖 KI-Suche Tipps",
              description: "Versuchen Sie: 'beste Mannschaft', 'SV Einbeck', 'Liga 1', 'Schütze Schmidt' oder sprechen Sie Ihre Suche!"
            });
          }}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>

      {showSuggestions && results.length > 0 && (
        <Card className="absolute top-full mt-1 w-full z-50 max-h-80 overflow-y-auto shadow-lg">
          <div className="p-2">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
                onClick={() => {
                  result.action();
                  setQuery('');
                  setShowSuggestions(false);
                  toast({
                    title: "Navigation",
                    description: `Springe zu: ${result.title}`
                  });
                }}
              >
                <span className="text-lg">{getTypeIcon(result.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{result.title}</div>
                  <div className="text-sm text-muted-foreground truncate">{result.subtitle}</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(result.score * 100)}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}