/**
 * Onboarding Application Facade.
 *
 * Coordinates reactive state management for onboarding cases.
 * Exposes Angular Signals for:
 * - Case collections and active selected case
 * - Computed pipeline telemetry (average progress, running count, completed count)
 * - Automatic background 3-second live sync polling
 * - Case creation and route navigation
 */

import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { OnboardingRepositoryPort, CreateCaseParams } from '../../domain/ports/onboarding.repository.port';
import { HttpOnboardingRepository } from '../../infrastructure/repositories/http-onboarding.repository';
import { OnboardingCase, calculateCaseProgress } from '../../domain/models/onboarding-case.entity';

@Injectable({
  providedIn: 'root'
})
export class OnboardingFacade implements OnDestroy {
  private readonly repo: OnboardingRepositoryPort = inject(HttpOnboardingRepository);
  private readonly router = inject(Router);

  /** Reactive signal holding the complete list of onboarding cases */
  readonly cases = signal<OnboardingCase[]>([]);

  /** Currently selected onboarding case for detailed timeline view */
  readonly activeCase = signal<OnboardingCase | null>(null);

  /** Loading state flag for in-flight requests */
  readonly loading = signal<boolean>(false);

  /** Error message string or null */
  readonly error = signal<string | null>(null);

  /** Flag to toggle background polling activity */
  readonly isPollingActive = signal<boolean>(true);

  /** Computed total count of all cases */
  readonly totalCases = computed(() => this.cases().length);

  /** Computed count of active/running onboarding processes */
  readonly inProgressCases = computed(() => this.cases().filter(c => c.status === 'in_progress' || c.status === 'created' || c.status === 'running').length);

  /** Computed count of successfully finished onboarding cases */
  readonly completedCases = computed(() => this.cases().filter(c => c.status === 'completed').length);

  /** Computed count of paused/awaiting cases */
  readonly pausedCases = computed(() => this.cases().filter(c => c.status === 'paused').length);

  /** Computed average completion percentage across all onboarding cases */
  readonly averageProgress = computed(() => {
    const caseList = this.cases();
    if (caseList.length === 0) return 0;
    const total = caseList.reduce((acc, c) => acc + calculateCaseProgress(c), 0);
    return Math.round(total / caseList.length);
  });

  private pollingSub: Subscription | null = null;

  constructor() {
    this.fetchCases();
    this.startPolling();
  }

  /**
   * Start 3-second interval polling to stream live updates from the background workflow engine.
   */
  startPolling(): void {
    if (this.pollingSub) return;
    this.pollingSub = interval(3000).subscribe(() => {
      if (this.isPollingActive()) {
        this.repo.getAllCases().subscribe({
          next: (cases: OnboardingCase[]) => {
            this.cases.set(cases);
            // If activeCase is set, update it from fresh data
            const currentActive = this.activeCase();
            if (currentActive) {
              this.repo.getCaseById(currentActive.id).subscribe({
                next: (detailed: OnboardingCase) => this.activeCase.set(detailed),
                error: () => {}
              });
            }
          },
          error: () => {}
        });
      }
    });
  }

  /**
   * Stop background polling interval.
   */
  stopPolling(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = null;
    }
  }

  /**
   * Explicitly fetch all onboarding cases from the repository.
   */
  fetchCases(): void {
    this.loading.set(true);
    this.repo.getAllCases().subscribe({
      next: (cases: OnboardingCase[]) => {
        this.cases.set(cases);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.message || 'Failed to fetch onboarding cases');
        this.loading.set(false);
      }
    });
  }

  /**
   * Load detailed step telemetry for a specific onboarding case by ID.
   *
   * @param id Target case primary key.
   */
  loadCaseById(id: number): void {
    this.loading.set(true);
    this.repo.getCaseById(id).subscribe({
      next: (caseItem: OnboardingCase) => {
        this.activeCase.set(caseItem);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.message || `Failed to fetch case #${id}`);
        this.loading.set(false);
      }
    });
  }

  /**
   * Register a new candidate, kick off autonomous workflow, and route to timeline detail view.
   *
   * @param params Candidate and manager intake details.
   */
  createCase(params: CreateCaseParams): void {
    this.loading.set(true);
    this.error.set(null);
    this.repo.createCase(params).subscribe({
      next: (newCase: OnboardingCase) => {
        this.cases.update(prev => [newCase, ...prev]);
        this.activeCase.set(newCase);
        this.loading.set(false);
        this.router.navigate(['/cases', newCase.id]);
      },
      error: (err: any) => {
        this.error.set(err?.message || 'Failed to create onboarding case');
        this.loading.set(false);
      }
    });
  }

  /**
   * Delete an onboarding case, update reactive signals, and optionally navigate back to dashboard.
   *
   * @param id Primary key of the case to delete.
   * @param navigateToDashboard Whether to redirect to /dashboard after deletion (default: true).
   */
  deleteCase(id: number, navigateToDashboard: boolean = true): void {
    this.loading.set(true);
    this.error.set(null);
    this.repo.deleteCase(id).subscribe({
      next: () => {
        this.cases.update(prev => prev.filter(c => c.id !== id));
        if (this.activeCase()?.id === id) {
          this.activeCase.set(null);
        }
        this.loading.set(false);
        if (navigateToDashboard) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err: any) => {
        this.error.set(err?.message || `Failed to delete case #${id}`);
        this.loading.set(false);
      }
    });
  }

  /**
   * Dispose subscriptions upon facade destruction.
   */
  ngOnDestroy(): void {
    this.stopPolling();
  }
}
