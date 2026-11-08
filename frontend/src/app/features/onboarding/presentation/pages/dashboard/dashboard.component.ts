/**
 * Onboarding Dashboard Page Component.
 *
 * Primary operations command center providing:
 * - High-level lifecycle telemetry counters (active pipelines, completed cases, average progress)
 * - Real-time pending approval counter and quick navigation to governance queue
 * - Interactive cases table with progress bars, lifecycle status badges, and inspection links
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OnboardingFacade } from '../../../application/facades/onboarding.facade';
import { ApprovalFacade } from '../../../../approval/application/facades/approval.facade';
import { OnboardingCase, calculateCaseProgress } from '../../../domain/models/onboarding-case.entity';
import { ConfirmDeleteDialogComponent } from '../../components/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatDialogModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <!-- Top Hero Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-hairline">
        <div>
          <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-mint/10 border border-mint/20 text-xs font-medium text-mint-deep mb-2">
            <span class="w-1.5 h-1.5 rounded-full bg-mint"></span>
            <span>Vultr Agent Rush Hackathon Track: Future of Work</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-ink tracking-tight">Onboarding Operations</h1>
          <p class="text-sm text-steel mt-1">Autonomous multi-agent lifecycle orchestrator with Human-in-the-Loop governance.</p>
        </div>

        <div class="flex items-center space-x-3">
          <button (click)="refresh()" class="btn-pill-secondary text-xs !py-2 !px-4">
            <span class="material-symbols-outlined text-[16px]">sync</span>
            <span>Refresh</span>
          </button>
          <a routerLink="/new-hire" class="btn-pill-mint text-xs !py-2 !px-5">
            <span class="material-symbols-outlined text-[16px]">person_add</span>
            <span>+ Intake New Hire</span>
          </a>
        </div>
      </div>

      <!-- High-Level Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Total Cases -->
        <div class="card-surface p-5 relative overflow-hidden group hover:border-steel/30 transition-colors">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-steel">Total Workflows</span>
            <div class="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-steel">
              <span class="material-symbols-outlined text-[18px]">group</span>
            </div>
          </div>
          <div class="mt-3 flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-ink font-mono">{{ totalCases() }}</span>
            <span class="text-xs text-steel">candidates</span>
          </div>
          <div class="mt-2 text-xs text-muted flex items-center space-x-1">
            <span>Avg. Progress:</span>
            <span class="font-semibold text-ink">{{ avgProgress() }}%</span>
          </div>
        </div>

        <!-- In Progress -->
        <div class="card-surface p-5 relative overflow-hidden group hover:border-steel/30 transition-colors">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-steel">Active Pipelines</span>
            <div class="w-8 h-8 rounded-lg bg-mint/10 flex items-center justify-center text-mint-deep">
              <span class="material-symbols-outlined text-[18px]">progress_activity</span>
            </div>
          </div>
          <div class="mt-3 flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-ink font-mono">{{ inProgressCount() }}</span>
            <span class="text-xs text-mint-deep font-medium">orchestrating</span>
          </div>
          <div class="mt-2 text-xs text-muted">Auto-advancing with Vultr AI</div>
        </div>

        <!-- Completed -->
        <div class="card-surface p-5 relative overflow-hidden group hover:border-steel/30 transition-colors">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-steel">Completed</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <span class="material-symbols-outlined text-[18px]">task_alt</span>
            </div>
          </div>
          <div class="mt-3 flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-ink font-mono">{{ completedCount() }}</span>
            <span class="text-xs text-emerald-600 font-medium">fully onboarded</span>
          </div>
          <div class="mt-2 text-xs text-muted">All 7 steps verified</div>
        </div>

        <!-- Pending Approvals -->
        <a routerLink="/approvals" class="card-surface p-5 relative overflow-hidden block group hover:border-brand-warn/50 transition-colors cursor-pointer">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-steel">Action Approvals</span>
            <div class="w-8 h-8 rounded-lg bg-brand-warn/15 flex items-center justify-center text-brand-warn">
              <span class="material-symbols-outlined text-[18px]">shield</span>
            </div>
          </div>
          <div class="mt-3 flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-ink font-mono">{{ pendingApprovalCount() }}</span>
            @if (pendingApprovalCount() > 0) {
              <span class="text-xs px-2 py-0.5 rounded-full bg-brand-warn/20 text-brand-warn font-semibold">Requires Review</span>
            } @else {
              <span class="text-xs text-muted">All clear</span>
            }
          </div>
          <div class="mt-2 text-xs text-steel group-hover:text-ink transition-colors flex items-center justify-between">
            <span>Human-in-the-Loop Queue</span>
            <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
          </div>
        </a>

      </div>

      <!-- Pipelines Table Card -->
      <div class="card-surface overflow-hidden">
        
        <div class="px-6 py-4 border-b border-hairline flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface-soft/60">
          <div>
            <h2 class="text-base font-semibold text-ink">Active Onboarding Pipelines</h2>
            <p class="text-xs text-steel">Real-time status of candidate provisioning and AI workflow executions.</p>
          </div>
          <span class="text-xs font-mono text-muted bg-surface px-2.5 py-1 rounded-md border border-hairline">
            {{ cases().length }} workflows recorded
          </span>
        </div>

        @if (cases().length === 0) {
          <div class="p-12 text-center">
            <div class="w-12 h-12 rounded-full bg-surface border border-hairline flex items-center justify-center mx-auto text-steel mb-3">
              <span class="material-symbols-outlined text-[24px]">engineering</span>
            </div>
            <h3 class="text-sm font-semibold text-ink">No candidates onboarded yet</h3>
            <p class="text-xs text-steel max-w-sm mx-auto mt-1 mb-4">Launch your first autonomous onboarding workflow to see multi-step agent actions in real time.</p>
            <a routerLink="/new-hire" class="btn-pill-mint text-xs">
              <span>+ Intake First Hire</span>
            </a>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-surface text-steel font-medium border-b border-hairline">
                <tr>
                  <th class="py-3 px-6">Candidate</th>
                  <th class="py-3 px-6">Role & Department</th>
                  <th class="py-3 px-6">Start Date</th>
                  <th class="py-3 px-6">Lifecycle Progress</th>
                  <th class="py-3 px-6 w-44">Completion</th>
                  <th class="py-3 px-6">Status</th>
                  <th class="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-hairline bg-white">
                @for (c of cases(); track c.id) {
                  <tr class="hover:bg-surface/50 transition-colors">
                    
                    <!-- Candidate -->
                    <td class="py-4 px-6">
                      <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center font-bold text-xs uppercase font-mono">
                          {{ getInitials(c.employeeName) }}
                        </div>
                        <div>
                          <a [routerLink]="['/cases', c.id]" class="font-semibold text-ink hover:text-mint-deep transition-colors">
                            {{ c.employeeName }}
                          </a>
                          <div class="text-[11px] text-muted">{{ c.managerEmail }}</div>
                        </div>
                      </div>
                    </td>

                    <!-- Role & Dept -->
                    <td class="py-4 px-6">
                      <div class="font-medium text-ink">{{ c.role }}</div>
                      <div class="text-[11px] text-steel">{{ c.department }}</div>
                    </td>

                    <!-- Start Date -->
                    <td class="py-4 px-6 font-mono text-steel">
                      {{ c.startDate }}
                    </td>

                    <!-- Steps info -->
                    <td class="py-4 px-6">
                      <div class="flex items-center space-x-1.5">
                        <span class="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-hairline text-steel">
                          {{ c.completedSteps }} / {{ c.totalSteps }} Steps
                        </span>
                        @if (c.pendingApprovals > 0) {
                          <span class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                            Needs Review
                          </span>
                        }
                      </div>
                    </td>

                    <!-- Progress Bar -->
                    <td class="py-4 px-6">
                      <div class="space-y-1">
                        <div class="flex justify-between text-[11px] text-steel font-mono">
                          <span>{{ getProgress(c) }}%</span>
                        </div>
                        <div class="w-full h-1.5 rounded-full bg-surface-soft border border-hairline overflow-hidden">
                          <div 
                            class="h-full rounded-full transition-all duration-500"
                            [ngClass]="c.status === 'halted' ? 'bg-red-500' : getProgress(c) === 100 ? 'bg-emerald-500' : 'bg-mint'"
                            [style.width.%]="getProgress(c)"
                          ></div>
                        </div>
                      </div>
                    </td>

                    <!-- Status Pill -->
                    <td class="py-4 px-6">
                      @switch (c.status) {
                        @case ('completed') {
                          <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Completed</span>
                          </span>
                        }
                        @case ('halted') {
                          <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-medium">
                            <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            <span>Halted (Rejected)</span>
                          </span>
                        }
                        @case ('paused') {
                          <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>Awaiting Review</span>
                          </span>
                        }
                        @case ('awaiting_approval') {
                          <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>Awaiting Review</span>
                          </span>
                        }
                        @case ('failed') {
                          <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-medium">
                            <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            <span>Failed</span>
                          </span>
                        }
                        @default {
                          <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-mint/10 text-mint-deep border border-mint/20 text-[11px] font-medium">
                            <span class="w-1.5 h-1.5 rounded-full bg-mint animate-pulse"></span>
                            <span>{{ c.status }}</span>
                          </span>
                        }
                      }
                    </td>

                    <!-- Actions -->
                    <td class="py-4 px-6 text-right">
                      <div class="flex items-center justify-end space-x-2">
                        <a [routerLink]="['/cases', c.id]" class="btn-pill-secondary text-xs !py-1 !px-3 hover:!bg-ink hover:!text-white hover:!border-ink transition-all">
                          <span>Inspect</span>
                          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
                        </a>
                        <button (click)="openDeleteDialog(c)" class="p-1.5 text-steel hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete onboarding case and all data">
                          <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

      </div>

    </div>
  `
})
export class DashboardComponent {
  private readonly onboardingFacade = inject(OnboardingFacade);
  private readonly approvalFacade = inject(ApprovalFacade);
  private readonly dialog = inject(MatDialog);

  /** Signal list of onboarding cases */
  readonly cases = this.onboardingFacade.cases;

  /** Total count signal */
  readonly totalCases = this.onboardingFacade.totalCases;

  /** In-progress count signal */
  readonly inProgressCount = this.onboardingFacade.inProgressCases;

  /** Completed cases count signal */
  readonly completedCount = this.onboardingFacade.completedCases;

  /** Average progress percentage signal */
  readonly avgProgress = this.onboardingFacade.averageProgress;

  /** Pending approvals count signal */
  readonly pendingApprovalCount = this.approvalFacade.pendingCount;

  /**
   * Compute percentage completion for a given case.
   */
  getProgress(c: OnboardingCase): number {
    return calculateCaseProgress(c);
  }

  /**
   * Derive uppercase initials from a candidate name for avatar generation.
   */
  getInitials(name: string): string {
    if (!name) return 'NI';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  }

  /**
   * Trigger a manual refresh of cases and approvals data.
   */
  refresh(): void {
    this.onboardingFacade.fetchCases();
    this.approvalFacade.fetchPendingApprovals();
  }

  /**
   * Open confirmation dialog to delete candidate case and cascading execution records.
   */
  openDeleteDialog(c: OnboardingCase): void {
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        caseId: c.id,
        employeeName: c.employeeName,
        role: c.role
      }
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.onboardingFacade.deleteCase(c.id, false);
      }
    });
  }
}
