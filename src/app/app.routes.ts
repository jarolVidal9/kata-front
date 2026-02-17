import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [publicGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/components/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/components/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'survey/:id',
    loadComponent: () => import('./features/surveys/survey-public/survey-public.component').then(m => m.SurveyPublicComponent)
  },
  {
    path: 'surveys',
    canActivate: [authGuard],
    children: [
      {
        path: 'new',
        loadComponent: () => import('./features/surveys/survey-form/survey-form.component').then(m => m.SurveyFormComponent)
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./features/surveys/survey-form/survey-form.component').then(m => m.SurveyFormComponent)
      },
      {
        path: 'results/:id',
        loadComponent: () => import('./features/surveys/survey-results/survey-results.component').then(m => m.SurveyResultsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
