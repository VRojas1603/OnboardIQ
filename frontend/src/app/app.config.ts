/**
 * Application Runtime Configuration.
 *
 * Configures core Angular providers:
 * - Zone event coalescing for performance
 * - Declarative routing with component input binding enabled
 * - Modern fetch-based HttpClient provider
 * - Asynchronous animations support for Material Design 3 dialogs and overlays
 */

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Coalesce rapid DOM events to minimize change detection cycles
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Configure client-side routes with route param binding directly into component inputs
    provideRouter(routes, withComponentInputBinding()),
    // High-performance Fetch API backend for HttpClient
    provideHttpClient(withFetch()),
    // Lazy-load animation machinery for Angular Material components
    provideAnimationsAsync(),
  ]
};
