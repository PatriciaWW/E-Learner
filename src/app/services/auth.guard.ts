import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DbService } from './db.service';

/** Blocks profile/reader routes until a student profile is logged in. */
export const authGuard: CanActivateFn = () => {
  const db = inject(DbService);
  const router = inject(Router);
  if (db.currentProfile()) return true;
  return router.parseUrl('/register');
};
