/**
 * Human-in-the-Loop Approval Queue Page Component.
 *
 * Provides a centralized governance overview where managers and administrators
 * inspect pending automated actions, preview payloads, and authorize or reject
 * onboarding pipeline steps.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApprovalFacade } from '../../../application/facades/approval.facade';
import { OnboardingFacade } from '../../../../onboarding/application/facades/onboarding.facade';
import { ApprovalItem } from '../../../domain/models/approval-item.entity';
import { ApprovalDialogComponent } from '../../components/approval-dialog/approval-dialog.component';

@Component({
  selector: 'app-approval-queue',
  standalone: true,
  imports: [CommonModule, RouterLink, MatDialogModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-hairline">
        <div>
          <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-warn/15 border border-brand-warn/30 text-xs font-medium text-brand-warn mb-2">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-warn"></span>
            <span>Human-in-the-Loop Governance</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-ink tracking-tight">Review & Approval Queue</h1>
          <p class="text-sm text-steel mt-1">Safeguard corporate systems by explicitly verifying automated provisioning requests.</p>
        </div>

        <button (click)="refresh()" class="btn-pill-secondary text-xs !py-2 !px-4 self-start sm:self-auto">
          <span class="material-symbols-outlined text-[16px]">sync</span>
          <span>Refresh Queue</span>
        </button>
      </div>

      <!-- Approvals List -->
      <div class="card-surface overflow-hidden">
        
        <div class="px-6 py-4 border-b border-hairline flex items-center justify-between bg-surface-soft/60">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-semibold text-ink">Pending Verification Items</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-brand-warn/15 text-brand-warn border border-brand-warn/30">
              {{ pendingCount() }} pending
            </span>
          </div>
        </div>

        @if (pendingApprovals().length === 0) {
          <div class="p-16 text-center">
            <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <span class="material-symbols-outlined text-[24px]">task_alt</span>
            </div>
            <h3 class="text-sm font-semibold text-ink">Approval Queue is Clear</h3>
            <p class="text-xs text-steel max-w-sm mx-auto mt-1 mb-4">No pending actions require managerial sign-off right now. All autonomous workflows are proceeding or completed.</p>
            <a routerLink="/dashboard" class="btn-pill-secondary text-xs">
              <span>Return to Dashboard</span>
            </a>
          </div>
        } @else {
          <div class="divide-y divide-hairline">
            @for (item of pendingApprovals(); track item.id) {
              <div class="p-6 hover:bg-surface/40 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                
                <div class="flex items-start space-x-4">
                  <div class="w-10 h-10 rounded-full bg-brand-warn/15 flex items-center justify-center text-brand-warn shrink-0 mt-0.5">
                    <span class="material-symbols-outlined text-[20px]">shield</span>
                  </div>
                  <div>
                    <div class="flex items-center space-x-2 mb-1">
                      <span class="font-semibold text-ink text-sm">{{ item.title }}</span>
                      <span class="font-mono text-[11px] px-2 py-0.5 rounded bg-surface border border-hairline text-steel">
                        Case #{{ item.caseId }}
                      </span>
                      <span class="font-mono text-[11px] px-2 py-0.5 rounded bg-mint/15 text-mint-deep font-semibold">
                        {{ item.actionType }}
                      </span>
                    </div>
                    <p class="text-xs text-steel leading-relaxed max-w-2xl">
                      {{ item.description }}
                    </p>
                    <div class="text-[11px] text-muted font-mono mt-2">
                      Queued: {{ item.createdAt }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center space-x-3 shrink-0 self-end md:self-center">
                  <a [routerLink]="['/cases', item.caseId]" class="btn-pill-secondary text-xs !py-2 !px-4">
                    <span>Inspect Case</span>
                  </a>
                  <button (click)="openDecision(item)" class="btn-pill-mint text-xs !py-2 !px-5 shadow-mint-glow">
                    <span class="material-symbols-outlined text-[16px]">verified_user</span>
                    <span>Review & Authorize</span>
                  </button>
                </div>

              </div>
            }
          </div>
        }

      </div>

    </div>
  `
})
export class ApprovalQueueComponent {
  /** Approval domain facade */
  private readonly approvalFacade = inject(ApprovalFacade);

  /** Onboarding domain facade for cross-referencing case records */
  private readonly onboardingFacade = inject(OnboardingFacade);

  /** Angular Material dialog service */
  private readonly dialog = inject(MatDialog);

  /** Reactive signal containing items currently awaiting human sign-off */
  readonly pendingApprovals = this.approvalFacade.pendingApprovals;

  /** Computed count signal of pending items */
  readonly pendingCount = this.approvalFacade.pendingCount;

  /**
   * Refresh the list of pending approvals from the server.
   */
  refresh(): void {
    this.approvalFacade.fetchPendingApprovals();
  }

  /**
   * Open the review and authorization dialog for a selected approval item.
   *
   * @param item The approval item selected by the user.
   */
  openDecision(item: ApprovalItem): void {
    // Find candidate info if available in onboarding facade
    const matchingCase = this.onboardingFacade.cases().find(c => c.id === item.caseId);

    const dialogRef = this.dialog.open(ApprovalDialogComponent, {
      width: '600px',
      data: {
        approvalItem: item,
        employeeName: matchingCase?.employeeName,
        role: matchingCase?.role,
      }
    });

    dialogRef.afterClosed().subscribe((res: boolean) => {
      if (res) {
        this.approvalFacade.fetchPendingApprovals();
        this.onboardingFacade.fetchCases();
      }
    });
  }
}
