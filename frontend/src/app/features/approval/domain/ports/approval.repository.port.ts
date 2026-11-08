/**
 * Approval Domain Repository Port.
 *
 * Defines the contract/interface for approval data operations following
 * hexagonal / clean architecture principles. Decouples domain and presentation
 * logic from concrete transport mechanisms (e.g. HTTP, WebSockets).
 */

import { Observable } from 'rxjs';
import { ApprovalItem } from '../models/approval-item.entity';

/**
 * Parameters required to commit an approval or rejection decision.
 */
export interface DecideApprovalParams {
  /** Target approval record identifier */
  approvalId: number;

  /** Chosen human decision */
  decision: 'approved' | 'rejected' | 'skipped';

  /** Optional reviewer note or rationale */
  comment?: string;
}

/**
 * Abstract Port for Approval persistence and remote gateway operations.
 */
export abstract class ApprovalRepositoryPort {
  /**
   * Fetch all approvals currently awaiting human sign-off.
   */
  abstract getPendingApprovals(): Observable<ApprovalItem[]>;

  /**
   * Submit an authorization or rejection decision for a specific approval item.
   *
   * @param params Target approval ID, decision value, and review comment.
   */
  abstract decideApproval(params: DecideApprovalParams): Observable<ApprovalItem>;
}
