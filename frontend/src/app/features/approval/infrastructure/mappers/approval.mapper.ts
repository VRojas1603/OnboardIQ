/**
 * Approval Infrastructure Mapper.
 *
 * Transforms raw backend wire DTOs (snake_case) into typed domain entities
 * (camelCase), providing sensible defaults for missing or optional fields.
 */

import { ApprovalItem } from '../../domain/models/approval-item.entity';
import { ApprovalItemDto } from '../dtos/approval.dto';

export class ApprovalMapper {
  /**
   * Convert an ApprovalItemDto from the backend into a domain ApprovalItem entity.
   *
   * @param dto Raw wire data object from API.
   * @returns Clean domain ApprovalItem instance.
   */
  static toDomainItem(dto: ApprovalItemDto): ApprovalItem {
    const stepLabel = dto.step?.step_label || 'Manager Sign-off & IT Provisioning';
    const actionType = dto.step?.step_key || 'human_approval';
    const description = dto.preview_data?.action_summary 
      || 'Manager approval required before provisioning enterprise credentials and ordering IT equipment.';

    return {
      id: dto.id,
      caseId: dto.case_id,
      stepId: dto.step_id,
      title: `Step Approval: ${stepLabel}`,
      description: description,
      actionType: actionType,
      previewData: dto.preview_data ?? null,
      decision: dto.decision,
      reviewerComment: dto.reviewer_comment,
      createdAt: dto.created_at,
      decidedAt: dto.decided_at,
      stepLabel: stepLabel,
    };
  }
}
