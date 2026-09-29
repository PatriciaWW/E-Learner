import { LearningMode, ProfileStats, ReadingSession, StudentProfile } from '../models/profile.model';
import { Injectable, inject, signal } from '@angular/core'; // add inject
import { Badge } from '../models/badge.model';
import { BadgeService } from './badge.service';

const PROFILES_KEY = 'smart_reader_profiles';
const SESSIONS_KEY = 'smart_reader_sessions';
const CURRENT_PROFILE_KEY = 'smart_reader_current_profile_id';

/**
 * DbService — localStorage-based "backend" for student profiles and reading sessions.
 * This is a direct TypeScript port of the original project's db.js so behaviour
 * (and existing saved data) carries over unchanged.
 */



@Injectable({ providedIn: 'root' })
export class DbService {
  private badgeService = inject(BadgeService);

  readonly currentProfile = signal<StudentProfile | null>(null);
  /** Badges earned in the most recent action; the toast reads this and clears it. */
  readonly newlyEarnedBadges = signal<Badge[]>([]);

  constructor() {
    this.currentProfile();
  }


  // ---------- internal helpers ----------
  private loadJSON<T>(key: string): T[] {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]') as T[];
    } catch {
      return [];
    }
  }

  private saveJSON<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private uid(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }


  // private restoreCurrentProfile(): void {
  //   const id = localStorage.getItem(CURRENT_PROFILE_KEY);
  //   if (!id) return;
  //   const profile = this.getProfile(id);
  //   if (profile) this.currentProfile.set(profile);
  // }

  // ---------- profiles ----------
  getProfiles(): StudentProfile[] {
    return this.loadJSON<StudentProfile>(PROFILES_KEY);
  }

  getProfile(id: string): StudentProfile | null {
    return this.getProfiles().find(p => p.id === id) || null;
  }

  // createProfile(): initialize the new fields
  

  createProfile(data: { name: string; avatar: string; learningMode: LearningMode }): StudentProfile {
    const profiles = this.getProfiles();
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
    longestStreak: 0,
  };
    profiles.push(profile);
    this.saveJSON(PROFILES_KEY, profiles);
    return profile;
  }

  // loginAs(): count the login
  loginAs(profile: StudentProfile): void {
    this.currentProfile.set(profile);
    localStorage.setItem(CURRENT_PROFILE_KEY, profile.id);
    this.recordLogin(profile.id); // <-- add this
  }

// restoreCurrentProfile(): also counts as a "login" on page refresh (new day)
private restoreCurrentProfile(): void {
  const id = localStorage.getItem(CURRENT_PROFILE_KEY);
  if (!id) return;
  const profile = this.getProfile(id);
  if (profile) {
    this.recordLogin(id); // <-- add this
    this.currentProfile.set(this.getProfile(id)); // re-fetch, since recordLogin may have updated it
  }
}

  updateProfile(id: string, updates: Partial<StudentProfile>): StudentProfile | null {
    const profiles = this.getProfiles();
    const idx = profiles.findIndex(p => p.id === id);
    if (idx === -1) return null;
    profiles[idx] = { ...profiles[idx], ...updates };
    this.saveJSON(PROFILES_KEY, profiles);
    if (this.currentProfile()?.id === id) this.currentProfile.set(profiles[idx]);
    return profiles[idx];
  }

  deleteProfile(id: string): void {
    const profiles = this.getProfiles().filter(p => p.id !== id);
    this.saveJSON(PROFILES_KEY, profiles);
    if (this.currentProfile()?.id === id) this.logout();
  }


  logout(): void {
    this.currentProfile.set(null);
    localStorage.removeItem(CURRENT_PROFILE_KEY);
  }

  // add near the top with the other keys — no new key needed, streak lives on the profile

// ---------- helpers ----------
private todayStr(): string {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

private isYesterday(dateStr: string, today: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const t = new Date(today + 'T00:00:00');
  const diffDays = Math.round((t.getTime() - d.getTime()) / 86400000);
  return diffDays === 1;
}

  recordLogin(id: string): StudentProfile | null {
  const profile = this.getProfile(id);
  if (!profile) return null;

  const today = this.todayStr();
  if (profile.lastActiveDate === today) return profile;

  let currentStreak: number;
  if (profile.lastActiveDate && this.isYesterday(profile.lastActiveDate, today)) {
    currentStreak = (profile.currentStreak ?? 0) + 1;
  } else {
    currentStreak = 1;
  }
  const longestStreak = Math.max(profile.longestStreak ?? 0, currentStreak);

  const updated = this.updateProfile(id, { lastActiveDate: today, currentStreak, longestStreak });
  if (updated) {
    const newBadges = this.badgeService.getNewlyEarnedBadges(profile, updated);
    if (newBadges.length) this.newlyEarnedBadges.set(newBadges);
  }
  return updated;
}

  // ---------- sessions ----------
  getSessions(profileId?: string): ReadingSession[] {
    const all = this.loadJSON<ReadingSession>(SESSIONS_KEY);
    return profileId ? all.filter(s => s.profileId === profileId) : all;
  }

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
      score: 0,
    };
    sessions.push(session);
    this.saveJSON(SESSIONS_KEY, sessions);
    return session;
  }

  updateSession(sessionId: string, updates: Partial<ReadingSession>): ReadingSession | null {
    const sessions = this.loadJSON<ReadingSession>(SESSIONS_KEY);
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return null;
    sessions[idx] = { ...sessions[idx], ...updates };
    this.saveJSON(SESSIONS_KEY, sessions);
    return sessions[idx];
  }

  completeSession(sessionId: string): ReadingSession | undefined {
  const sessions = this.loadJSON<ReadingSession>(SESSIONS_KEY);
  const s = sessions.find(s => s.id === sessionId);
  if (!s) return undefined;
  s.completedAt = new Date().toISOString();
  s.chunksCompleted = s.chunksTotal;
  this.saveJSON(SESSIONS_KEY, sessions);

  const profiles = this.loadJSON<StudentProfile>(PROFILES_KEY);
  const pi = profiles.findIndex(p => p.id === s.profileId);
  if (pi !== -1) {
    const before = { ...profiles[pi] }; // snapshot BEFORE this session's points are added

    profiles[pi].totalScore += s.score;
    profiles[pi].sessionsCount += 1;
    this.saveJSON(PROFILES_KEY, profiles);
    if (this.currentProfile()?.id === profiles[pi].id) this.currentProfile.set(profiles[pi]);

    const newBadges = this.badgeService.getNewlyEarnedBadges(before, profiles[pi]);
    if (newBadges.length) this.newlyEarnedBadges.set(newBadges);
  }
  return s;
}

clearNewBadges(): void {
  this.newlyEarnedBadges.set([]);

}  getProfileStats(profileId: string): ProfileStats {
    const sessions = this.getSessions(profileId);
    const completed = sessions.filter(s => s.completedAt);
    return {
      sessionsCompleted: completed.length,
      totalSessions: sessions.length,
      totalScore: this.getProfile(profileId)?.totalScore || 0,
    };
  }



}