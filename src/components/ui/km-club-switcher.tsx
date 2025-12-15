"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Building } from 'lucide-react';
import { useKMContext } from '@/contexts/KMContext';

export const KMClubSwitcher: React.FC = () => {
  const { currentClubId, switchClub, userClubIds } = useKMContext();
  const [clubs, setClubs] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await fetch('/api/clubs');
        if (response.ok) {
          const data = await response.json();
          setClubs(data.data || []);
        }
      } catch (error) {
        console.error('Error loading clubs:', error);
      }
    };
    fetchClubs();
  }, []);

  if (userClubIds.length <= 1) return null;

  const currentClub = clubs.find(c => c.id === currentClubId);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          <span className="truncate">
            {currentClub?.name || 'Verein auswählen'}
          </span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50">
          {userClubIds.map(clubId => {
            const club = clubs.find(c => c.id === clubId);
            return (
              <button
                key={clubId}
                onClick={() => {
                  switchClub(clubId);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
                  clubId === currentClubId ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                {club?.name || clubId}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};