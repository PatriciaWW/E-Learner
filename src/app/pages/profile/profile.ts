import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DbService } from '../../services/db.service';
import { LearningMode } from '../../models/profile.model';
import { Nav } from '../nav/nav';
import { Footer } from '../footer/footer';
import { BadgeService } from '../../services/badge.service';

const AVATARS: { emoji: string; label: string }[] = [
  { emoji: '🦁', label: 'Lion' },
  { emoji: '🐬', label: 'Dolphin' },
  { emoji: '🦋', label: 'Butterfly' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '🌟', label: 'Star' },
  { emoji: '🐢', label: 'Turtle' },
];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule,Nav, Footer],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent {
  private db = inject(DbService);
  private router = inject(Router)

  readonly avatars = AVATARS;
  readonly profile = this.db.currentProfile;
  readonly stats = computed(() => {
    const p = this.profile();
    return p ? this.db.getProfileStats(p.id) : null;
  });

  name = '';
  avatar = AVATARS[0].emoji;
  learningMode: LearningMode = 'audio';
  savedJustNow = signal(false);

  constructor() {
    const p = this.profile();
    if (p) {
      this.name = p.name;
      this.avatar = p.avatar;
      this.learningMode = p.learningMode;
    }
  }

  pickAvatar(emoji: string): void {
    this.avatar = emoji;
  }

  save(): void {
    const p = this.profile();
    if (!p || !this.name.trim()) return;
    this.db.updateProfile(p.id, {
      name: this.name.trim(),
      avatar: this.avatar,
      learningMode: this.learningMode,
    });
    this.savedJustNow.set(true);
    setTimeout(() => this.savedJustNow.set(false), 2000);
  }

  switchProfile(): void {
    this.db.logout();
    this.router.navigate(['/register']);
  }

  // profile.ts
  private badgeService = inject(BadgeService);
  readonly badges = computed(() => {
    const p = this.profile();
    return p ? this.badgeService.getBadgesForProfile(p) : [];
  });
}
