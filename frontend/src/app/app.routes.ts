import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'requests',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/request-list.component').then(m => m.RequestListComponent)
  },
  {
    path: 'requests/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/request-form.component').then(m => m.RequestFormComponent)
  },
  {
    path: 'requests/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/request-form.component').then(m => m.RequestFormComponent)
  },
  { path: '', pathMatch: 'full', redirectTo: 'requests' },
  { path: '**', redirectTo: 'requests' }
];
