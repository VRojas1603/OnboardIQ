/**
 * Global Application Navigation Header.
 *
 * Displays primary brand mark, global navigation routes, dynamic badge indicators
 * for pending Human-in-the-Loop approvals, and active cloud engine telemetry badges.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ApprovalFacade } from '../../../features/approval/application/facades/approval.facade';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-hairline">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          <!-- Brand Mark -->
          <div class="flex items-center space-x-6">
            <a routerLink="/dashboard" class="flex items-center space-x-2.5 group">
              <div class="w-8 h-8 rounded-lg bg-ink flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span class="w-3 h-3 rounded-full bg-mint"></span>
              </div>
              <div class="flex items-baseline space-x-1.5">
                <span class="font-bold text-lg text-ink tracking-tight">OnboardIQ</span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-surface-soft border border-hairline text-steel font-medium">Agent Rush</span>
              </div>
            </a>

            <!-- Navigation Links -->
            <nav class="hidden md:flex items-center space-x-1">
              <a 
                routerLink="/dashboard" 
                routerLinkActive="bg-surface text-ink font-semibold"
                [routerLinkActiveOptions]="{ exact: true }"
                class="px-3.5 py-1.5 rounded-full text-sm font-medium text-steel hover:text-ink hover:bg-surface-soft transition-colors"
              >
                Dashboard
              </a>
              <a 
                routerLink="/new-hire" 
                routerLinkActive="bg-surface text-ink font-semibold"
                class="px-3.5 py-1.5 rounded-full text-sm font-medium text-steel hover:text-ink hover:bg-surface-soft transition-colors"
              >
                + New Hire
              </a>
              <a 
                routerLink="/approvals" 
                routerLinkActive="bg-surface text-ink font-semibold"
                class="px-3.5 py-1.5 rounded-full text-sm font-medium text-steel hover:text-ink hover:bg-surface-soft transition-colors inline-flex items-center space-x-1.5"
              >
                <span>Approval Queue</span>
                @if (pendingCount() > 0) {
                  <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-warn/15 text-brand-warn border border-brand-warn/30">
                    {{ pendingCount() }}
                  </span>
                }
              </a>
            </nav>
          </div>

          <!-- Live Telemetry Status Indicators -->
          <div class="flex items-center space-x-3">
            <!-- Vultr Serverless Inference Badge -->
            <div class="hidden sm:inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-surface text-xs font-medium border border-hairline text-steel">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-mint"></span>
              </span>
              <span class="font-mono text-ink text-[11px]">Vultr Llama-3.3-70B</span>
            </div>

            <!-- Slack Webhook Status -->
            <div class="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-surface text-xs font-medium border border-hairline text-steel">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span class="font-mono text-ink text-[11px]">Slack Bot</span>
            </div>

            <!-- Primary Action -->
            <a routerLink="/new-hire" class="btn-pill-primary text-xs !py-1.5 !px-3.5">
              <span>Intake Hire</span>
            </a>
          </div>

        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  /** Approval domain facade providing real-time pending approval signal */
  private readonly approvalFacade = inject(ApprovalFacade);

  /** Signal emitting count of items currently awaiting human sign-off */
  readonly pendingCount = this.approvalFacade.pendingCount;
}
