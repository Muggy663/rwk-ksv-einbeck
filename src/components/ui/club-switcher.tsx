import React, { useState, useEffect } from 'react';
import { useVereinAuth } from '@/app/verein/layout';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClubContext } from '@/contexts/ClubContext';
import { Building2 } from 'lucide-react';

export function ClubSwitcher() {
  const { assignedClubIdArray, currentClubId, switchClub } = useVereinAuth();
  const [clubs, setClubs] = useState<{id: string, name: string}[]>([]);
  
  useEffect(() => {
    const loadClubs = async () => {
      const clubData = [];
      for (const clubId of assignedClubIdArray) {
        const clubDoc = await getDoc(doc(db, 'clubs', clubId));
        if (clubDoc.exists()) {
          clubData.push({ id: clubDoc.id, name: clubDoc.data().name });
        }
      }
      setClubs(clubData);
    };
    if (assignedClubIdArray.length > 0) loadClubs();
  }, [assignedClubIdArray]);

  if (clubs.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Select value={currentClubId || ''} onValueChange={(value) => {

        switchClub(value);
      }}>
        <SelectTrigger className="w-full sm:w-[250px] min-w-0">
          <SelectValue placeholder="Verein wählen" />
        </SelectTrigger>
        <SelectContent className="max-w-[300px]">
          {clubs.map(club => (
            <SelectItem key={club.id} value={club.id} className="whitespace-normal">
              <span className="block truncate" title={club.name}>
                {club.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
