import React, { useState, useEffect } from 'react';
import { useVereinAuth } from '@/app/verein/layout';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { NativeSelect } from '@/components/ui/native-select';
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
      <NativeSelect
        value={currentClubId || ''}
        onValueChange={(value) => {
          switchClub(value);
        }}
        placeholder="Verein wählen"
        className="w-full sm:w-[250px] min-w-0"
        options={clubs.map(club => ({ value: club.id, label: club.name }))}
      />
    </div>
  );
}
