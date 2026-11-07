/**
 * Human-in-the-Loop Approval Modal Dialog.
 *
 * Renders an interactive review overlay using Material Design 3 dialog patterns.
 * Displays step context, deep generated payload JSON inspection, reviewer comments,
 * and trigger buttons to approve or reject the orchestrated workflow action.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ApprovalItem } from '../../../domain/models/approval-item.entity';
import { ApprovalFacade } from '../../../application/facades/approval.facade';

/** Input contract for dialog injection */
export interface ApprovalDialogData {
  /** Target approval item entity */
  approvalItem: ApprovalItem;

  /** Candidate full name */
  employeeName?: string;

  /** Candidate job title */
  role?: string;
}

@Component({
  selector: 'app-approval-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  template: `
    <div class="p-6 max-w-xl bg-white rounded-card">
      
      <!-- Modal Header -->
      <div class="flex items-start justify-between border-b border-hairline pb-4 mb-5">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-full bg-brand-warn/15 flex items-center justify-center text-brand-warn">
            <span class="material-symbols-outlined text-[20px]">verified_user</span>
          </div>
          <div>
            <h3 class="text-base font-semibold text-ink">Human-in-the-Loop Authorization</h3>
            <p class="text-xs text-steel">Case #{{ data.approvalItem.caseId }} &bull; {{ data.approvalItem.title }}</p>
          </div>
        </div>
        <button (click)="close(false)" class="text-muted hover:text-ink transition-colors">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Context Body -->
      <div class="space-y-4">
        
        <div class="p-3.5 bg-surface-soft rounded-lg border border-hairline text-xs space-y-1.5">
          <div class="flex justify-between">
            <span class="text-steel">Candidate:</span>
            <span class="font-semibold text-ink">{{ data.employeeName || 'New Hire' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-steel">Target Role:</span>
            <span class="font-medium text-ink">{{ data.role || 'Unspecified' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-steel">Action Type:</span>
            <span class="font-mono text-mint-deep font-semibold">{{ data.approvalItem.actionType }}</span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-steel mb-1.5">Pending Action & Summary</label>
          <p class="text-xs text-ink leading-relaxed bg-surface p-3 rounded-lg border border-hairline">
            {{ data.approvalItem.description }}
          </p>
        </div>

        <!-- Preview Data Inspector -->
        @if (data.approvalItem.previewData) {
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-medium text-steel">Generated Equipment & Account Preview</label>
              <span class="text-[11px] font-mono text-muted">preview_data</span>
            </div>
            <pre class="code-surface p-3.5 text-xs overflow-x-auto max-h-48 text-emerald-300">{{ formattedPreview }}</pre>
          </div>
        }

        <!-- Reviewer Comment -->
        <div class="pt-2">
          <label class="block text-xs font-medium text-steel mb-1">Authorization Comments</label>
          <input 
            type="text" 
            [(ngModel)]="comment" 
            placeholder="e.g. Approved with standard platform access" 
            class="w-full text-xs px-3 py-2 rounded-lg bg-surface border border-hairline focus:border-mint focus:outline-none"
          />
        </div>

      </div>

      <!-- Action Footer -->
      <div class="mt-6 pt-4 border-t border-hairline flex items-center justify-end space-x-3">
        <button 
          (click)="reject()" 
          [disabled]="isSubmitting"
          class="btn-pill-secondary !text-brand-error hover:!bg-red-50 hover:!border-red-200 text-xs !py-2 !px-4"
        >
          Reject & Halt
        </button>
        <button 
          (click)="approve()" 
          [disabled]="isSubmitting"
          class="btn-pill-mint text-xs !py-2 !px-5"
        >
          @if (isSubmitting) {
            <span class="inline-block animate-spin mr-1">↻</span>
            <span>Authorizing...</span>
          } @else {
            <span class="material-symbols-outlined text-[16px] mr-1">check_circle</span>
            <span>Approve & Continue Workflow</span>
          }
        </button>
      </div>

    </div>
  `
})
export class ApprovalDialogComponent {
  /** Injected dialog data */
  readonly data: ApprovalDialogData = inject(MAT_DIALOG_DATA);

  /** Injected Material dialog reference for dismiss actions */
  private readonly dialogRef = inject(MatDialogRef<ApprovalDialogComponent>);

  /** Injected Approval domain facade */
  private readonly approvalFacade = inject(ApprovalFacade);

  /** Two-way bound reviewer comment input */
  comment = 'Approved by Manager';

  /** Submitting state flag */
  isSubmitting = false;

  /**
   * Helper getter to pretty-print arbitrary preview_data JSON.
   */
  get formattedPreview(): string {
    if (!this.data.approvalItem.previewData) return '{}';
    try {
      return JSON.stringify(this.data.approvalItem.previewData, null, 2);
    } catch {
      return String(this.data.approvalItem.previewData);
    }
  }

  /**
   * Dismiss the dialog without approving.
   *
   * @param result Boolean outcome indicating whether action was taken.
   */
  close(result: boolean): void {
    this.dialogRef.close(result);
  }

  /**
   * Authorize the current step through the facade and close on success.
   */
  approve(): void {
    this.isSubmitting = true;
    this.approvalFacade.decideApproval(
      {
        approvalId: this.data.approvalItem.id,
        decision: 'approved',
        comment: this.comment,
      },
      () => {
        this.isSubmitting = false;
        this.dialogRef.close(true);
      }
    );
  }

  /**
   * Reject the current step through the facade and close on success.
   */
  reject(): void {
    this.isSubmitting = true;
    this.approvalFacade.decideApproval(
      {
        approvalId: this.data.approvalItem.id,
        decision: 'rejected',
        comment: this.comment,
      },
      () => {
        this.isSubmitting = false;
        this.dialogRef.close(false);
      }
    );
  }
}
