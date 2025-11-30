"use client";

import { useState, useEffect } from "react";
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, BookOpen } from "lucide-react";

interface TocItem {
  id: string;
  title: string;
  level: number;
  children?: TocItem[];
}

interface HandbookTocProps {
  activeTab: string;
}

export function HandbookToc({ activeTab }: HandbookTocProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  useEffect(() => {
    // Generiere TOC basierend auf aktuellem Tab
    const generateToc = () => {
      const headings = document.querySelectorAll('h2, h3, h4');
      const items: TocItem[] = [];
      
      headings.forEach((heading) => {
        if (heading.id) {
          const level = parseInt(heading.tagName.charAt(1));
          items.push({
            id: heading.id,
            title: heading.textContent || '',
            level: level
          });
        }
      });
      
      setTocItems(items);
    };

    // Warte kurz, bis DOM aktualisiert ist
    setTimeout(generateToc, 100);
  }, [activeTab]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (tocItems.length === 0) return null;

  return (
    <Card className="sticky top-4 max-h-[80vh] overflow-y-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Inhaltsverzeichnis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {tocItems.map((item) => (
          <div key={item.id}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToSection(item.id)}
              className={`w-full justify-start text-left h-auto py-2 px-3 ${
                item.level === 2 ? 'font-medium' : 
                item.level === 3 ? 'pl-6 text-sm' : 'pl-9 text-xs'
              }`}
            >
              <span className="truncate">{item.title}</span>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
