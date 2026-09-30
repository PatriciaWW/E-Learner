export interface Badge {
  id: string;
  name: string;
  svg: string;
  description: string;
  points: number;
  threshold: number; // no. of days logged in/ activities activated to earn 
  activity?: BadgeActivity;

}

export type BadgeActivity =
  | 'login'
  | 'hello-world'
  | 'quiz'
  | 'learning'
  | 'streak'
  | 'habit'
  | 'devoted';


export interface EarnedBadge extends Badge {
  earned: boolean;
}

export interface BadgeProgress {
  profileId: string;
  currentStreak: number;
  longestStreak: number;
  totalLoginDays: number;
  activities: BadgeActivity[];
  earnedBadgeIds: string[];
  lastLoginDate: string | null;
}