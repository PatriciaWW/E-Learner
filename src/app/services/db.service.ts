import { Injectable, inject, signal } from '@angular/core';
import { LearningMode, ReadingSession, StudentProfile } from '../models/profile.model';
import { Badge, BadgeActivity, BadgeProgress, EarnedBadge } from '../models/badge.model';
import { BADGES } from '../data/badge-definitions';


const PROFILES_KEY = 'smart_reader_profiles';
const CURRENT_PROFILE_KEY = 'smart_reader_current_profile_id';
const SESSIONS_KEY = 'reading_sessions';
const BADGE_PROGRESS_KEY = 'badge_progress';

/**
 * DbService
 * LocalStorage-based "backend" for:
 * - Student profiles
 * - Login/streak tracking
 * - Badge progress
 * - Earned badges
 */

@Injectable({
  providedIn: 'root'
})
export class DbService {

  readonly currentProfile =
    signal<StudentProfile | null>(null);

  /**
   * Badges earned during the most recent action.
   * The UI can use this to display a badge-earned toast.
   */
  readonly newlyEarnedBadges =
    signal<EarnedBadge[]>([]);


  constructor() {
    this.restoreCurrentProfile();
  }


  // ========================================================================================================
  // INTERNAL HELPERS
  // =============================================================================================================

  private loadJSON<T>(key: string): T[] {
    try {
      return JSON.parse(
        localStorage.getItem(key) || '[]'
      ) as T[];
    } catch {
      return [];
    }
  }


  private saveJSON<T>(
    key: string,
    data: T[]
  ): void {
    localStorage.setItem(
      key,
      JSON.stringify(data)
    );
  }


  private uid(): string {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 7)
    );
  }


  // =======================================================================================================
  // DATE HELPERS
  // ==========================================================================================================

  /**
   * Returns today's local date as:
   * YYYY-MM-DD
   */
  private todayStr(): string {
    const today = new Date();

    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('-');
  }

// Number of calendar days between two dates.
  private daysBetween(earlierDate: string,laterDate: string): number {
    const earlier = new Date(
      `${earlierDate}T00:00:00`
    );
    const later = new Date(
      `${laterDate}T00:00:00`
    );
    const difference =
      later.getTime() - earlier.getTime();

    return Math.round(
      difference / (1000 * 60 * 60 * 24)
    );
  }


// =======================================================================================================
// SESSIONS 
// =======================================================================================================

getSessions(profileId?: string): ReadingSession[] {
  const all = this.loadJSON<ReadingSession>(SESSIONS_KEY);
  return profileId
    ? all.filter(s => s.profileId === profileId)
    : all;
}

// Create sessions
createSession(profileId: string, contentLabel: string): ReadingSession {
  const sessions = this.loadJSON<ReadingSession>(SESSIONS_KEY);

  const session: ReadingSession = {
    id: this.uid(),
    profileId,
    contentLabel: contentLabel || 'Untitled',
    startedAt: new Date().toISOString(),
    completedAt: null,
    chunksTotal: 0,
    chunksCompleted: 0,
    ttsPlays: 0,
    score: 0
  };

  sessions.push(session);
  this.saveJSON(SESSIONS_KEY, sessions);

  return session;
}

// Update Sessions
updateSession(sessionId: string,updates: Partial<ReadingSession>): ReadingSession | null {
  const sessions = this.loadJSON<ReadingSession>(SESSIONS_KEY);
  const index = sessions.findIndex(s => s.id === sessionId);

  if (index === -1) {
    return null;
  }

  sessions[index] = {
    ...sessions[index],
    ...updates
  };

  this.saveJSON(SESSIONS_KEY, sessions);
  return sessions[index];
}

// Complete sessins 
completeSession(sessionId: string): ReadingSession | undefined {
  const sessions = this.loadJSON<ReadingSession>(SESSIONS_KEY);

  const session = sessions.find(s => s.id === sessionId);

  if (!session) {
    return undefined;
  }

  session.completedAt = new Date().toISOString();
  session.chunksCompleted = session.chunksTotal;

  this.saveJSON(SESSIONS_KEY, sessions);

  // Update profile score and completed session count
  const profiles = this.loadJSON<StudentProfile>(PROFILES_KEY);
  const profileIndex = profiles.findIndex(
    profile => profile.id === session.profileId
  );

  if (profileIndex !== -1) {
    profiles[profileIndex].totalScore += session.score;
    profiles[profileIndex].sessionsCount += 1;

    this.saveJSON(PROFILES_KEY, profiles);

    // Keep currentProfile() synchronized
    if (this.currentProfile()?.id === session.profileId) {
      this.currentProfile.set(profiles[profileIndex]);
    }
  }

  return session;
}

// =======================================================================================================
// PROFILES
// =======================================================================================================

  getProfiles(): StudentProfile[] {
    return this.loadJSON<StudentProfile>(
      PROFILES_KEY
    );
  }


  getProfile(id: string): StudentProfile | null {
    return (
      this.getProfiles()
        .find(profile => profile.id === id)
      || null
    );
  }


  createProfile(data: {
      name: string;
      avatar: string;
      learningMode: LearningMode;
    }
  ): StudentProfile {

    const profiles =
      this.getProfiles();

    const profile: StudentProfile = {
      id: this.uid(),
      name: data.name,
      avatar: data.avatar,
      learningMode: data.learningMode,
      totalScore: 0,
      sessionsCount: 0,
      createdAt: new Date().toISOString(),
      lastActiveDate: null,
      currentStreak: 0,
      longestStreak: 0
    };

    profiles.push(profile);
    this.saveJSON(
      PROFILES_KEY,
      profiles
    );

    // Initialize badge progress
    this.getBadgeProgress(profile.id);

    return profile;
  }


  // =======================================================================================================
  // LOGIN / PROFILE SESSION
  // =======================================================================================================

  loginAs(
    profile: StudentProfile
  ): void {

    this.currentProfile.set(profile);

    localStorage.setItem(
      CURRENT_PROFILE_KEY,
      profile.id
    );

    this.recordLogin(profile.id);
  }


  private restoreCurrentProfile(): void {
    const id =
      localStorage.getItem(
        CURRENT_PROFILE_KEY
      );

    if (!id) {
      return;
    }

    const profile =
      this.getProfile(id);

    if (!profile) {
      return;
    }
    this.currentProfile.set(profile);

    // Count today's login if it has not already been counted.
    this.recordLogin(id);
  }


  updateProfile(id: string,updates: Partial<StudentProfile>): StudentProfile | null {
    const profiles =
      this.getProfiles();

    const index =
      profiles.findIndex(
        profile => profile.id === id
      );

    if (index === -1) {
      return null;
    }

    profiles[index] = {
      ...profiles[index],
      ...updates
    };

    this.saveJSON(
      PROFILES_KEY,
      profiles
    );

    if (
      this.currentProfile()?.id === id
    ) {
      this.currentProfile.set(
        profiles[index]
      );
    }

    return profiles[index];
  }


  deleteProfile(id: string): void {
    const profiles =
      this.getProfiles()
        .filter(
          profile => profile.id !== id
        );

    this.saveJSON(
      PROFILES_KEY,
      profiles
    );

    // Also remove badge progress
    const badgeProgress =
      this.loadJSON<BadgeProgress>(
        BADGE_PROGRESS_KEY
      )
      .filter(
        progress =>
          progress.profileId !== id
      );

    this.saveJSON(
      BADGE_PROGRESS_KEY,
      badgeProgress
    );

    if (
      this.currentProfile()?.id === id
    ) {
      this.logout();
    }
  }


  logout(): void {
    this.currentProfile.set(null);

    localStorage.removeItem(
      CURRENT_PROFILE_KEY
    );

    this.newlyEarnedBadges.set([]);
  }


  // =========================================================================================================
  // BADGE PROGRESS
  // ============================================================================================================

  getBadgeProgress(profileId: string): BadgeProgress {
    const all = this.loadJSON<BadgeProgress>(BADGE_PROGRESS_KEY);

    let progress = all.find(item => item.profileId === profileId);

    if (!progress) {
      progress = {
        profileId,
        currentStreak: 0,
        longestStreak: 0,
        totalLoginDays: 0,
        activities: [],
        earnedBadgeIds: [],
        lastLoginDate: null
      };
      all.push(progress);

      this.saveJSON(
        BADGE_PROGRESS_KEY,
        all
      );
    }
    return progress;
  }

  getBadgeProgressValue(profileId: string, badge: Badge): number {
  const progress = this.getBadgeProgress(profileId);

  if (badge.activity === 'login') {
    return Math.min(progress.longestStreak, badge.threshold);
  }

  return progress.activities.includes(badge.activity!)
    ? badge.threshold
    : 0;
}

  // ====================================================================================================
  // LOGIN / STREAK
  // ======================================================================================================

  recordLogin(profileId: string): void {
    const all = this.loadJSON<BadgeProgress>(BADGE_PROGRESS_KEY);

    let progress =all.find(item =>
          item.profileId === profileId
      );

    if (!progress) {
      progress = {
        profileId,
        currentStreak: 0,
        longestStreak: 0,
        totalLoginDays: 0,
        activities: [],
        earnedBadgeIds: [],
        lastLoginDate: null
      };

      all.push(progress);
    }

    const today =
      this.todayStr();

    // Already logged in today. Do not increment anything.
    if (progress.lastLoginDate === today) {
      return;
    }


    // Calculate current streak
    if (!progress.lastLoginDate) {
      // First ever login
      progress.currentStreak = 1;

    } else {
      const daysSinceLastLogin =
        this.daysBetween(
          progress.lastLoginDate,
          today
        );
      if (
        daysSinceLastLogin === 1
      ) {
        // Consecutive login
        progress.currentStreak++;

      } else {
        // Missed one or more days
        progress.currentStreak = 1;
      }
    }


    // Total unique login days
    progress.totalLoginDays++;

    // Longest streak ,NEVER decreases.
    if (
      progress.currentStreak >
      progress.longestStreak
    ) {
      progress.longestStreak =
      progress.currentStreak;
    }

    progress.lastLoginDate = today;

    // Award badges
    const newlyEarned = this.checkAndAwardBadges(progress);

    // Save badge progress
    this.saveJSON(BADGE_PROGRESS_KEY,all);

    // Keep profile streak fields synchronized
    // if you still use them elsewhere in the app.
    this.updateProfile(
      profileId,
      {
        lastActiveDate: today,
        currentStreak:
          progress.currentStreak,
        longestStreak:
          progress.longestStreak
      }
    );

    if (newlyEarned.length) {

      this.newlyEarnedBadges.set(
        newlyEarned
      );
    }
  }


  // =========================================================
  // ACTIVITIES
  // =========================================================

  completeBadgeActivity(
    profileId: string,
    activity: BadgeActivity
  ): EarnedBadge[] {

    const all =
      this.loadJSON<BadgeProgress>(
        BADGE_PROGRESS_KEY
      );


    let progress = all.find(item =>
          item.profileId === profileId);

    if (!progress) {

      progress = {
        profileId,
        currentStreak: 0,
        longestStreak: 0,
        totalLoginDays: 0,
        activities: [],
        earnedBadgeIds: [],
        lastLoginDate: null
      };

      all.push(progress);
    }


    // Activity achievements are permanent.
    if (
      !progress.activities.includes(
        activity
      )
    ) {

      progress.activities.push(
        activity
      );
    }

    const newlyEarned =
      this.checkAndAwardBadges(
        progress
      );


    this.saveJSON(
      BADGE_PROGRESS_KEY,
      all
    );

    if (newlyEarned.length) {

      this.newlyEarnedBadges.set(
        newlyEarned
      );
    }
    return newlyEarned;
  }


  // ---------------------------------------------------------
  // Convenience methods
  // ---------------------------------------------------------

  completeHelloWorld(
    profileId: string
  ): EarnedBadge[] {

    return this.completeBadgeActivity(
      profileId,
      'hello-world'
    );
  }


  completeQuiz(
    profileId: string
  ): EarnedBadge[] {

    return this.completeBadgeActivity(
      profileId,
      'quiz'
    );
  }


  // =========================================================
  // BADGE CALCULATION
  // =========================================================

  private checkAndAwardBadges(progress: BadgeProgress): EarnedBadge[] {

    const newlyEarned:EarnedBadge[] = [];
    for (const badge of BADGES) {
      // Already earned.
      // This is what makes badges permanent.
      if (
        progress.earnedBadgeIds
          .includes(badge.id)
      ) {
        continue;
      }
      let earned = false;

      // -----------------------------------------------------
      // Login / streak badges
      // -----------------------------------------------------

      if (
        badge.activity === 'login'
      ) {
        // IMPORTANT: Use LONGEST streak, not current streak.
        earned =progress.longestStreak >=badge.threshold;}

      // -----------------------------------------------------
      // Activity badges
      // -----------------------------------------------------

      else if (badge.activity) {
        earned =progress.activities.includes(badge.activity);
      }

      // -----------------------------------------------------
      // Permanently award badge
      // -----------------------------------------------------

      if (earned) {
        progress.earnedBadgeIds.push(
          badge.id
        );

        newlyEarned.push({
          ...badge,
          earned: true
        });
      }
    }

    return newlyEarned;
  }


  // =========================================================
  // GET BADGES
  // =========================================================

  getBadges(profileId: string): EarnedBadge[] {

  const progress = this.getBadgeProgress(profileId);

  return BADGES.map(badge => ({
    ...badge,
    earned: progress.earnedBadgeIds.includes(badge.id)
  }));
}


  getEarnedBadges(
    profileId: string
  ): EarnedBadge[] {

    return this.getBadges(
      profileId
    )
    .filter(
      badge => badge.earned
    );
  }


  getBadgePoints(
    profileId: string
  ): number {

    return this.getEarnedBadges(
      profileId
    )
    .reduce(
      (total, badge) =>
        total + badge.points,
      0
    );
  }


  // =========================================================
  // STREAK STATS
  // =========================================================

  getStreakStats(
    profileId: string
  ) {

    const progress =
      this.getBadgeProgress(
        profileId
      );


    return {

      currentStreak:
        progress.currentStreak,

      longestStreak:
        progress.longestStreak,

      totalLoginDays:
        progress.totalLoginDays
    };
  }


  // =========================================================
  // NEWLY EARNED BADGES
  // =========================================================

  clearNewBadges(): void {

    this.newlyEarnedBadges.set([]);
  }


  // =========================================================
  // RESET
  // =========================================================

  resetBadgeProgress(
    profileId: string
  ): void {

    const all =
      this.loadJSON<BadgeProgress>(
        BADGE_PROGRESS_KEY
      );


    const progress =
      all.find(
        item =>
          item.profileId === profileId
      );


    if (!progress) {
      return;
    }


    progress.currentStreak = 0;

    progress.longestStreak = 0;

    progress.totalLoginDays = 0;

    progress.activities = [];

    progress.earnedBadgeIds = [];

    progress.lastLoginDate = null;


    this.saveJSON(
      BADGE_PROGRESS_KEY,
      all
    );


    // Reset profile fields too
    this.updateProfile(
      profileId,
      {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null
      }
    );


    this.newlyEarnedBadges.set([]);
  }



  
}