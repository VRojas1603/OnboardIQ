/**
 * Onboarding Case Detail & Timeline Page Component.
 *
 * Renders the full 7-step autonomous orchestration lifecycle for a specific employee:
 * - Real-time step status badges (pending, running, awaiting_approval, completed)
 * - Deep generated payload inspector (AI welcome email, 30-day milestones, IT checklists)
 * - Human-in-the-Loop review invocation modal when a step pauses for manager sign-off
 * - Telemetry receipts and external API response payload viewers
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OnboardingFacade } from '../../../application/facades/onboarding.facade';
import { ApprovalFacade } from '../../../../approval/application/facades/approval.facade';
import { OnboardingCase, calculateCaseProgress } from '../../../domain/models/onboarding-case.entity';
import { ApprovalDialogComponent } from '../../../../approval/presentation/components/approval-dialog/approval-dialog.component';

@Component({
  selector: 'app-onboarding-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatDialogModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <!-- Breadcrumb & Top Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 text-xs text-steel mb-2">
            <a routerLink="/dashboard" class="hover:text-ink transition-colors">Operations</a>
            <span>/</span>
            <span class="text-steel font-mono">Case #{{ caseId() }}</span>
            <span>/</span>
            <span class="text-ink font-medium">{{ activeCase()?.employeeName || 'Candidate' }}</span>
          </div>
          <div class="flex items-center space-x-3">
            <h1 class="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              {{ activeCase()?.employeeName || 'Loading...' }}
            </h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface border border-hairline text-steel">
              {{ activeCase()?.role }}
            </span>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center space-x-3">
          <button (click)="refresh()" class="btn-pill-secondary text-xs !py-2 !px-4">
            <span class="material-symbols-outlined text-[16px]">sync</span>
            <span>Sync Status</span>
          </button>
          @if (hasPendingApproval()) {
            <button (click)="openApprovalDialog()" class="btn-pill-mint text-xs !py-2 !px-5 animate-pulse">
              <span class="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Authorize Next Step</span>
            </button>
          }
        </div>
      </div>

      <!-- Candidate Overview Banner Card -->
      @if (activeCase(); as c) {
        <div class="card-surface p-6 bg-white">
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-xs">
            
            <div>
              <span class="text-steel block mb-1">Department</span>
              <span class="font-semibold text-ink">{{ c.department }}</span>
            </div>

            <div>
              <span class="text-steel block mb-1">Reporting Manager</span>
              <span class="font-medium text-ink">{{ c.managerName }}</span>
              <span class="font-mono text-muted text-[11px] block truncate">{{ c.managerEmail }}</span>
            </div>

            <div>
              <span class="text-steel block mb-1">Target Start Date</span>
              <span class="font-semibold text-ink font-mono">{{ c.startDate }}</span>
            </div>

            <div>
              <span class="text-steel block mb-1">Contact Email</span>
              <span class="font-mono text-ink truncate block">{{ c.employeeEmail }}</span>
              @if (c.githubUsername) {
                <span class="font-mono text-muted text-[11px] block truncate">@{{ c.githubUsername }}</span>
              }
            </div>

            <div>
              <span class="text-steel block mb-1">Workflow Status</span>
              @switch (c.status) {
                @case ('completed') {
                  <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Completed</span>
                  </span>
                }
                @case ('paused') {
                  <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>Paused for Review</span>
                  </span>
                }
                @default {
                  <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-mint/10 text-mint-deep border border-mint/20 text-[11px] font-medium">
                    <span class="w-1.5 h-1.5 rounded-full bg-mint"></span>
                    <span>{{ c.status }}</span>
                  </span>
                }
              }
            </div>

            <div>
              <div class="flex justify-between text-steel mb-1">
                <span>Progress</span>
                <span class="font-semibold text-ink font-mono">{{ progress() }}%</span>
              </div>
              <div class="w-full h-2 rounded-full bg-surface-soft border border-hairline overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-500"
                  [ngClass]="progress() === 100 ? 'bg-emerald-500' : 'bg-mint'"
                  [style.width.%]="progress()"
                ></div>
              </div>
            </div>

          </div>
        </div>

        <!-- Human-in-the-Loop Attention Banner (if awaiting approval) -->
        @if (hasPendingApproval()) {
          <div class="card-surface p-5 bg-gradient-to-r from-amber-50/60 to-white border-brand-warn/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex items-start space-x-3">
              <div class="w-9 h-9 rounded-full bg-brand-warn/15 flex items-center justify-center text-brand-warn shrink-0">
                <span class="material-symbols-outlined text-[20px]">pause_circle</span>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-ink">Autonomous Orchestration Paused for Human Approval</h3>
                <p class="text-xs text-steel mt-0.5">
                  Step 1 AI generation completed successfully. Step 2 requires managerial sign-off before provisioning IT equipment and workspace credentials.
                </p>
              </div>
            </div>
            <button (click)="openApprovalDialog()" class="btn-pill-mint text-xs !py-2.5 !px-6 shrink-0 shadow-mint-glow">
              <span class="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Review & Authorize Action</span>
            </button>
          </div>
        }

        <!-- 7-Step Interactive Timeline -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-ink">7-Step Autonomous Orchestration Lifecycle</h2>
            <span class="text-xs text-steel">Powered by Vultr Serverless Inference</span>
          </div>

          <div class="space-y-3">
            @for (step of c.steps; track step.id; let idx = $index) {
              <div 
                class="card-surface p-5 transition-all"
                [ngClass]="{
                  'border-mint/50 bg-mint/5': step.status === 'running',
                  'border-brand-warn/50 bg-amber-50/30': step.status === 'awaiting_approval',
                  'border-hairline bg-white': step.status === 'completed' || step.status === 'pending'
                }"
              >
                <!-- Step Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div class="flex items-center space-x-3">
                    
                    <!-- Step Indicator Circle -->
                    <div 
                      class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold"
                      [ngClass]="{
                        'bg-emerald-500 text-white': step.status === 'completed',
                        'bg-brand-warn text-white animate-pulse': step.status === 'awaiting_approval',
                        'bg-mint text-ink animate-spin': step.status === 'running',
                        'bg-surface border border-hairline text-steel': step.status === 'pending',
                        'bg-red-500 text-white': step.status === 'failed'
                      }"
                    >
                      @if (step.status === 'completed') {
                        <span class="material-symbols-outlined text-[16px]">check</span>
                      } @else {
                        <span>{{ idx + 1 }}</span>
                      }
                    </div>

                    <div>
                      <h3 class="text-sm font-semibold text-ink">{{ step.name }}</h3>
                      <div class="text-[11px] text-steel font-mono">
                        {{ step.stepKey }}
                        @if (step.completedAt) {
                          &bull; Completed: {{ step.completedAt }}
                        }
                      </div>
                    </div>
                  </div>

                  <!-- Step Status Badge -->
                  <div class="flex items-center space-x-2">
                    @switch (step.status) {
                      @case ('completed') {
                        <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                          Completed
                        </span>
                      }
                      @case ('awaiting_approval') {
                        <span class="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                          Awaiting Approval
                        </span>
                      }
                      @case ('running') {
                        <span class="px-2.5 py-0.5 rounded-full bg-mint/15 text-mint-deep border border-mint/30 text-[11px] font-medium">
                          Executing
                        </span>
                      }
                      @case ('failed') {
                        <span class="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-medium">
                          Failed
                        </span>
                      }
                      @default {
                        <span class="px-2.5 py-0.5 rounded-full bg-surface text-steel border border-hairline text-[11px]">
                          Pending
                        </span>
                      }
                    }
                  </div>
                </div>

                <!-- Step 1 AI Output Inspector -->
                @if (step.stepKey === 'ai_generation' && step.outputData) {
                  <div class="mt-4 pt-4 border-t border-hairline space-y-4">
                    
                    <!-- AI Welcome Email Preview in Dark Code Surface -->
                    @if (step.outputData.welcome_email) {
                      <div>
                        <div class="flex items-center justify-between mb-1.5">
                          <span class="text-xs font-semibold text-steel flex items-center space-x-1.5">
                            <span class="material-symbols-outlined text-[16px] text-mint">mail</span>
                            <span>Generated Welcome Email (Vultr Llama-3.3-70B)</span>
                          </span>
                          <span class="text-[11px] font-mono text-muted">markdown</span>
                        </div>
                        <div class="code-surface p-4 text-xs whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
                          {{ step.outputData.welcome_email }}
                        </div>
                      </div>
                    }

                    <!-- 30-Day Plan & Equipment Checklist Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <!-- 30-Day Ramp-Up Plan -->
                      @if (step.outputData.plan_30_days) {
                        <div class="p-4 bg-surface rounded-lg border border-hairline">
                          <span class="text-xs font-semibold text-ink block mb-2 flex items-center space-x-1.5">
                            <span class="material-symbols-outlined text-[16px] text-brand-tag">flag</span>
                            <span>30-Day Ramp-Up Plan</span>
                          </span>
                          <div class="text-xs text-steel whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                            {{ step.outputData.plan_30_days }}
                          </div>
                        </div>
                      }

                      <!-- Equipment Checklist -->
                      @if (step.outputData.checklist && step.outputData.checklist.length > 0) {
                        <div class="p-4 bg-surface rounded-lg border border-hairline">
                          <span class="text-xs font-semibold text-ink block mb-2 flex items-center space-x-1.5">
                            <span class="material-symbols-outlined text-[16px] text-mint-deep">laptop_mac</span>
                            <span>Standard Hardware & Access Bundle</span>
                          </span>
                          <ul class="text-xs space-y-1.5 text-steel">
                            @for (item of step.outputData.checklist; track item) {
                              <li class="flex items-center space-x-2">
                                <span class="material-symbols-outlined text-[14px] text-mint">check_circle</span>
                                <span>{{ item }}</span>
                              </li>
                            }
                          </ul>
                        </div>
                      }

                    </div>

                  </div>
                }

                <!-- Step 4 & 5 Credentials & Output Inspector -->
                @if (step.outputData && step.stepKey !== 'ai_generation') {
                  <div class="mt-4 pt-3 border-t border-hairline text-xs">
                    <span class="text-steel font-medium mb-1 block">Execution Telemetry & Receipts:</span>
                    <pre class="code-surface p-3 text-[11px] overflow-x-auto max-h-36 text-emerald-300">{{ formatJson(step.outputData) }}</pre>
                  </div>
                }

              </div>
            }
          </div>
        </div>

      } @else {
        <!-- Skeleton Loading -->
        <div class="card-surface p-12 text-center">
          <div class="inline-block animate-spin text-mint text-2xl mb-2">↻</div>
          <div class="text-sm font-semibold text-ink">Retrieving Candidate Lifecycle...</div>
          <p class="text-xs text-steel">Fetching real-time state from FastAPI backend</p>
        </div>
      }

    </div>
  `
})
export class OnboardingDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly onboardingFacade = inject(OnboardingFacade);
  private readonly approvalFacade = inject(ApprovalFacade);
  private readonly dialog = inject(MatDialog);

  /** Active case ID extracted from route param */
  readonly caseId = signal<number>(0);

  /** Active case entity signal */
  readonly activeCase = this.onboardingFacade.activeCase;

  /** Loading state signal */
  readonly loading = this.onboardingFacade.loading;

  /** Pending approvals list signal */
  readonly pendingApprovals = this.approvalFacade.pendingApprovals;

  /**
   * Component lifecycle initialization. Extracts route param and initiates case load.
   */
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.caseId.set(id);
        this.onboardingFacade.loadCaseById(id);
      }
    });
  }

  /**
   * Compute percentage completion for current active case.
   */
  progress(): number {
    const c = this.activeCase();
    return c ? calculateCaseProgress(c) : 0;
  }

  /**
   * Check whether any step in the current case is currently awaiting human authorization.
   */
  hasPendingApproval(): boolean {
    const c = this.activeCase();
    if (!c || !c.steps) return false;
    return c.steps.some(s => s.status === 'awaiting_approval');
  }

  /**
   * Manually trigger re-fetch of case details and pending approvals.
   */
  refresh(): void {
    const id = this.caseId();
    if (id) {
      this.onboardingFacade.loadCaseById(id);
      this.approvalFacade.fetchPendingApprovals();
    }
  }

  /**
   * Open the human authorization modal dialog for the pending step.
   */
  openApprovalDialog(): void {
    const c = this.activeCase();
    if (!c) return;

    // Find the pending approval item for this case
    let approval = this.pendingApprovals().find(a => a.caseId === c.id);
    if (!approval && c.approvals && c.approvals.length > 0) {
      const pendingRaw = c.approvals.find((a: any) => a.decision === 'pending');
      if (pendingRaw) {
        approval = {
          id: pendingRaw.id,
          caseId: c.id,
          stepId: pendingRaw.step_id,
          title: 'Manager Sign-off & IT Provisioning',
          description: pendingRaw.preview_data?.action_summary || 'Manager approval required before provisioning enterprise credentials.',
          actionType: 'human_approval',
          previewData: pendingRaw.preview_data,
          decision: 'pending',
          reviewerComment: null,
          createdAt: pendingRaw.created_at,
          decidedAt: null
        };
      }
    }

    if (!approval) {
      this.approvalFacade.fetchPendingApprovals();
      return;
    }

    const dialogRef = this.dialog.open(ApprovalDialogComponent, {
      width: '600px',
      data: {
        approvalItem: approval,
        employeeName: c.employeeName,
        role: c.role,
      }
    });

    dialogRef.afterClosed().subscribe((approved: boolean) => {
      if (approved) {
        setTimeout(() => this.refresh(), 800);
      }
    });
  }

  /**
   * Format any JSON object as pretty-printed string for inspection.
   */
  formatJson(data: any): string {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }
}
