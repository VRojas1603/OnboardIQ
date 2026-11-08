/**
 * Candidate Intake & Workflow Launch Page Component.
 *
 * Provides candidate registration forms, demo fast-fill preset buttons,
 * and launches the 7-step autonomous onboarding lifecycle powered by
 * Vultr Serverless Inference.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OnboardingFacade } from '../../../application/facades/onboarding.facade';

/** Demo candidate preset contract for hackathon demonstrations */
interface DemoPreset {
  label: string;
  employeeName: string;
  employeeEmail: string;
  role: string;
  department: string;
  managerName: string;
  managerEmail: string;
  startDate: string;
  githubUsername?: string;
}

@Component({
  selector: 'app-new-hire',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <!-- Breadcrumbs & Header -->
      <div>
        <div class="flex items-center space-x-2 text-xs text-steel mb-2">
          <a routerLink="/dashboard" class="hover:text-ink transition-colors">Operations</a>
          <span>/</span>
          <span class="text-ink font-medium">New Hire Intake</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold text-ink tracking-tight">Autonomous Candidate Intake</h1>
        <p class="text-sm text-steel mt-1">Initiates the 7-step autonomous onboarding lifecycle powered by Vultr Serverless Inference.</p>
      </div>

      <!-- Demo Presets Bar -->
      <div class="card-surface p-4 bg-surface-soft/80 border-dashed border-mint/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center space-x-2">
          <span class="material-symbols-outlined text-mint-deep text-[18px]">bolt</span>
          <span class="text-xs font-semibold text-ink">Demo Fast-Fill:</span>
          <span class="text-xs text-steel">Select a preset candidate for rapid hackathon testing:</span>
        </div>
        <div class="flex flex-wrap gap-2">
          @for (preset of presets; track preset.label) {
            <button 
              type="button" 
              (click)="applyPreset(preset)"
              class="px-3 py-1 rounded-full text-xs font-medium bg-white border border-hairline hover:border-mint hover:text-mint-deep hover:shadow-sm transition-all"
            >
              {{ preset.label }}
            </button>
          }
        </div>
      </div>

      <!-- Intake Form Card -->
      <div class="card-surface p-6 sm:p-8">
        <form (ngSubmit)="onSubmit()" class="space-y-6">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <!-- Employee Name -->
            <div>
              <label class="block text-xs font-semibold text-ink mb-1.5">
                Employee Full Name <span class="text-brand-error">*</span>
              </label>
              <input 
                type="text" 
                [(ngModel)]="employeeName" 
                name="employeeName" 
                required 
                placeholder="e.g. Alex Rivera" 
                class="w-full text-sm px-3.5 py-2.5 rounded-lg bg-surface border border-hairline focus:border-mint focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <!-- Employee Email -->
            <div>
              <label class="block text-xs font-semibold text-ink mb-1.5">
                Personal / Contact Email <span class="text-brand-error">*</span>
              </label>
              <input 
                type="email" 
                [(ngModel)]="employeeEmail" 
                name="employeeEmail" 
                required 
                placeholder="e.g. alex.rivera@gmail.com" 
                class="w-full text-sm px-3.5 py-2.5 rounded-lg bg-surface border border-hairline focus:border-mint focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <!-- Role Title -->
            <div>
              <label class="block text-xs font-semibold text-ink mb-1.5">
                Role & Title <span class="text-brand-error">*</span>
              </label>
              <input 
                type="text" 
                [(ngModel)]="role" 
                name="role" 
                required 
                placeholder="e.g. Senior Platform Engineer" 
                class="w-full text-sm px-3.5 py-2.5 rounded-lg bg-surface border border-hairline focus:border-mint focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <!-- Department -->
            <div>
              <label class="block text-xs font-semibold text-ink mb-1.5">
                Department <span class="text-brand-error">*</span>
              </label>
              <input 
                type="text" 
                [(ngModel)]="department" 
                name="department" 
                required 
                placeholder="e.g. Infrastructure Engineering" 
                class="w-full text-sm px-3.5 py-2.5 rounded-lg bg-surface border border-hairline focus:border-mint focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <!-- Manager Name -->
            <div>
              <label class="block text-xs font-semibold text-ink mb-1.5">
                Hiring Manager Name <span class="text-brand-error">*</span>
              </label>
              <input 
                type="text" 
                [(ngModel)]="managerName" 
                name="managerName" 
                required 
                placeholder="e.g. Jordan Taylor" 
                class="w-full text-sm px-3.5 py-2.5 rounded-lg bg-surface border border-hairline focus:border-mint focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <!-- Manager Email -->
            <div>
              <label class="block text-xs font-semibold text-ink mb-1.5">
                Hiring Manager Email <span class="text-brand-error">*</span>
              </label>
              <input 
                type="email" 
                [(ngModel)]="managerEmail" 
                name="managerEmail" 
                required 
                placeholder="e.g. jordan.taylor@company.com" 
                class="w-full text-sm px-3.5 py-2.5 rounded-lg bg-surface border border-hairline focus:border-mint focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <!-- Start Date -->
            <div>
              <label class="block text-xs font-semibold text-ink mb-1.5">
                First Day (Start Date) <span class="text-brand-error">*</span>
              </label>
              <input 
                type="date" 
                [(ngModel)]="startDate" 
                name="startDate" 
                required 
                class="w-full text-sm px-3.5 py-2.5 rounded-lg bg-surface border border-hairline focus:border-mint focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <!-- Candidate GitHub Username (Optional) -->
            <div>
              <label class="block text-xs font-semibold text-ink mb-1.5 flex items-center justify-between">
                <span>GitHub Username</span>
                <span class="text-steel font-normal text-[11px]">(Optional)</span>
              </label>
              <input 
                type="text" 
                [(ngModel)]="githubUsername" 
                name="githubUsername" 
                placeholder="e.g. octocat (receives Org invite)" 
                class="w-full text-sm px-3.5 py-2.5 rounded-lg bg-surface border border-hairline focus:border-mint focus:bg-white focus:outline-none transition-colors"
              />
            </div>

          </div>

          <!-- Workflow Execution Preview Notice -->
          <div class="p-4 rounded-lg bg-surface border border-hairline text-xs space-y-2 text-steel">
            <div class="flex items-center space-x-2 text-ink font-semibold">
              <span class="material-symbols-outlined text-[18px] text-mint-deep">info</span>
              <span>Autonomous Execution Sequence:</span>
            </div>
            <ul class="list-disc pl-5 space-y-1 text-steel">
              <li>Step 1 immediately invokes <strong>Vultr Serverless Inference (Llama-3.3-70B)</strong> to generate a personalized Welcome Email, 30-Day Roadmap, and IT Equipment Checklist.</li>
              <li>Workflow will automatically pause at <strong>Step 2 (Human-in-the-Loop Review)</strong> for manager sign-off before provisioning credentials.</li>
              <li>Upon approval, accounts on Corporate Identity, GitHub Organization (TestCompany-OnboardIQ-Demo), and Slack announcements are provisioned autonomously, followed by Day 0 Welcome Email delivery via Gmail SMTP.</li>
            </ul>
          </div>

          <!-- Error Alert if any -->
          @if (error()) {
            <div class="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-brand-error flex items-center space-x-2">
              <span class="material-symbols-outlined text-[18px]">error</span>
              <span>{{ error() }}</span>
            </div>
          }

          <!-- Form Actions -->
          <div class="flex items-center justify-end space-x-4 pt-4 border-t border-hairline">
            <a routerLink="/dashboard" class="btn-pill-secondary text-xs !py-2.5 !px-5">
              Cancel
            </a>
            <button 
              type="submit" 
              [disabled]="loading() || !isValid()"
              class="btn-pill-mint text-xs !py-2.5 !px-6"
            >
              @if (loading()) {
                <span class="inline-block animate-spin mr-1">↻</span>
                <span>Initializing Orchestrator...</span>
              } @else {
                <span class="material-symbols-outlined text-[18px]">rocket_launch</span>
                <span>Launch Autonomous Workflow</span>
              }
            </button>
          </div>

        </form>
      </div>

    </div>
  `
})
export class NewHireComponent {
  private readonly onboardingFacade = inject(OnboardingFacade);

  /** Candidate profile form model fields */
  employeeName = 'Alex Rivera';
  employeeEmail = 'alex.rivera@example.com';
  role = 'Senior Platform Engineer';
  department = 'Infrastructure';
  managerName = 'Jordan Taylor';
  managerEmail = 'jordan.taylor@example.com';
  startDate = '2026-11-15';
  githubUsername = '';

  /** Injected facade loading and error signals */
  readonly loading = this.onboardingFacade.loading;
  readonly error = this.onboardingFacade.error;

  /** Pre-configured candidate profiles for quick testing */
  readonly presets: DemoPreset[] = [
    {
      label: 'Senior Platform Engineer',
      employeeName: 'Alex Rivera',
      employeeEmail: 'alex.rivera@example.com',
      role: 'Senior Platform Engineer',
      department: 'Infrastructure',
      managerName: 'Jordan Taylor',
      managerEmail: 'jordan.taylor@example.com',
      startDate: '2026-11-15',
      githubUsername: 'alex-rivera-dev'
    },
    {
      label: 'Lead Product Designer',
      employeeName: 'Elena Rostova',
      employeeEmail: 'elena.rostova@example.com',
      role: 'Lead Product Designer',
      department: 'Product & Design',
      managerName: 'Sarah Chen',
      managerEmail: 'sarah.chen@example.com',
      startDate: '2026-11-20',
      githubUsername: 'elena-rostova-design'
    },
    {
      label: 'AI Research Scientist',
      employeeName: 'Kaito Tanaka',
      employeeEmail: 'kaito.tanaka@example.com',
      role: 'AI Infrastructure Scientist',
      department: 'Machine Learning',
      managerName: 'Dr. Marcus Vance',
      managerEmail: 'marcus.vance@example.com',
      startDate: '2026-12-01',
      githubUsername: 'kaito-tanaka-ai'
    }
  ];

  /**
   * Apply a selected demo preset profile to the form fields.
   *
   * @param preset The chosen demo profile.
   */
  applyPreset(preset: DemoPreset): void {
    this.employeeName = preset.employeeName;
    this.employeeEmail = preset.employeeEmail;
    this.role = preset.role;
    this.department = preset.department;
    this.managerName = preset.managerName;
    this.managerEmail = preset.managerEmail;
    this.startDate = preset.startDate;
    this.githubUsername = preset.githubUsername || '';
  }

  /**
   * Validate that all mandatory intake fields are filled.
   */
  isValid(): boolean {
    return !!(this.employeeName && this.employeeEmail && this.role && this.department && this.managerName && this.managerEmail && this.startDate);
  }

  /**
   * Handle form submission, delegating case creation to the facade.
   */
  onSubmit(): void {
    if (!this.isValid()) return;
    this.onboardingFacade.createCase({
      employeeName: this.employeeName,
      employeeEmail: this.employeeEmail,
      role: this.role,
      department: this.department,
      managerName: this.managerName,
      managerEmail: this.managerEmail,
      startDate: this.startDate,
      githubUsername: this.githubUsername.trim() || undefined,
    });
  }
}
