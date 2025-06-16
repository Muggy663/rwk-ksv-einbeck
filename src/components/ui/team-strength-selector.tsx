// src/components/ui/team-strength-selector.tsx
"use client";
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Info } from 'lucide-react';

interface TeamStrengthSelectorProps {
  value: string;
  onChange: (value: string) => void;
  clubName?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  tooltip?: string;
}

export function TeamStrengthSelector({
  value,
  onChange,
  clubName = '',
  label = 'Mannschaftsstärke',
  className = '',
  disabled = false,
  required = false,
  tooltip = 'Die Mannschaftsstärke bestimmt die Nummerierung der Mannschaft (I, II, III, etc.). Mannschaften werden nach Spielstärke benannt, wobei I die stärkste Mannschaft ist.'
}: TeamStrengthSelectorProps) {
  // Generate example team name based on club name and selected strength
  const getExampleName = (strength: string) => {
    if (!clubName) return '';
    return `${clubName} ${strength}`;
  };
  
  // Available team strengths
  const strengths = ['I', 'II', 'III', 'IV', 'V', 'Einzel'];
  
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-1.5">
        <Label htmlFor="team-strength" className={required ? 'after:content-["*"] after:ml-0.5 after:text-destructive' : ''}>
          {label}
        </Label>
        <HelpTooltip content={tooltip}>
          <Info className="h-4 w-4 text-muted-foreground" />
        </HelpTooltip>
      </div>
      
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id="team-strength" className="w-full">
          <SelectValue placeholder="Stärke auswählen" />
        </SelectTrigger>
        <SelectContent>
          {strengths.map((strength) => (
            <SelectItem key={strength} value={strength}>
              <div>
                <span>{strength}</span>
                {clubName && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({getExampleName(strength)})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {value && clubName && (
        <p className="text-sm text-muted-foreground mt-1">
          Vorschlag: <span className="font-medium">{getExampleName(value)}</span>
        </p>
      )}
    </div>
  );
}