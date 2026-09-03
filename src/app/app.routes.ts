import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';
import { Journey } from './pages/journey/journey';
import { Code } from './pages/code/code';

export const routes: Routes = [
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
    { 
        path: 'journey', 
        component: Journey, 
        pathMatch: 'full' ,
        canActivate: [authGuard],
        title : "E-Learning" 
    },
    { 
        path: 'code', 
        component: Code, 
        pathMatch: 'full' ,
        canActivate: [authGuard],
        title : "E-Learning" 
    },
    { path: '', pathMatch: 'full', redirectTo: 'register' },

    { path: '**', redirectTo: 'register' },

];
