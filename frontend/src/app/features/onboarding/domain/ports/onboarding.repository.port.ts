/**
 * Onboarding Repository Port (Domain Interface).
 *
 * Defines the contract for fetching and mutating onboarding case aggregates,
 * adhering to hexagonal architecture and separating domain logic from transport protocols.
 */

import { Observable } from 'rxjs';
import { OnboardingCase } from '../models/onboarding-case.entity';

/**
 * Parameters required to register a new onboarding case.
 */
export interface CreateCaseParams {
  /** Full name of the candidate */
  employeeName: string;

  /** Personal contact email */
  employeeEmail: string;

  /** Job position title */
  role: string;

  /** Department assignment */
  department: string;

  /** Direct manager's full name */
  managerName: string;

  /** Direct manager's corporate email */
  managerEmail: string;

  /** Scheduled first day of employment (YYYY-MM-DD) */
  startDate: string;

  /** Optional candidate GitHub username for org invitations */
  githubUsername?: string;
}

/**
 * Abstract Port for Onboarding persistence and gateway operations.
 */
export abstract class OnboardingRepositoryPort {
  /**
   * Retrieve all onboarding cases with high-level summary metrics.
   */
  abstract getAllCases(): Observable<OnboardingCase[]>;

  /**
   * Retrieve complete detail for a single onboarding case, including all steps and outputs.
   *
   * @param id Primary key ID of the onboarding case.
   */
  abstract getCaseById(id: number): Observable<OnboardingCase>;

  /**
   * Register a new employee onboarding case and initiate workflow execution.
   *
   * @param params Candidate and manager intake form parameters.
   */
  abstract createCase(params: CreateCaseParams): Observable<OnboardingCase>;
}
