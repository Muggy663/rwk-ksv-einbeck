"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface UrkundenData {
  name: string;
  jahre: number;
  ehrung: 'Bronze' | 'Silber' | 'Gold';
  datum: string;
  gender?: string;
}

interface UrkundenGeneratorProps {
  jubilare: UrkundenData[];
}

export function UrkundenGenerator({ jubilare }: UrkundenGeneratorProps) {
  const [urkundenDatum, setUrkundenDatum] = useState(
    new Date().toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    }).toUpperCase()
  );
  
  const generateUrkunde = async (jubilar: UrkundenData) => {
    const urkundeDiv = document.createElement('div');
    urkundeDiv.style.width = '210mm';
    urkundeDiv.style.height = '297mm';
    urkundeDiv.style.padding = '10mm';
    urkundeDiv.style.fontFamily = 'serif';
    urkundeDiv.style.backgroundColor = 'white';
    urkundeDiv.style.position = 'absolute';
    urkundeDiv.style.left = '-9999px';
    urkundeDiv.style.boxSizing = 'border-box';
    
    const getEhrungText = (ehrung: string) => {
      switch (ehrung) {
        case 'Bronze': return `DIE EHRENNADEL IN BRONZE`;
        case 'Silber': return `DIE EHRENNADEL IN SILBER`;
        case 'Gold': return `DIE EHRENNADEL IN GOLD`;
        default: return `DIE EHRENNADEL`;
      }
    };

    urkundeDiv.innerHTML = `
      <div style="text-align: center; line-height: 1.4; background: white; font-family: 'Algerian', serif; padding: 10px;">
        
        <!-- Titel URKUNDE ganz oben -->
        <h1 style="font-family: 'Algerian', serif; font-size: 96px; font-weight: bold; margin: 0 0 80px 0; letter-spacing: 8px; color: #2d5016; text-shadow: 2px 2px 0px #FFD700, -2px -2px 0px #FFD700, 2px -2px 0px #FFD700, -2px 2px 0px #FFD700;">URKUNDE</h1>
        
        <!-- Text Teil 1 -->
        <p style="font-family: 'Algerian', serif; font-size: 24px; margin: 15px 0; font-weight: bold;">${(jubilar.gender === 'female' || jubilar.gender === 'w' || jubilar.gender === 'W') ? 'DER SCHÜTZENSCHWESTER' : 'DEM SCHÜTZENBRUDER'}</p>
        
        <h2 style="font-family: 'Algerian', serif; font-size: 36px; font-weight: bold; margin: 15px 0; letter-spacing: 2px;">${jubilar.name.toUpperCase()}</h2>
        
        <p style="font-family: 'Algerian', serif; font-size: 22px; margin: 10px 0;">WIRD HEUTE AUS ANLASS DER</p>
        <p style="font-family: 'Algerian', serif; font-size: 22px; margin: 10px 0;">${jubilar.jahre}-JÄHRIGEN MITGLIEDSCHAFT</p>
        <p style="font-family: 'Algerian', serif; font-size: 22px; margin: 10px 0;">IN DER</p>
        
        <!-- Großes Logo mittig -->
        <div style="margin: 20px 0; height: 200px; display: flex; align-items: center; justify-content: center;">
          <img src="/images/esg.png" alt="Einbecker Schützengilde von 1457 e.V." style="height: 200px; width: auto;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
          <div style="display: none; font-family: 'Algerian', serif; font-size: 20px; font-weight: bold;">EINBECKER SCHÜTZENGILDE VON 1457 E.V.</div>
        </div>
        
        <!-- Auszeichnung -->
        <p style="font-family: 'Algerian', serif; font-size: 28px; font-weight: bold; margin: 15px 0; letter-spacing: 1px;">${getEhrungText(jubilar.ehrung)}</p>
        
        <!-- Verb -->
        <p style="font-family: 'Algerian', serif; font-size: 32px; font-weight: bold; margin: 20px 0; letter-spacing: 4px;">VERLIEHEN</p>
        
        <!-- Ort und Datum -->
        <p style="font-family: 'Algerian', serif; font-size: 20px; margin: 20px 0;">EINBECK, DEN ${urkundenDatum}</p>
        
        <!-- Unterschrift untereinander -->
        <div style="margin-top: 20px; text-align: center; display: flex; flex-direction: column; align-items: center;">
          <div style="margin: 10px 0;">
            <img src="/images/Unterschrift Marcel Buenger.png" alt="Unterschrift Marcel Bünger" style="height: 60px; width: auto; display: block; margin: 0 auto; filter: brightness(0.7) contrast(1.3);" />
          </div>
          <p style="font-family: 'Algerian', serif; font-size: 18px; font-weight: bold; margin: 5px 0; color: black;">Marcel Bünger</p>
          <p style="font-family: 'Algerian', serif; font-size: 16px; margin: 5px 0; color: black;">1. Vorsitzender</p>
        </div>
        
      </div>
    `;
    
    document.body.appendChild(urkundeDiv);
    
    try {
      const canvas = await html2canvas(urkundeDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: 'white'
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save(`Urkunde_${jubilar.name.replace(/\s+/g, '_')}_${jubilar.jahre}Jahre.pdf`);
    } finally {
      document.body.removeChild(urkundeDiv);
    }
  };

  const generateAllUrkunden = async () => {
    for (const jubilar of jubilare) {
      await generateUrkunde(jubilar);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <Label htmlFor="datum">Datum für alle Urkunden:</Label>
        <Input
          id="datum"
          value={urkundenDatum}
          onChange={(e) => setUrkundenDatum(e.target.value)}
          placeholder="z.B. 15. MÄRZ 2025"
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-1 gap-2">
        {jubilare.map((jubilar, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded">
            <div>
              <span className="font-medium">{jubilar.name}</span>
              <span className="ml-2 text-sm text-gray-600">
                {jubilar.jahre} Jahre - {jubilar.ehrung}
              </span>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => generateUrkunde(jubilar)}
            >
              Urkunde erstellen
            </Button>
          </div>
        ))}
      </div>
      
      {jubilare.length > 1 && (
        <Button 
          onClick={generateAllUrkunden}
          className="w-full"
        >
          Alle Urkunden erstellen ({jubilare.length})
        </Button>
      )}
    </div>
  );
}