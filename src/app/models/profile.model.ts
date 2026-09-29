export type LearningMode = 'audio' | 'visual' | 'reading' | 'mixed';

export interface StudentProfile {
  id: string;
  name: string;
  avatar: string;
  learningMode: LearningMode;
  totalScore: number;
  sessionsCount: number;
  createdAt: string;
  lastActiveDate: string | null; // 'YYYY-MM-DD', local calendar date of last login
  currentStreak: number;
  longestStreak: number;
}

export interface ReadingSession {
  id: string;
  profileId: string;
  contentLabel: string;
  startedAt: string;
  completedAt: string | null;
  chunksTotal: number;
  chunksCompleted: number;
  ttsPlays: number;
  score: number;
}

export interface ProfileStats {
  sessionsCompleted: number;
  totalSessions: number;
  totalScore: number;
}
