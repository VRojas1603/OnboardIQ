/**
 * Confirm Delete Onboarding Case Modal Dialog.
 *
 * Renders a danger confirmation modal using Material Dialog patterns.
 * Explains cascade deletion consequences (workflow steps, execution outputs,
 * approval records) and prompts for explicit user confirmation before deletion.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

export interface ConfirmDeleteDialogData {
  /** Primary key ID of the case */
  caseId: number;

  /** Candidate full name */
  employeeName: string;

  /** Candidate role or title */
  role?: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="p-6 max-w-md bg-white rounded-card">
      
      <!-- Modal Header -->
      <div class="flex items-start justify-between border-b border-hairline pb-4 mb-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[22px]">delete_forever</span>
          </div>
          <div>
            <h3 class="text-base font-semibold text-ink">Delete Onboarding Case</h3>
            <p class="text-xs text-steel font-mono">Case #{{ data.caseId }} &bull; {{ data.employeeName }}</p>
          </div>
        </div>
        <button (click)="cancel()" class="text-muted hover:text-ink transition-colors p-1 rounded-md">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="space-y-4 text-xs text-steel leading-relaxed">
        <p>
          Are you sure you want to permanently delete the onboarding pipeline for 
          <strong class="text-ink font-semibold">{{ data.employeeName }}</strong>
          @if (data.role) {
            ({{ data.role }})
          }?
        </p>

        <div class="p-3.5 bg-red-50/60 rounded-lg border border-red-200/80 text-red-800 space-y-2">
          <div class="font-semibold flex items-center space-x-1.5 text-red-900">
            <span class="material-symbols-outlined text-[16px]">warning</span>
            <span>Cascade Deletion Scope:</span>
          </div>
          <ul class="list-disc list-inside space-y-1 text-[11px] text-red-700">
            <li>Candidate profile & intake parameters</li>
            <li>All 7 workflow steps & execution outputs</li>
            <li>All associated Human-in-the-Loop approval gates</li>
          </ul>
        </div>

        <p class="text-[11px] text-muted">
          This operation cannot be undone. You will immediately be able to re-register this candidate with the same email.
        </p>
      </div>

      <!-- Modal Footer Actions -->
      <div class="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-hairline">
        <button (click)="cancel()" class="btn-pill-secondary text-xs !py-2 !px-4">
          <span>Cancel</span>
        </button>
        <button (click)="confirm()" class="btn-pill-secondary !bg-red-600 !text-white hover:!bg-red-700 !border-red-600 text-xs !py-2 !px-4 font-semibold flex items-center space-x-1.5 shadow-sm">
          <span class="material-symbols-outlined text-[16px]">delete</span>
          <span>Delete Case & Data</span>
        </button>
      </div>

    </div>
  `
})
export class ConfirmDeleteDialogComponent {
  readonly data: ConfirmDeleteDialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDeleteDialogComponent>);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
