"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { useKMAuth } from '@/hooks/useKMAuth';

export default function KMMannschaftsregeln() {
  const { toast } = useToast();
  const { hasFullAccess, loading: authLoading } = useKMAuth();
  const [loading, setLoading] = useState(true);
  const [expandedDisziplinen, setExpandedDisziplinen] = useState<string[]>([]);

  const toggleDisziplin = (disziplin: string) => {
    setExpandedDisziplinen(prev => 
      prev.includes(disziplin) 
        ? prev.filter(d => d !== disziplin)
        : [...prev, disziplin]
    );
  };

  const mannschaftsregeln = {
    "lichtpunktgewehr_auflage": {
      name: "🚫 Lichtpunktgewehr Auflage",
      spoNummer: "11.10",
      mannschaften: [
        {
          name: "KEINE MANNSCHAFTSWERTUNG",
          erlaubteKlassen: [],
          regel: "Achtung: Keine Mannschaftswertung bei Lichtpunktgewehr!"
        }
      ]
    },
    "lg_auflage_kreisintern": {
      name: "🎯 LG Auflage (kreisintern)",
      spoNummer: "1.11",
      mannschaften: [
        {
          name: "Schüler gemischt",
          erlaubteKlassen: ["Schüler männl.", "Schüler weibl."],
          regel: "Schüler männlich und weiblich dürfen zusammen"
        },
        {
          name: "Jugend gemischt",
          erlaubteKlassen: ["Jugend männl.", "Jugend weibl."],
          regel: "Jugend männlich und weiblich dürfen zusammen"
        },
        {
          name: "Junioren I gemischt",
          erlaubteKlassen: ["Junioren I männl.", "Junioren I weibl."],
          regel: "Junioren und Juniorinnen I dürfen zusammen"
        },
        {
          name: "Junioren II gemischt",
          erlaubteKlassen: ["Junioren II männl.", "Junioren II weibl."],
          regel: "Junioren und Juniorinnen II dürfen zusammen"
        },
        {
          name: "Schützen I / Damen I",
          erlaubteKlassen: ["Herren I", "Damen I"],
          regel: "Herren I und Damen I dürfen zusammen"
        }
      ]
    },
    "lg_freihand": {
      name: "🏹 LG Freihand",
      spoNummer: "1.10",
      mannschaften: [
        {
          name: "Schüler gemischt",
          erlaubteKlassen: ["Schüler männl.", "Schüler weibl."],
          regel: "Schüler männlich und weiblich dürfen zusammen"
        },
        {
          name: "Jugend gemischt",
          erlaubteKlassen: ["Jugend männl.", "Jugend weibl."],
          regel: "Jugend männlich und weiblich dürfen zusammen"
        },
        {
          name: "Junioren männlich",
          erlaubteKlassen: ["Junioren I männl.", "Junioren II männl."],
          regel: "Junioren I+II männlich dürfen zusammen"
        },
        {
          name: "Juniorinnen",
          erlaubteKlassen: ["Junioren I weibl.", "Junioren II weibl."],
          regel: "Juniorinnen I+II dürfen zusammen"
        },
        {
          name: "Herren I",
          erlaubteKlassen: ["Herren I"],
          regel: "Nur Herren I untereinander"
        },
        {
          name: "Damen I",
          erlaubteKlassen: ["Damen I"],
          regel: "Nur Damen I untereinander"
        },
        {
          name: "Herren II",
          erlaubteKlassen: ["Herren II"],
          regel: "Nur Herren II untereinander"
        },
        {
          name: "Damen II",
          erlaubteKlassen: ["Damen II"],
          regel: "Nur Damen II untereinander"
        },
        {
          name: "Herren III",
          erlaubteKlassen: ["Herren III"],
          regel: "Nur Herren III untereinander"
        },
        {
          name: "Damen III",
          erlaubteKlassen: ["Damen III"],
          regel: "Nur Damen III untereinander"
        },
        {
          name: "Herren IV",
          erlaubteKlassen: ["Herren IV"],
          regel: "Nur Herren IV untereinander"
        },
        {
          name: "Damen IV",
          erlaubteKlassen: ["Damen IV"],
          regel: "Nur Damen IV untereinander"
        },
        {
          name: "Herren V",
          erlaubteKlassen: ["Herren V"],
          regel: "Nur Herren V untereinander"
        },
        {
          name: "Damen V",
          erlaubteKlassen: ["Damen V"],
          regel: "Nur Damen V untereinander"
        }
      ]
    },
    "lg_auflage_senioren": {
      name: "🎯 LG Auflage (Senioren)",
      spoNummer: "1.11",
      mannschaften: [
        {
          name: "Senioren 0 gemischt",
          erlaubteKlassen: ["Senioren 0", "Seniorinnen 0"],
          regel: "Senioren 0 männlich und weiblich dürfen zusammen"
        },
        {
          name: "Senioren I-II gemischt",
          erlaubteKlassen: ["Senioren I männl.", "Senioren I weibl.", "Senioren II männl.", "Senioren II weibl."],
          regel: "Senioren I und II (männlich/weiblich) dürfen zusammen"
        },
        {
          name: "Senioren III-V gemischt",
          erlaubteKlassen: ["Senioren III männl.", "Senioren III weibl.", "Senioren IV männl.", "Senioren IV weibl.", "Senioren V männl.", "Senioren V weibl."],
          regel: "Senioren III-V (männlich/weiblich) dürfen zusammen"
        }
      ]
    },
    "lp_freihand": {
      name: "🔫 Luftpistole",
      spoNummer: "2.10",
      mannschaften: [
        {
          name: "Schüler gemischt",
          erlaubteKlassen: ["Schüler männl.", "Schüler weibl."],
          regel: "Schüler männlich und weiblich dürfen zusammen"
        },
        {
          name: "Jugend gemischt",
          erlaubteKlassen: ["Jugend männl.", "Jugend weibl."],
          regel: "Jugend männlich und weiblich dürfen zusammen"
        },
        {
          name: "Junioren männlich",
          erlaubteKlassen: ["Junioren I männl.", "Junioren II männl."],
          regel: "Junioren I+II männlich dürfen zusammen"
        },
        {
          name: "Juniorinnen",
          erlaubteKlassen: ["Junioren I weibl.", "Junioren II weibl."],
          regel: "Juniorinnen I+II dürfen zusammen"
        },
        {
          name: "Herren I",
          erlaubteKlassen: ["Herren I"],
          regel: "Nur Herren I untereinander"
        },
        {
          name: "Damen I",
          erlaubteKlassen: ["Damen I"],
          regel: "Nur Damen I untereinander"
        },
        {
          name: "Herren II",
          erlaubteKlassen: ["Herren II"],
          regel: "Nur Herren II untereinander"
        },
        {
          name: "Damen II",
          erlaubteKlassen: ["Damen II"],
          regel: "Nur Damen II untereinander"
        },
        {
          name: "Herren III",
          erlaubteKlassen: ["Herren III"],
          regel: "Nur Herren III untereinander"
        },
        {
          name: "Damen III",
          erlaubteKlassen: ["Damen III"],
          regel: "Nur Damen III untereinander"
        },
        {
          name: "Herren IV",
          erlaubteKlassen: ["Herren IV"],
          regel: "Nur Herren IV untereinander"
        },
        {
          name: "Damen IV",
          erlaubteKlassen: ["Damen IV"],
          regel: "Nur Damen IV untereinander"
        }
      ]
    },
    "lp_auflage": {
      name: "🔫 Luftpistole Auflage",
      spoNummer: "2.11",
      mannschaften: [
        {
          name: "Senioren 0 gemischt",
          erlaubteKlassen: ["Senioren 0", "Seniorinnen 0"],
          regel: "Senioren 0 männlich und weiblich dürfen zusammen"
        },
        {
          name: "Senioren I-II gemischt",
          erlaubteKlassen: ["Senioren I männl.", "Senioren I weibl.", "Senioren II männl.", "Senioren II weibl."],
          regel: "Senioren I und II (männlich/weiblich) dürfen zusammen"
        },
        {
          name: "Senioren III-V gemischt",
          erlaubteKlassen: ["Senioren III männl.", "Senioren III weibl.", "Senioren IV männl.", "Senioren IV weibl.", "Senioren V männl.", "Senioren V weibl."],
          regel: "Senioren III-V (männlich/weiblich) dürfen zusammen"
        }
      ]
    },
    "schnellfeuer_pistole": {
      name: "⚡ Olympische Schnellfeuerpistole",
      spoNummer: "2.30",
      mannschaften: [
        {
          name: "Schützen",
          erlaubteKlassen: ["Junioren I m", "Junioren II m", "Herren I", "Herren II", "Herren III", "Herren IV", "Damen I", "Damen II", "Damen III", "Damen IV"],
          regel: "Alle Klassen ohne Unterteilung"
        }
      ]
    },
    "kk_sportpistole": {
      name: "🎯 KK-Sportpistole",
      spoNummer: "2.40",
      mannschaften: [
        {
          name: "Herren",
          erlaubteKlassen: ["Herren I", "Herren II", "Herren III", "Herren IV"],
          regel: "Alle Herrenklassen dürfen zusammen"
        },
        {
          name: "Damen",
          erlaubteKlassen: ["Damen I", "Damen II", "Damen III", "Damen IV"],
          regel: "Alle Damenklassen dürfen zusammen"
        },
        {
          name: "Jugend",
          erlaubteKlassen: ["Jugend m", "Jugend w"],
          regel: "Jugend männlich und weiblich dürfen zusammen"
        },
        {
          name: "Juniorinnen",
          erlaubteKlassen: ["Juniorinnen I", "Juniorinnen II"],
          regel: "Nur Juniorinnen I+II"
        }
      ]
    },
    "standardpistole": {
      name: "🎯 Standardpistole",
      spoNummer: "2.60",
      mannschaften: [
        {
          name: "Ohne Unterteilung",
          erlaubteKlassen: ["Herren I", "Herren II", "Herren III", "Herren IV", "Damen I", "Damen II", "Damen III", "Damen IV"],
          regel: "Alle Wettkampfklassen ohne Unterteilung"
        }
      ]
    },
    "blasrohr": {
      name: "💨 Blasrohr",
      spoNummer: "12.10",
      mannschaften: [
        {
          name: "Keine Mannschaftswertung",
          erlaubteKlassen: [],
          regel: "Keine Mannschaftswertung in der Ausschreibung erwähnt"
        }
      ]
    }
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading || authLoading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade Mannschaftsregeln...</p>
        </div>
      </div>
    );
  }

  if (!hasFullAccess) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <Link href="/km-orga" className="text-primary hover:text-primary/80">← Zurück</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km-orga">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary">⚖️ Mannschaftsregeln KVM 2026</h1>
          <p className="text-muted-foreground">Klicken Sie auf eine Disziplin um die Mannschaftsregeln zu sehen</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {Object.entries(mannschaftsregeln).map(([key, disziplin]) => (
          <Card key={key} className="border-2">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50" 
              onClick={() => toggleDisziplin(key)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {disziplin.name}
                    <span className="text-sm font-normal text-gray-500">SpO {disziplin.spoNummer}</span>
                  </CardTitle>
                </div>
                {expandedDisziplinen.includes(key) ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronRight className="h-5 w-5" />
                }
              </div>
            </CardHeader>
            
            {expandedDisziplinen.includes(key) && (
              <CardContent>
                <div className="space-y-3">
                  {disziplin.mannschaften.map((mannschaft, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-gray-50">
                      <div className="font-medium text-gray-800 mb-1">
                        👥 {mannschaft.name}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Erlaubte Klassen:</strong> {mannschaft.erlaubteKlassen.join(", ")}
                      </div>
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        📋 {mannschaft.regel}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}