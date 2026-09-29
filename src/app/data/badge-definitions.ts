import { Badge } from '../models/badge.model';

export const POINTS_BADGES: Badge[] = [
  { id: 'pts-first-steps',  name: 'First Steps',    description: 'Earn your first 20 points',   icon: '🌱', category: 'points', threshold: 20 },
  { id: 'pts-rising-star',  name: 'Rising Star',     description: 'Reach 100 points',             icon: '⭐', category: 'points', threshold: 100 },
  { id: 'pts-high-achiever',name: 'High Achiever',   description: 'Reach 300 points',             icon: '💪', category: 'points', threshold: 300 },
  { id: 'pts-master',       name: 'Master Learner',  description: 'Reach 750 points',             icon: '🏆', category: 'points', threshold: 750 },
];

export const CONSISTENCY_BADGES: Badge[] = [
  { id: 'streak-beginner',   name: 'Beginner',   description: 'Log in 2 days in a row',  icon: '🔥',   category: 'consistency', threshold: 2 },
  { id: 'streak-curious',    name: 'Curious',    description: 'Log in 4 days in a row',  icon: '🔥🔥', category: 'consistency', threshold: 4 },
  { id: 'streak-determined', name: 'Determined', description: 'Log in 7 days in a row',  icon: '🔥🔥🔥', category: 'consistency', threshold: 7 },
  { id: 'streak-consistent', name: 'Consistent', description: 'Log in 14 days in a row', icon: '👑',   category: 'consistency', threshold: 14 },
];

export const ALL_BADGES: Badge[] = [...POINTS_BADGES, ...CONSISTENCY_BADGES];