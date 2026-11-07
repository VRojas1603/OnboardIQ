/**
 * Approval Infrastructure Data Transfer Objects (DTOs).
 *
 * Represents the exact serialized JSON wire format received from and sent to
 * the FastAPI backend /api/approvals endpoints (snake_case properties).
 */

/**
 * Backend wire schema for an approval item record.
 */
export interface ApprovalItemDto {
  /** Unique primary key identifier */
  id: number;

  /** Onboarding case foreign key */
  case_id: number;

  /** Workflow step foreign key */
  step_id: number;

  /** Nested preview payload object */
  preview_data: any | null;

  /** Status outcome string */
  decision: 'pending' | 'approved' | 'rejected';

  /** Auditor feedback string or null */
  reviewer_comment: string | null;

  /** Creation ISO timestamp */
  created_at: string;

  /** Decision completion ISO timestamp or null */
  decided_at: string | null;

  /** Optional joined step metadata */
  step?: {
    id: number;
    step_key: string;
    step_label: string;
    requires_approval: boolean;
  } | null;
}

/**
 * Request payload when submitting an approval decision to the backend.
 */
export interface ApprovalDecisionRequestDto {
  /** Reviewer note or reason */
  comment?: string;
}
