/**
 * HTTP Implementation of ApprovalRepositoryPort.
 *
 * Implements remote communication with the backend /api/approvals endpoints,
 * executing HTTP GET and POST requests and mapping wire DTOs to domain models.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApprovalRepositoryPort, DecideApprovalParams } from '../../domain/ports/approval.repository.port';
import { ApprovalItem } from '../../domain/models/approval-item.entity';
import { ApprovalItemDto, ApprovalDecisionRequestDto } from '../dtos/approval.dto';
import { ApprovalMapper } from '../mappers/approval.mapper';

@Injectable({
  providedIn: 'root'
})
export class HttpApprovalRepository implements ApprovalRepositoryPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/approvals';

  /**
   * Fetch all currently pending approvals from the server.
   *
   * @returns Observable emitting array of domain ApprovalItem instances.
   */
  getPendingApprovals(): Observable<ApprovalItem[]> {
    return this.http.get<ApprovalItemDto[]>(this.baseUrl).pipe(
      map(dtos => dtos.map(ApprovalMapper.toDomainItem))
    );
  }

  /**
   * Submit an authorization ('approve') or skip ('reject') decision for an approval item.
   *
   * @param params Target approval ID, decision value, and optional comment.
   * @returns Observable emitting updated domain ApprovalItem instance.
   */
  decideApproval(params: DecideApprovalParams): Observable<ApprovalItem> {
    const action = params.decision === 'approved' ? 'approve' : params.decision === 'skipped' ? 'skip' : 'reject';
    const endpoint = `${this.baseUrl}/${params.approvalId}/${action}`;
    const payload: ApprovalDecisionRequestDto = {
      comment: params.comment || 'Approved by Manager'
    };
    return this.http.post<ApprovalItemDto>(endpoint, payload).pipe(
      map(ApprovalMapper.toDomainItem)
    );
  }
}
