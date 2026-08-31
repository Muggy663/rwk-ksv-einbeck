import { Achievement } from '@/types/achievements';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  progress?: number;
}

export default function AchievementBadge({ achievement, unlocked, progress = 0 }: AchievementBadgeProps) {
  const rarityColors = {
    bronze: 'bg-amber-600',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-500',
    diamond: 'bg-blue-500'
  };

  return (
    <div className={`p-4 rounded-lg border ${unlocked ? 'bg-white' : 'bg-gray-100 opacity-60'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${rarityColors[achievement.rarity]}`}>
          {achievement.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{achievement.title}</h3>
          <p className="text-sm text-gray-600">{achievement.description}</p>
          {!unlocked && progress > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(progress / achievement.requirement) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{progress}/{achievement.requirement}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
