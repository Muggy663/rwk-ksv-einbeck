import { calculateAgeClass } from '@/types/rwk';
import type { Shooter } from '@/types/rwk';

export function assignAgeClassToShooter(shooter: Shooter, competitionYear: number = 2026): string | null {
  if (!shooter.birthYear || !shooter.gender) return null;
  return calculateAgeClass(shooter.birthYear, shooter.gender as 'male' | 'female', competitionYear);
}

export function getShootersForAgeClass(shooters: Shooter[], ageClassName: string, competitionYear: number = 2026): Shooter[] {
  return shooters.filter(shooter => {
    const ageClass = assignAgeClassToShooter(shooter, competitionYear);
    return ageClass === ageClassName;
  });
}
