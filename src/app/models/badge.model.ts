export type BadgeCategory = 'points' | 'consistency';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  threshold: number; // points needed, or streak-days needed
}

export interface EarnedBadge extends Badge {
  earned: boolean;
  progress: number; // 0–100, for a "3/7 days" style progress bar
}