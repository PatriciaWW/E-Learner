import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';
import { Journey } from './pages/journey/journey';
import { Code } from './pages/code/code';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'register' },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.RegisterComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'reader',
    loadComponent: () => import('./pages/reader/reader.component').then(m => m.ReaderComponent),
    canActivate: [authGuard],
  },
  // { path: '**', redirectTo: 'register' },

  // {
  //   path: 'journey',
  //   loadComponent: () => import('./pages/journey/journey').then(m => m.Journey),
  //   // canActivate: [authGuard],
  // },
  // {
  //   path: 'code/:topic',
  //   loadComponent: () => import('./pages/code/code').then(m => m.Code),
  //   // canActivate: [authGuard],
  // }
  { 
    path: 'journey', 
    component: Journey, 
    pathMatch: 'full' ,
    title : "E-Learning" 
    
  },
  { 
    path: 'code/:topic', 
    component: Code, 
    pathMatch: 'full' ,
    title : "E-Learning" 
    
  }
];
