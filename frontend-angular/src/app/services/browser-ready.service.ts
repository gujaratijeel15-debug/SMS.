import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class BrowserReadyService {
  private ready = false;

  constructor() {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformBrowser(platformId)) {
      queueMicrotask(() => this.ready = true);
    }
  }

  isReady() {
    return this.ready;
  }
}
