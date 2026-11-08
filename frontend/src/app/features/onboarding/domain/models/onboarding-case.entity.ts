/**
 * Onboarding Case Domain Model and Utility Functions.
 *
 * Defines the core business entity representing an employee onboarding case
 * and pure helper functions for computing progress and active approval states.
 */

import { WorkflowStep } from './workflow-step.entity';

/**
 * Domain entity representing an employee onboarding lifecycle instance.
 */
export interface OnboardingCase {
  /** Unique primary key ID */
  id: number;

  /** Full name of the candidate */
  employeeName: string;

  /** Personal contact email of the candidate */
  employeeEmail: string;

  /** Job position title */
  role: string;

  /** Organizational department */
  department: string;

  /** Reporting supervisor's full name */
  managerName: string;

  /** Reporting supervisor's email */
  managerEmail: string;

  /** Starting date string (e.g., '2026-03-01') */
  startDate: string;

  /** Optional candidate GitHub username for org invitations */
  githubUsername?: string;

  /** Overall case status ('created' | 'running' | 'awaiting_approval' | 'completed' | 'failed') */
  status: string;

  /** Creation timestamp */
  createdAt: string;

  /** Last modification timestamp */
  updatedAt: string;

  /** Total number of configured workflow steps */
  totalSteps: number;

  /** Number of completed or skipped steps */
  completedSteps: number;

  /** Number of pending approvals blocking progression */
  pendingApprovals: number;

  /** Ordered workflow step entities */
  steps: WorkflowStep[];

  /** Associated approval records */
  approvals: any[];
}

/**
 * Calculate the overall completion percentage (0 - 100%) for an onboarding case.
 *
 * @param caseItem Target OnboardingCase entity.
 * @returns An integer between 0 and 100.
 */
export function calculateCaseProgress(caseItem: OnboardingCase): number {
  if (caseItem.totalSteps > 0) {
    return Math.round((caseItem.completedSteps / caseItem.totalSteps) * 100);
  }
  if (!caseItem.steps || caseItem.steps.length === 0) return 0;
  const completedCount = caseItem.steps.filter(s => s.status === 'completed' || s.status === 'skipped').length;
  return Math.round((completedCount / caseItem.steps.length) * 100);
}

/**
 * Locate the step that is currently blocking the workflow awaiting human sign-off.
 *
 * @param caseItem Target OnboardingCase entity.
 * @returns The WorkflowStep currently in 'awaiting_approval' state, or undefined.
 */
export function getCasePendingApprovalStep(caseItem: OnboardingCase): WorkflowStep | undefined {
  return caseItem.steps?.find(s => s.status === 'awaiting_approval');
}
