import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'training' | 'competition' | 'community' | 'milestone';
  requirement: {
    type: 'shots_count' | 'duels_won' | 'competitions_joined' | 'groups_created' | 'training_sessions';
    target: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: Date;
  progress: number;
}

export class AchievementsService {
  
  // Vordefinierte Achievements
  static readonly ACHIEVEMENTS: Achievement[] = [
    // Training Achievements
    {
      id: 'first_100_shots',
      title: 'Erste 100 Schuss',
      description: '100 Schuss im Schießnachweis dokumentiert',
      icon: '🎯',
      category: 'training',
      requirement: { type: 'shots_count', target: 100 },
      rarity: 'common'
    },
    {
      id: 'sharpshooter_1000',
      title: 'Scharfschütze',
      description: '1.000 Schuss dokumentiert',
      icon: '🏹',
      category: 'training',
      requirement: { type: 'shots_count', target: 1000 },
      rarity: 'rare'
    },
    {
      id: 'training_veteran',
      title: 'Trainings-Veteran',
      description: '50 Trainingseinheiten absolviert',
      icon: '🎖️',
      category: 'training',
      requirement: { type: 'training_sessions', target: 50 },
      rarity: 'epic'
    },
    
    // Competition Achievements
    {
      id: 'duel_winner_10',
      title: 'Duell-Meister',
      description: '10 Duelle gewonnen',
      icon: '⚔️',
      category: 'competition',
      requirement: { type: 'duels_won', target: 10 },
      rarity: 'rare'
    },
    {
      id: 'competition_starter',
      title: 'Wettkampf-Debütant',
      description: 'Erstes Live-Wettkampf beendet',
      icon: '🏆',
      category: 'competition',
      requirement: { type: 'competitions_joined', target: 1 },
      rarity: 'common'
    },
    
    // Community Achievements
    {
      id: 'group_founder',
      title: 'Gruppen-Gründer',
      description: 'Erste Trainingsgruppe erstellt',
      icon: '👥',
      category: 'community',
      requirement: { type: 'groups_created', target: 1 },
      rarity: 'common'
    },
    
    // Milestone Achievements
    {
      id: 'social_pioneer',
      title: 'Social Training Pioneer',
      description: 'Einer der ersten 100 Social Training Nutzer',
      icon: '🚀',
      category: 'milestone',
      requirement: { type: 'shots_count', target: 1 }, // Automatisch für frühe Nutzer
      rarity: 'legendary'
    }
  ];

  // User-Achievements laden
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const userRef = doc(db, 'user_achievements', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data().achievements || [];
      }
      return [];
    } catch (error) {
      console.error('Fehler beim Laden der Achievements:', error);
      return [];
    }
  }

  // Achievement freischalten
  static async unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      const userRef = doc(db, 'user_achievements', userId);
      const userDoc = await getDoc(userRef);
      
      const currentAchievements = userDoc.exists() ? userDoc.data().achievements || [] : [];
      
      // Prüfe ob Achievement bereits freigeschaltet
      if (currentAchievements.some((a: UserAchievement) => a.achievementId === achievementId)) {
        return false;
      }
      
      const newAchievement: UserAchievement = {
        achievementId,
        unlockedAt: new Date(),
        progress: 100
      };
      
      const updatedAchievements = [...currentAchievements, newAchievement];
      
      if (userDoc.exists()) {
        await updateDoc(userRef, { achievements: updatedAchievements });
      } else {
        await setDoc(userRef, { achievements: updatedAchievements });
      }
      
      return true;
    } catch (error) {
      console.error('Fehler beim Freischalten des Achievements:', error);
      return false;
    }
  }

  // Fortschritt prüfen und Achievements freischalten
  static async checkAndUnlockAchievements(userId: string, stats: {
    totalShots?: number;
    duelsWon?: number;
    competitionsJoined?: number;
    groupsCreated?: number;
    trainingSessions?: number;
  }): Promise<string[]> {
    const unlockedAchievements: string[] = [];
    
    for (const achievement of this.ACHIEVEMENTS) {
      const { type, target } = achievement.requirement;
      let currentValue = 0;
      
      switch (type) {
        case 'shots_count':
          currentValue = stats.totalShots || 0;
          break;
        case 'duels_won':
          currentValue = stats.duelsWon || 0;
          break;
        case 'competitions_joined':
          currentValue = stats.competitionsJoined || 0;
          break;
        case 'groups_created':
          currentValue = stats.groupsCreated || 0;
          break;
        case 'training_sessions':
          currentValue = stats.trainingSessions || 0;
          break;
      }
      
      if (currentValue >= target) {
        const unlocked = await this.unlockAchievement(userId, achievement.id);
        if (unlocked) {
          unlockedAchievements.push(achievement.id);
        }
      }
    }
    
    return unlockedAchievements;
  }

  // Achievement-Details abrufen
  static getAchievementById(id: string): Achievement | undefined {
    return this.ACHIEVEMENTS.find(a => a.id === id);
  }

  // Alle Achievements mit User-Status
  static async getUserAchievementStatus(userId: string) {
    const userAchievements = await this.getUserAchievements(userId);
    
    return this.ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      unlocked: userAchievements.some(ua => ua.achievementId === achievement.id),
      unlockedAt: userAchievements.find(ua => ua.achievementId === achievement.id)?.unlockedAt
    }));
  }
}
