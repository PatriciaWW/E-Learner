import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DbService } from '../../services/db.service';
import { LearningMode, StudentProfile } from '../../models/profile.model';

const AVATARS: { emoji: string; label: string }[] = [
  { emoji: '🦁', label: 'Lion' },
  { emoji: '🐬', label: 'Dolphin' },
  { emoji: '🦋', label: 'Butterfly' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '🌟', label: 'Star' },
  { emoji: '🐢', label: 'Turtle' },
];

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  private db = inject(DbService);
  private router = inject(Router);

  readonly avatars = AVATARS;
  readonly existingProfiles = signal<StudentProfile[]>([]);

  name = '';
  selectedAvatar = AVATARS[0].emoji;
  learningMode: LearningMode = 'audio';
  nameError = false;

  constructor() {
    this.existingProfiles.set(this.db.getProfiles());
  }

  pickAvatar(emoji: string): void {
    this.selectedAvatar = emoji;
  }

  continueAs(profile: StudentProfile): void {
    this.db.loginAs(profile);
    this.router.navigate(['/reader']);
  }

  register(): void {
    const trimmed = this.name.trim();
    if (!trimmed) {
      this.nameError = true;
      return;
    }
    this.nameError = false;
    const profile = this.db.createProfile({
      name: trimmed,
      avatar: this.selectedAvatar,
      learningMode: this.learningMode,
    });
    this.db.loginAs(profile);
    this.router.navigate(['/reader']);
  }
}
