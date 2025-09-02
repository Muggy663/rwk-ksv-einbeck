// src/components/rwk-ordnung/faq-search.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, HelpCircle, BookOpen } from 'lucide-react';
import { searchFAQ, getAllFAQs, type FAQItem } from '@/lib/faq-search';

export function FAQSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<FAQItem[]>([]);
  const [showAllFAQs, setShowAllFAQs] = useState(false);

  const allFAQs = useMemo(() => getAllFAQs(), []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      const searchResults = searchFAQ(query);
      setResults(searchResults);
      setShowAllFAQs(false);
    } else {
      setResults([]);
      setShowAllFAQs(false);
    }
  };

  const displayedFAQs = searchQuery.trim().length >= 2 ? results : (showAllFAQs ? allFAQs : []);

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5 text-primary" />
            Fragen zur RWK-Ordnung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Frage zur RWK-Ordnung eingeben... (z.B. 'Aufstieg Kreisoberliga')"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {searchQuery.trim().length === 0 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAllFAQs(!showAllFAQs)}
                className="text-primary hover:text-primary/80 underline text-sm flex items-center gap-1 mx-auto"
              >
                <BookOpen className="h-4 w-4" />
                {showAllFAQs ? 'Häufige Fragen ausblenden' : 'Alle häufigen Fragen anzeigen'}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {displayedFAQs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {searchQuery.trim().length >= 2 
              ? `${results.length} Ergebnis${results.length !== 1 ? 'se' : ''} gefunden`
              : `Häufige Fragen (${allFAQs.length})`
            }
          </h3>
          
          {displayedFAQs.map((item) => (
            <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{item.question}</CardTitle>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {item.section}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
                {item.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.keywords.slice(0, 4).map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchQuery.trim().length >= 2 && results.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Keine Ergebnisse für "{searchQuery}" gefunden.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Versuchen Sie andere Suchbegriffe wie "Aufstieg", "Wanderpokal" oder "Ersatzschützen".
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}