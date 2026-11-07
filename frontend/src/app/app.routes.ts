/**
 * Application Routing Table.
 *
 * Defines lazy-loaded feature routes with clear separation of concerns:
 * - /dashboard: Overview of active and completed onboarding cases
 * - /new-hire: Employee registration form to trigger orchestration
 * - /cases/:id: Detailed step timeline, execution artifacts, and approval triggers
 * - /approvals: Dedicated Human-in-the-Loop review and audit queue
 */

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/onboarding/presentation/pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard | OnboardIQ'
  },
  {
    path: 'new-hire',
    loadComponent: () => import('./features/onboarding/presentation/pages/new-hire/new-hire.component').then(m => m.NewHireComponent),
    title: 'Initiate Onboarding | OnboardIQ'
  },
  {
    path: 'cases/:id',
    loadComponent: () => import('./features/onboarding/presentation/pages/onboarding-detail/onboarding-detail.component').then(m => m.OnboardingDetailComponent),
    title: 'Case Workflow | OnboardIQ'
  },
  {
    path: 'approvals',
    loadComponent: () => import('./features/approval/presentation/pages/approval-queue/approval-queue.component').then(m => m.ApprovalQueueComponent),
    title: 'Approval Queue | OnboardIQ'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
