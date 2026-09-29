import { Component, effect, inject, signal } from '@angular/core';
import { DbService } from '../../services/db.service';
import { Badge } from '../../models/badge.model';

@Component({
  selector: 'app-badge-toast',
  standalone: true,
  imports: [],
  templateUrl: './badge-toast.html',
  styleUrl: './badge-toast.css',
})
export class BadgeToast {
  private db = inject(DbService);
  readonly visibleBadges = signal<Badge[]>([]);

  constructor() {
    effect(() => {
      const badges = this.db.newlyEarnedBadges();
      if (badges.length) {
        this.visibleBadges.set(badges);
        this.db.clearNewBadges(); // consume immediately so it can't refire on the next change detection
        setTimeout(() => this.visibleBadges.set([]), 4000);
      }
    });
  }

  dismiss(): void {
    this.visibleBadges.set([]);
  }
}