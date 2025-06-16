// src/components/ShooterSearch.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Shooter {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  clubId: string;
  [key: string]: any; // For any additional properties
}

interface ShooterSearchProps {
  shooters: Shooter[];
  onSelect: (shooter: Shooter) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  excludeIds?: string[];
}

export function ShooterSearch({
  shooters,
  onSelect,
  placeholder = "Schützen suchen...",
  className = "",
  label = "Schützensuche",
  excludeIds = []
}: ShooterSearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredShooters, setFilteredShooters] = useState<Shooter[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  // Filter shooters based on search query and excluded IDs
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredShooters([]);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = shooters
      .filter(shooter => 
        !excludeIds.includes(shooter.id) && 
        (shooter.firstName.toLowerCase().includes(query) || 
         shooter.lastName.toLowerCase().includes(query))
      )
      .sort((a, b) => {
        // Sort by last name first, then first name
        const lastNameComparison = a.lastName.localeCompare(b.lastName);
        if (lastNameComparison !== 0) return lastNameComparison;
        return a.firstName.localeCompare(b.firstName);
      })
      .slice(0, 10); // Limit to 10 results for performance
    
    setFilteredShooters(filtered);
    setHighlightedIndex(filtered.length > 0 ? 0 : -1);
  }, [searchQuery, shooters, excludeIds]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || filteredShooters.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredShooters.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(filteredShooters[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        break;
    }
  };
  
  const handleSelect = (shooter: Shooter) => {
    onSelect(shooter);
    setSearchQuery('');
    setShowResults(false);
  };
  
  const handleClear = () => {
    setSearchQuery('');
    setFilteredShooters([]);
  };
  
  return (
    <div className={`relative ${className}`}>
      <Label htmlFor="shooter-search">{label}</Label>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id="shooter-search"
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value || '');
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => {
            // Delay hiding results to allow for click events
            setTimeout(() => setShowResults(false), 200);
          }}
          onKeyDown={handleKeyDown}
          className="pl-8 pr-8"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Löschen</span>
          </Button>
        )}
      </div>
      
      {showResults && filteredShooters.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {filteredShooters.map((shooter, index) => (
              <li
                key={shooter.id}
                className={`px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground ${
                  index === highlightedIndex ? 'bg-accent text-accent-foreground' : ''
                }`}
                onClick={() => handleSelect(shooter)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="font-medium">{shooter.lastName}, {shooter.firstName}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {showResults && searchQuery && filteredShooters.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg p-4 text-center text-muted-foreground">
          Keine Schützen gefunden
        </div>
      )}
    </div>
  );
}