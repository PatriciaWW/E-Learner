import { Injectable } from '@angular/core';
import { StudentProfile } from '../models/profile.model';
import { Badge, BadgeActivity, EarnedBadge } from '../models/badge.model';
import { BADGES } from '../data/badge-definitions';


interface BadgeProgress {
  currentStreak: number;
  longestStreak: number;
  totalLoginDays: number;
  activities: string[];
  earnedBadgeIds: string[];
  lastLoginDate: string | null;
}


@Injectable({
  providedIn: 'root'
})
export class BadgeService {

  private readonly STORAGE_KEY = 'mila_badge_progress';

  private readonly badges: Badge[] = BADGES;

  private currentStreak = 0;
  private longestStreak = 0;
  private totalLoginDays = 0;

  private activities = new Set<string>();
  private earnedBadgeIds = new Set<string>();

  private lastLoginDate: string | null = null;

  constructor() {
    this.loadProgress();
  }

  // --------------------------------------------------
  // LOGIN / STREAK
  // --------------------------------------------------

  /**
   * Records today's login.
   *
   * A login is only counted once per calendar day.
   */
  recordLogin(): void {
    const today = this.getToday();

    // Already logged in today
    if (this.lastLoginDate === today) {
      return;
    }

    if (!this.lastLoginDate) {
      // First ever login
      this.currentStreak = 1;
    } else {
      const daysSinceLastLogin = this.daysBetween(
        this.lastLoginDate,
        today
      );

      if (daysSinceLastLogin === 1) {
        // Consecutive day
        this.currentStreak++;
      } else {
        // Student missed one or more days
        this.currentStreak = 1;
      }
    }

    this.totalLoginDays++;

    // Longest streak NEVER decreases
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }

    this.lastLoginDate = today;

    this.checkBadges();
    this.saveProgress();
  }

  // --------------------------------------------------
  // ACTIVITIES
  // --------------------------------------------------

  /**
   * Mark an activity as completed.
   *
   * Activities are permanent.
   */
  completeActivity(activity: BadgeActivity): void {
    this.activities.add(activity);

    this.checkBadges();
    this.saveProgress();
  }

  /**
   * Called when the student successfully runs
   * their Hello World program.
   */
  completeHelloWorld(): void {
    this.completeActivity('hello-world');
  }

  /**
   * Called when the student successfully completes
   * a quiz.
   */
  completeQuiz(): void {
    this.completeActivity('quiz');
  }

  // --------------------------------------------------
  // BADGES
  // --------------------------------------------------

  /**
   * Check all badges and permanently award
   * any newly achieved badges.
   */
  private checkBadges(): void {
    for (const badge of this.badges) {

      // Already earned = permanently earned
      if (this.earnedBadgeIds.has(badge.id)) {
        continue;
      }

      let earned = false;

      // Streak-based badges
      if (badge.activity === 'login') {
        earned = this.longestStreak >= badge.threshold;
      }

      // Activity-based badges
      else if (badge.activity) {
        earned = this.activities.has(badge.activity);
      }

      if (earned) {
        this.earnedBadgeIds.add(badge.id);
      }
    }
  }

  /**
   * Return all badges and whether they have been earned.
   */
  getBadges(): EarnedBadge[] {
    return this.badges.map(badge => ({
      ...badge,
      earned: this.earnedBadgeIds.has(badge.id)
    }));
  }

  /**
   * Return only earned badges.
   */
  getEarnedBadges(): EarnedBadge[] {
    return this.getBadges().filter(badge => badge.earned);
  }

  /**
   * Return total points from earned badges.
   */
  getTotalPoints(): number {
    return this.getEarnedBadges()
      .reduce((total, badge) => total + badge.points, 0);
  }

  // --------------------------------------------------
  // PROGRESS GETTERS
  // --------------------------------------------------

  getCurrentStreak(): number {
    return this.currentStreak;
  }

  getLongestStreak(): number {
    return this.longestStreak;
  }

  getTotalLoginDays(): number {
    return this.totalLoginDays;
  }

  getLastLoginDate(): string | null {
    return this.lastLoginDate;
  }

  // --------------------------------------------------
  // STORAGE
  // --------------------------------------------------

  private saveProgress(): void {
    const progress: BadgeProgress = {
      currentStreak: this.currentStreak,
      longestStreak: this.longestStreak,
      totalLoginDays: this.totalLoginDays,
      activities: Array.from(this.activities),
      earnedBadgeIds: Array.from(this.earnedBadgeIds),
      lastLoginDate: this.lastLoginDate
    };

    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(progress)
    );
  }

  private loadProgress(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);

    if (!saved) {
      return;
    }

    try {
      const progress: BadgeProgress = JSON.parse(saved);

      this.currentStreak = progress.currentStreak ?? 0;
      this.longestStreak = progress.longestStreak ?? 0;
      this.totalLoginDays = progress.totalLoginDays ?? 0;

      this.activities = new Set(
        progress.activities ?? []
      );

      this.earnedBadgeIds = new Set(
        progress.earnedBadgeIds ?? []
      );

      this.lastLoginDate = progress.lastLoginDate ?? null;

    } catch (error) {
      console.error(
        'Could not load badge progress:',
        error
      );
    }
  }

  // --------------------------------------------------
  // DATE HELPERS
  // --------------------------------------------------

  private getToday(): string {
    const today = new Date();

    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('-');
  }

  private daysBetween(
    earlierDate: string,
    laterDate: string
  ): number {

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

  // --------------------------------------------------
  // DEVELOPMENT / TESTING
  // --------------------------------------------------

  resetProgress(): void {
    this.currentStreak = 0;
    this.longestStreak = 0;
    this.totalLoginDays = 0;

    this.activities.clear();
    this.earnedBadgeIds.clear();

    this.lastLoginDate = null;

    localStorage.removeItem(this.STORAGE_KEY);
  }
}