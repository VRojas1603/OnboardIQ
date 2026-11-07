/**
 * Approval Application Facade.
 *
 * Coordinates reactive state management for Human-in-the-Loop approval workflows.
 * Exposes Angular Signals for pending approval collections, loading states, error boundaries,
 * and background polling synchronization.
 */

import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { ApprovalRepositoryPort, DecideApprovalParams } from '../../domain/ports/approval.repository.port';
import { HttpApprovalRepository } from '../../infrastructure/repositories/http-approval.repository';
import { ApprovalItem } from '../../domain/models/approval-item.entity';

@Injectable({
  providedIn: 'root'
})
export class ApprovalFacade implements OnDestroy {
  private readonly repo: ApprovalRepositoryPort = inject(HttpApprovalRepository);

  /** Reactive signal containing the list of all currently pending approvals */
  readonly pendingApprovals = signal<ApprovalItem[]>([]);

  /** Loading indicator signal for active network operations */
  readonly loading = signal<boolean>(false);

  /** Error message signal for network or validation failures */
  readonly error = signal<string | null>(null);

  /** Computed signal reflecting the total number of items awaiting human review */
  readonly pendingCount = computed(() => this.pendingApprovals().length);

  /** Background polling subscription reference */
  private pollingSub: Subscription | null = null;

  constructor() {
    this.fetchPendingApprovals();
    this.startPolling();
  }

  /**
   * Start 3-second background polling cadence to detect newly arrived approval triggers.
   */
  startPolling(): void {
    if (this.pollingSub) return;
    this.pollingSub = interval(3000).subscribe(() => {
      this.repo.getPendingApprovals().subscribe({
        next: items => this.pendingApprovals.set(items),
        error: () => {}
      });
    });
  }

  /**
   * Terminate active background polling subscription.
   */
  stopPolling(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = null;
    }
  }

  /**
   * Trigger an explicit one-time retrieval of all pending approvals.
   */
  fetchPendingApprovals(): void {
    this.loading.set(true);
    this.repo.getPendingApprovals().subscribe({
      next: items => {
        this.pendingApprovals.set(items);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.message || 'Failed to fetch pending approvals');
        this.loading.set(false);
      }
    });
  }

  /**
   * Submit a human approval decision ('approved' or 'rejected'), updating the local signal state.
   *
   * @param params Target approval ID, decision value, and reviewer comment.
   * @param onComplete Optional callback invoked upon successful confirmation.
   */
  decideApproval(params: DecideApprovalParams, onComplete?: (item: ApprovalItem) => void): void {
    this.loading.set(true);
    this.repo.decideApproval(params).subscribe({
      next: item => {
        this.pendingApprovals.update(prev => prev.filter(a => a.id !== params.approvalId));
        this.loading.set(false);
        if (onComplete) onComplete(item);
      },
      error: err => {
        this.error.set(err.message || 'Failed to submit approval decision');
        this.loading.set(false);
      }
    });
  }

  /**
   * Cleanup lifecycle hook to ensure subscriptions are disposed.
   */
  ngOnDestroy(): void {
    this.stopPolling();
  }
}
