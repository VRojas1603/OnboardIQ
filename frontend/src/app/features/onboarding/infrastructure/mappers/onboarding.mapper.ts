/**
 * Onboarding Infrastructure Mapper.
 *
 * Provides bidirectional translation between raw HTTP wire DTOs
 * and rich frontend Domain Entities for cases, steps, and requests.
 */

import { OnboardingCase } from '../../domain/models/onboarding-case.entity';
import { WorkflowStep } from '../../domain/models/workflow-step.entity';
import { 
  OnboardingCaseSummaryDto, 
  OnboardingCaseDetailDto, 
  WorkflowStepDto, 
  OnboardingCaseCreateDto 
} from '../dtos/onboarding.dto';
import { CreateCaseParams } from '../../domain/ports/onboarding.repository.port';

export class OnboardingMapper {
  /**
   * Convert a raw WorkflowStepDto to a typed WorkflowStep domain entity.
   *
   * @param dto Raw step data from backend API.
   * @returns Domain WorkflowStep instance.
   */
  static toDomainStep(dto: WorkflowStepDto): WorkflowStep {
    return {
      id: dto.id,
      caseId: dto.case_id,
      orderIndex: dto.order_index,
      name: dto.step_label,
      stepKey: dto.step_key,
      status: dto.status,
      requiresApproval: dto.requires_approval,
      outputData: dto.output_data ?? null,
      errorMessage: dto.error_message ?? null,
      startedAt: dto.started_at ?? null,
      completedAt: dto.completed_at ?? null,
    };
  }

  /**
   * Convert an OnboardingCaseSummaryDto to an OnboardingCase domain entity.
   *
   * @param dto Summary data object from list endpoint.
   * @returns Lightweight domain OnboardingCase instance.
   */
  static fromSummaryDto(dto: OnboardingCaseSummaryDto): OnboardingCase {
    return {
      id: dto.id,
      employeeName: dto.hire_name,
      employeeEmail: dto.hire_email,
      role: dto.role,
      department: dto.department,
      managerName: dto.manager_name,
      managerEmail: dto.manager_email,
      startDate: dto.start_date,
      status: dto.status,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      totalSteps: dto.total_steps || 7,
      completedSteps: dto.completed_steps || 0,
      pendingApprovals: dto.pending_approvals || 0,
      steps: [],
      approvals: [],
    };
  }

  /**
   * Convert full OnboardingCaseDetailDto to an OnboardingCase domain entity with nested steps.
   *
   * @param dto Full detail payload from case endpoint.
   * @returns Comprehensive domain OnboardingCase instance.
   */
  static fromDetailDto(dto: OnboardingCaseDetailDto): OnboardingCase {
    const steps = (dto.steps || []).map(OnboardingMapper.toDomainStep);
    const completed = steps.filter(s => s.status === 'completed' || s.status === 'skipped').length;
    return {
      id: dto.id,
      employeeName: dto.hire_name,
      employeeEmail: dto.hire_email,
      role: dto.role,
      department: dto.department,
      managerName: dto.manager_name,
      managerEmail: dto.manager_email,
      startDate: dto.start_date,
      status: dto.status,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      totalSteps: steps.length || 7,
      completedSteps: completed,
      pendingApprovals: (dto.approvals || []).filter(a => a.decision === 'pending').length,
      steps,
      approvals: dto.approvals || [],
    };
  }

  /**
   * Transform UI input params into the wire DTO needed for case creation.
   *
   * @param params Domain creation parameters.
   * @returns Formatted OnboardingCaseCreateDto.
   */
  static toCreateDto(params: CreateCaseParams): OnboardingCaseCreateDto {
    return {
      hire_name: params.employeeName,
      hire_email: params.employeeEmail,
      role: params.role,
      department: params.department,
      manager_name: params.managerName,
      manager_email: params.managerEmail,
      start_date: params.startDate,
    };
  }
}
