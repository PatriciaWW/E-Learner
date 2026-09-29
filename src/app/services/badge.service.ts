import { Injectable } from '@angular/core';
import { StudentProfile } from '../models/profile.model';
import { Badge, EarnedBadge } from '../models/badge.model';
import { ALL_BADGES } from '../data/badge-definitions';

@Injectable({ providedIn: 'root' })
export class BadgeService {
  getBadgesForProfile(profile: StudentProfile): EarnedBadge[] {
    return ALL_BADGES.map(b => this.toEarnedBadge(b, profile));
  }

  /** Compare two snapshots of a profile to find badges that just unlocked (for a celebration toast). */
  getNewlyEarnedBadges(before: StudentProfile, after: StudentProfile): Badge[] {
    const earnedBefore = new Set(
      this.getBadgesForProfile(before).filter(b => b.earned).map(b => b.id)
    );
    return this.getBadgesForProfile(after).filter(b => b.earned && !earnedBefore.has(b.id));
  }

  private toEarnedBadge(badge: Badge, profile: StudentProfile): EarnedBadge {
    // Use longestStreak, not currentStreak, so a badge earned once stays earned
    // even if the student misses a day later — badges should feel permanent.
    const value = badge.category === 'points' ? profile.totalScore : (profile.longestStreak ?? 0);
    return {
      ...badge,
      earned: value >= badge.threshold,
      progress: Math.min(100, Math.round((value / badge.threshold) * 100)),
    };
  }
}