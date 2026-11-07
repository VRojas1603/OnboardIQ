/**
 * Workflow Step Domain Entity and Types.
 *
 * Defines the state transitions and structured output payloads
 * for individual steps orchestrated in an onboarding pipeline.
 */

/** Possible execution states for a workflow step */
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_approval' | 'skipped';

/**
 * Polymorphic output dictionary generated upon step execution.
 */
export interface StepOutputData {
  /** Generated Day 0 welcome email content or object */
  welcome_email?: string | any;

  /** Structured 30-day onboarding milestones */
  onboarding_plan?: any;

  /** Tailored hardware/software provisioning checklist */
  equipment_checklist?: any[];

  /** Legacy plan property alias */
  plan_30_days?: string;

  /** Legacy checklist property alias */
  checklist?: string[];

  /** Delivery status flag for welcome email */
  email_sent?: boolean;

  /** Provisioning status flag for Google Workspace */
  workspace_provisioned?: boolean;

  /** Account credentials summary */
  provisioned_accounts?: {
    email: string;
    alias: string;
    temporary_password?: string;
  };

  /** GitHub organization provisioning confirmation */
  github_provisioned?: boolean;

  /** Corporate GitHub handle */
  github_username?: string;

  /** Assigned GitHub teams */
  github_team?: string;

  /** Delivery status flag for Slack channel broadcast */
  slack_message_sent?: boolean;

  /** Hardware dispatch status flag */
  equipment_ordered?: boolean;

  /** Audit report summary */
  status_report?: string;

  /** Open index signature for dynamic platform payloads */
  [key: string]: any;
}

/**
 * Domain entity representing an individual step in the 7-step onboarding pipeline.
 */
export interface WorkflowStep {
  /** Unique primary key ID of the workflow step */
  id: number;

  /** Foreign key pointing to the owning onboarding case */
  caseId: number;

  /** Sequential order position (1 through 7) */
  orderIndex: number;

  /** Human-readable display title */
  name: string;

  /** Programmatic identifier key (e.g., 'generate_documents', 'provision_slack') */
  stepKey: string;

  /** Current execution status */
  status: StepStatus;

  /** Whether execution must halt for human review before proceeding */
  requiresApproval: boolean;

  /** Generated step payload data */
  outputData: StepOutputData | null;

  /** Error traceback or message if step failed */
  errorMessage: string | null;

  /** ISO timestamp when step began execution */
  startedAt: string | null;

  /** ISO timestamp when step finished or was skipped */
  completedAt: string | null;
}
