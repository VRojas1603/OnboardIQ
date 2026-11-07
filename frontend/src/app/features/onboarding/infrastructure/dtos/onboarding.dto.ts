/**
 * Onboarding Infrastructure Data Transfer Objects (DTOs).
 *
 * Direct type mirrors of backend FastAPI Pydantic models (snake_case properties)
 * transferred over HTTP for cases, steps, and creation requests.
 */

/**
 * Backend wire schema for a workflow step record.
 */
export interface WorkflowStepDto {
  id: number;
  case_id: number;
  step_key: string;
  step_label: string;
  order_index: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_approval' | 'skipped';
  requires_approval: boolean;
  output_data: any | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

/**
 * Backend wire schema for an onboarding case summary record.
 */
export interface OnboardingCaseSummaryDto {
  id: number;
  hire_name: string;
  hire_email: string;
  role: string;
  department: string;
  manager_name: string;
  manager_email: string;
  start_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_steps: number;
  completed_steps: number;
  pending_approvals: number;
}

/**
 * Backend wire schema for full case detail with nested steps and approvals.
 */
export interface OnboardingCaseDetailDto {
  id: number;
  hire_name: string;
  hire_email: string;
  role: string;
  department: string;
  manager_name: string;
  manager_email: string;
  start_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  steps: WorkflowStepDto[];
  approvals: any[];
}

/**
 * Request payload when creating a new onboarding case via POST /api/onboarding.
 */
export interface OnboardingCaseCreateDto {
  hire_name: string;
  hire_email: string;
  role: string;
  department: string;
  manager_name: string;
  manager_email: string;
  start_date: string;
}
