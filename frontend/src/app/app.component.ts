/**
 * Root Application Component.
 *
 * Hosts the global application shell including navigation header,
 * main router outlet, and unified system status footer.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/layout/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-[#fafafa]">
      <!-- Application Top Header -->
      <app-header></app-header>

      <!-- Main Content Outlet -->
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <!-- Application Global Footer -->
      <footer class="bg-white border-t border-hairline mt-16 py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-steel">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-mint"></span>
            <span class="font-semibold text-ink">OnboardIQ</span>
            <span>&bull;</span>
            <span>Vultr Agent Rush Hackathon</span>
            <span>&bull;</span>
            <span class="text-steel">Powering the Future of Work</span>
          </div>

          <div class="flex items-center space-x-4">
            <span class="font-mono text-[11px] text-muted">Vultr Serverless Inference: llama-3.3-70b-instruct</span>
            <span class="px-2 py-0.5 rounded-full bg-surface border border-hairline text-ink font-medium text-[11px]">Angular 21 + M3</span>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class AppComponent {
  /** Application brand display title */
  title = 'OnboardIQ';
}
