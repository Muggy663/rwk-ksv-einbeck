export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'diamond';
  requirement: number;
  category: 'training' | 'social' | 'milestone';
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: Date;
  progress: number;
}
