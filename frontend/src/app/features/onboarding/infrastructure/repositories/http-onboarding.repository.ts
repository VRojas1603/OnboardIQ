/**
 * HTTP Implementation of OnboardingRepositoryPort.
 *
 * Communicates with the FastAPI backend `/api/onboarding` endpoints,
 * retrieving case collections, individual case graphs, and triggering
 * new onboarding workflow initiations.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OnboardingRepositoryPort, CreateCaseParams } from '../../domain/ports/onboarding.repository.port';
import { OnboardingCase } from '../../domain/models/onboarding-case.entity';
import { OnboardingCaseSummaryDto, OnboardingCaseDetailDto } from '../dtos/onboarding.dto';
import { OnboardingMapper } from '../mappers/onboarding.mapper';

@Injectable({
  providedIn: 'root'
})
export class HttpOnboardingRepository implements OnboardingRepositoryPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/onboarding';

  /**
   * Fetch all onboarding cases from the backend.
   *
   * @returns Observable emitting array of domain OnboardingCase instances.
   */
  getAllCases(): Observable<OnboardingCase[]> {
    return this.http.get<OnboardingCaseSummaryDto[]>(this.baseUrl).pipe(
      map(dtos => dtos.map(OnboardingMapper.fromSummaryDto))
    );
  }

  /**
   * Fetch complete case detail by ID including steps and output data.
   *
   * @param id Target case ID.
   * @returns Observable emitting domain OnboardingCase instance.
   */
  getCaseById(id: number): Observable<OnboardingCase> {
    return this.http.get<OnboardingCaseDetailDto>(`${this.baseUrl}/${id}`).pipe(
      map(OnboardingMapper.fromDetailDto)
    );
  }

  /**
   * Register a new onboarding case and start automated orchestration.
   *
   * @param params Candidate and manager intake form parameters.
   * @returns Observable emitting newly created domain OnboardingCase instance.
   */
  createCase(params: CreateCaseParams): Observable<OnboardingCase> {
    const dto = OnboardingMapper.toCreateDto(params);
    return this.http.post<OnboardingCaseDetailDto>(this.baseUrl, dto).pipe(
      map(OnboardingMapper.fromDetailDto)
    );
  }
}
